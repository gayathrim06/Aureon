import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from extensions import db
from models import Sprint, Team, Project, User, AuditLog, Role, Task, TaskStatusHistory, Notification
from services.rbac_service import get_user_scope, get_auth_user

sprint_bp = Blueprint('sprints', __name__, url_prefix='/api/v1/sprints')

def _parse_uuid(val):
    if not val:
        return None
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return None

def _get_auth_user():
    return get_auth_user()

def _find_sprint(sprint_id):
    if not sprint_id:
        return None
    s_uuid = _parse_uuid(sprint_id)
    if s_uuid:
        found = Sprint.query.get(s_uuid)
        if found:
            return found
    clean_id = str(sprint_id).strip().lower()
    for s in Sprint.query.all():
        str_id = str(s.id).lower()
        if clean_id in str_id or str_id.startswith(clean_id) or str_id.endswith(clean_id):
            return s
        if clean_id in s.name.lower():
            return s
    return None

@sprint_bp.route('/', methods=['GET', 'POST'])
@sprint_bp.route('', methods=['GET', 'POST'])
@jwt_required(optional=True)
def manage_sprints():
    user = _get_auth_user()
    scope = get_user_scope(user)

    if request.method == 'GET':
        query = Sprint.query

        # Enforce server-side role isolation
        if not scope.is_admin:
            if scope.is_pm:
                query = query.filter(Sprint.project_id.in_(scope.project_ids))
            elif scope.is_lead:
                query = query.filter(
                    (Sprint.team_id.in_(scope.team_ids)) |
                    (Sprint.project_id.in_(scope.project_ids))
                )
            elif scope.is_dev:
                query = query.filter(Sprint.id.in_(scope.sprint_ids))

        proj_param = request.args.get('project_id')
        team_param = request.args.get('team_id')
        status_param = request.args.get('status')

        if proj_param:
            p_uuid = _parse_uuid(proj_param)
            query = query.filter_by(project_id=p_uuid or proj_param)

        if team_param:
            t_uuid = _parse_uuid(team_param)
            query = query.filter_by(team_id=t_uuid or team_param)

        if status_param and status_param.upper() != 'ALL':
            query = query.filter(Sprint.status.ilike(status_param.strip()))

        sprints = query.order_by(Sprint.created_at.desc()).all()
        return jsonify({'success': True, 'count': len(sprints), 'sprints': [s.to_dict() for s in sprints]}), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name') or data.get('sprint_name')
        if not name or not str(name).strip():
            return jsonify({'success': False, 'message': 'Validation Error: Sprint name is required.'}), 400

        name = str(name).strip()
        goal = data.get('goal', '') or data.get('sprint_goal', '')
        status = (data.get('status') or 'PLANNED').upper()
        project_id_raw = data.get('project_id') or data.get('projectId')
        team_id_raw = data.get('team_id') or data.get('teamId')
        start_date_str = data.get('start_date') or data.get('startDate')
        end_date_str = data.get('end_date') or data.get('endDate')

        project_id = _parse_uuid(project_id_raw)
        team_id = _parse_uuid(team_id_raw)

        # ─── TEAM LEAD SPRINT SCOPE CHECK ───
        if user and user.role_name == 'ROLE_LEAD':
            lead_teams = Team.query.filter(
                (Team.team_leader_id == user.id) | (Team.lead_id == user.id)
            ).all()
            lead_team_ids = [str(t.id) for t in lead_teams]
            lead_project_ids = [str(t.project_id) for t in lead_teams if t.project_id]
            lead_direct_projs = Project.query.filter_by(lead_id=user.id).all()
            lead_project_ids += [str(p.id) for p in lead_direct_projs]

            # If team_id is provided, verify it belongs to one of the teams led by this Team Lead
            if team_id and str(team_id) not in lead_team_ids and str(project_id) not in lead_project_ids and user.role_name != 'ROLE_ADMIN':
                return jsonify({'success': False, 'message': '403 Forbidden: Cannot create sprint for a team you do not lead.'}), 403

            # If project_id provided, resolve matching team among lead teams
            if not team_id and project_id:
                matching_team = next((t for t in lead_teams if str(t.project_id) == str(project_id)), None)
                if matching_team:
                    team_id = matching_team.id

            # If neither provided, default to first lead team and its project
            if not team_id and not project_id and lead_teams:
                team_id = lead_teams[0].id
                if lead_teams[0].project_id:
                    project_id = lead_teams[0].project_id

        # Fallback to active project if not explicitly sent
        if not project_id:
            first_p = Project.query.filter_by(is_active=True).first()
            if first_p:
                project_id = first_p.id

        if not project_id:
            return jsonify({'success': False, 'message': 'Validation Error: A valid project_id is required.'}), 400

        project = Project.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'message': 'Validation Error: Project not found.'}), 404

        # Resolve or auto-provision team assigned to project
        team = None
        if team_id:
            team = Team.query.get(team_id)
            # If specified team has no project yet, associate it with this project
            if team and not team.project_id:
                team.project_id = project_id
                team.availability_status = 'ASSIGNED'
                db.session.flush()

        if not team or (team.project_id and str(team.project_id) != str(project_id)):
            # Look for existing team assigned to this project
            team = Team.query.filter_by(project_id=project_id, is_deleted=False).first()
            if team:
                team_id = team.id

        if not team:
            # Check for an unassigned team in tbl_team to assign to this project
            unassigned_t = Team.query.filter_by(project_id=None, is_deleted=False).first()
            if unassigned_t:
                unassigned_t.project_id = project_id
                unassigned_t.availability_status = 'ASSIGNED'
                if user and user.role_name == 'ROLE_LEAD':
                    unassigned_t.team_leader_id = user.id
                    unassigned_t.lead_id = user.id
                db.session.flush()
                team = unassigned_t
                team_id = team.id
            else:
                # Automatically provision a dedicated Engineering Squad for this project
                proj_name = project.name if project else 'Engineering'
                team = Team(
                    name=f"{proj_name} Core Squad",
                    team_code=f"TEAM-{str(project_id)[:4].upper()}",
                    description=f"Primary delivery team for {proj_name}",
                    project_id=project_id,
                    team_leader_id=user.id if user else None,
                    lead_id=user.id if user else None,
                    status='ACTIVE',
                    availability_status='ASSIGNED',
                    is_active=True,
                    is_deleted=False
                )
                db.session.add(team)
                db.session.flush()
                team_id = team.id

                if user:
                    tm = TeamMember(team_id=team.id, user_id=user.id, role_in_team='Team Lead')
                    db.session.add(tm)

                # Sync developers allocated to this project from ProjectMember
                from models import ProjectMember
                p_mems = ProjectMember.query.filter_by(project_id=project_id).all()
                for pm in p_mems:
                    if pm.user_id and (not user or str(pm.user_id) != str(user.id)):
                        if not TeamMember.query.filter_by(team_id=team.id, user_id=pm.user_id).first():
                            db.session.add(TeamMember(team_id=team.id, user_id=pm.user_id, role_in_team='Software Engineer'))
                db.session.flush()

        s_date = None
        e_date = None
        try:
            if start_date_str:
                s_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d').date()
            if end_date_str:
                e_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'success': False, 'message': 'Validation Error: Invalid date format. Use YYYY-MM-DD.'}), 400

        if not s_date or not e_date:
            return jsonify({'success': False, 'message': 'Validation Error: Start Date and End Date are required.'}), 400

        if e_date < s_date:
            return jsonify({'success': False, 'message': 'Validation Error: End date cannot be before start date.'}), 400

        # Ensure Team strictly belongs to the selected Project
        if not team.project_id:
            team.project_id = project_id
            team.availability_status = 'ASSIGNED'
            db.session.flush()
        elif str(team.project_id) != str(project_id):
            # Team from another project was referenced; resolve or auto-create the team for this project
            proj_team = Team.query.filter_by(project_id=project_id, is_deleted=False).first()
            if not proj_team:
                proj_name = project.name if project else 'Engineering'
                proj_team = Team(
                    name=f"{proj_name} Core Squad",
                    team_code=f"TEAM-{str(project_id)[:4].upper()}",
                    description=f"Primary delivery team for {proj_name}",
                    project_id=project_id,
                    team_leader_id=user.id if user else None,
                    lead_id=user.id if user else None,
                    status='ACTIVE',
                    availability_status='ASSIGNED',
                    is_active=True,
                    is_deleted=False
                )
                db.session.add(proj_team)
                db.session.flush()
                if user:
                    tm = TeamMember(team_id=proj_team.id, user_id=user.id, role_in_team='Team Lead')
                    db.session.add(tm)
                from models import ProjectMember
                p_mems = ProjectMember.query.filter_by(project_id=project_id).all()
                for pm in p_mems:
                    if pm.user_id and (not user or str(pm.user_id) != str(user.id)):
                        if not TeamMember.query.filter_by(team_id=proj_team.id, user_id=pm.user_id).first():
                            db.session.add(TeamMember(team_id=proj_team.id, user_id=pm.user_id, role_in_team='Software Engineer'))
                db.session.flush()
            team = proj_team
            team_id = proj_team.id

        # Validate active status vs start date
        if status == 'ACTIVE' and s_date > date.today():
            status = 'PLANNED'

        # Configured Capacity (Velocity target in Story Points)
        capacity_raw = data.get('capacity') if 'capacity' in data else (data.get('velocity') if 'velocity' in data else data.get('capacityStoryPoints'))
        velocity_val = None
        if capacity_raw is not None and str(capacity_raw).strip() != '' and str(capacity_raw).lower() != 'null':
            try:
                v = int(float(str(capacity_raw).strip()))
                if v > 0:
                    velocity_val = v
            except (ValueError, TypeError):
                velocity_val = None

        sprint = Sprint(
            name=name,
            goal=goal,
            status=status,
            start_date=s_date,
            end_date=e_date,
            project_id=project_id,
            team_id=team_id,
            velocity=velocity_val,
            created_by_id=user.id if user else None
        )
        db.session.add(sprint)
        db.session.flush()

        try:
            log = AuditLog(
                user_email=user.email if user else 'system',
                role_name=user.role_name if user else 'ROLE_LEAD',
                action='SPRINT_CREATED',
                details=f"Created sprint '{name}' for team '{team.display_name}' in project '{project.display_name}'"
            )
            db.session.add(log)
            db.session.commit()
        except Exception:
            db.session.commit()

        return jsonify({'success': True, 'message': 'Sprint created successfully.', 'sprint': sprint.to_dict()}), 201

@sprint_bp.route('/<string:sprint_id>', methods=['GET', 'PUT', 'DELETE'])
@sprint_bp.route('/<string:sprint_id>/', methods=['GET', 'PUT', 'DELETE'])
@jwt_required(optional=True)
def sprint_detail(sprint_id):
    user = _get_auth_user()
    scope = get_user_scope(user)
    sprint = _find_sprint(sprint_id)
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

    if not scope.can_access_sprint(sprint):
        return jsonify({'success': False, 'message': '403 Forbidden: You do not have permission to access this sprint.'}), 403

    if request.method == 'GET':
        return jsonify({'success': True, 'sprint': sprint.to_dict()}), 200

    if request.method in ('PUT', 'DELETE') and scope.is_dev:
        return jsonify({'success': False, 'message': '403 Forbidden: Developers cannot modify or delete sprints.'}), 403

    if request.method == 'PUT':
        data = request.get_json() or {}
        if 'name' in data and data['name']:
            sprint.name = str(data['name']).strip()
        if 'goal' in data:
            sprint.goal = data['goal']
        if 'status' in data:
            sprint.status = str(data['status']).upper()
        if 'start_date' in data and data['start_date']:
            try:
                sprint.start_date = datetime.strptime(data['start_date'].split('T')[0], '%Y-%m-%d').date()
            except ValueError:
                pass
        if 'end_date' in data and data['end_date']:
            try:
                new_e_date = datetime.strptime(data['end_date'].split('T')[0], '%Y-%m-%d').date()
                if sprint.start_date and new_e_date < sprint.start_date:
                    return jsonify({'success': False, 'message': 'Validation Error: End date cannot be before start date.'}), 400
                sprint.end_date = new_e_date
            except ValueError:
                pass

        if 'capacity' in data or 'velocity' in data or 'capacityStoryPoints' in data:
            cap_raw = data.get('capacity') if 'capacity' in data else (data.get('velocity') if 'velocity' in data else data.get('capacityStoryPoints'))
            if cap_raw is None or str(cap_raw).strip() == '' or str(cap_raw).lower() == 'null':
                sprint.velocity = None
            else:
                try:
                    v = int(float(str(cap_raw).strip()))
                    sprint.velocity = v if v > 0 else None
                except (ValueError, TypeError):
                    pass

        db.session.commit()
        return jsonify({'success': True, 'message': 'Sprint updated.', 'sprint': sprint.to_dict()}), 200

    if request.method == 'DELETE':
        # Preserve tasks: return tasks in this sprint to product backlog
        Task.query.filter_by(sprint_id=sprint.id).update({'sprint_id': None})
        db.session.delete(sprint)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Sprint deleted. Sprint tasks were returned to the product backlog.'}), 200

@sprint_bp.route('/<string:sprint_id>/status', methods=['PATCH', 'PUT'])
@sprint_bp.route('/<string:sprint_id>/status/', methods=['PATCH', 'PUT'])
@jwt_required(optional=True)
def update_sprint_status(sprint_id):
    user = _get_auth_user()
    scope = get_user_scope(user)
    sprint = _find_sprint(sprint_id)
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

    if not scope.can_access_sprint(sprint) or scope.is_dev:
        return jsonify({'success': False, 'message': '403 Forbidden: Cannot change status of this sprint.'}), 403

    data = request.get_json() or {}
    new_status = (data.get('status') or 'ACTIVE').upper()
    if new_status == 'ACTIVE' and sprint.start_date and sprint.start_date > date.today():
        # Allow explicit override if requested with force flag, otherwise warn
        if not data.get('force', False):
            return jsonify({'success': False, 'message': f'Sprint start date is {sprint.start_date.isoformat()}. Cannot activate before start date.'}), 400

    sprint.status = new_status
    db.session.commit()

    return jsonify({'success': True, 'message': f'Sprint status updated to {new_status}.', 'sprint': sprint.to_dict()}), 200

# ─── SPRINT BACKLOG MANAGEMENT ───────────────────────────────────────────────

@sprint_bp.route('/<string:sprint_id>/tasks', methods=['GET', 'POST'])
@sprint_bp.route('/<string:sprint_id>/tasks/', methods=['GET', 'POST'])
@jwt_required(optional=True)
def sprint_tasks(sprint_id):
    user = _get_auth_user()
    scope = get_user_scope(user)
    sprint = _find_sprint(sprint_id)
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

    if not scope.can_access_sprint(sprint):
        return jsonify({'success': False, 'message': '403 Forbidden: Access denied to this sprint.'}), 403

    if request.method == 'GET':
        query = Task.query.filter_by(sprint_id=sprint.id)
        if scope.is_dev:
            query = query.filter_by(assigned_to_id=user.id)
        tasks = query.all()
        return jsonify({
            'success': True,
            'sprint': sprint.to_dict(),
            'count': len(tasks),
            'tasks': [t.to_dict() for t in tasks]
        }), 200

    if request.method == 'POST':
        if scope.is_dev:
            return jsonify({'success': False, 'message': '403 Forbidden: Developers cannot assign tasks to sprints.'}), 403

        # Add tasks from product backlog to this sprint
        data = request.get_json() or {}
        raw_ids = data.get('task_ids') or [data.get('task_id')]
        task_ids = [_parse_uuid(t) for t in raw_ids if t]

        if not task_ids:
            return jsonify({'success': False, 'message': 'task_ids list is required.'}), 400

        added_tasks = []
        for tid in task_ids:
            t_uuid = _parse_uuid(tid)
            task = Task.query.get(t_uuid) if t_uuid else None
            if not task:
                continue

            # Prevent cross-project task assignments
            if task.project_id and sprint.project_id and str(task.project_id) != str(sprint.project_id):
                return jsonify({
                    'success': False,
                    'message': f"Cross-project error: Task '{task.display_title}' belongs to another project and cannot be added to this sprint."
                }), 400

            old_sprint_id = str(task.sprint_id) if task.sprint_id else 'Backlog'
            task.sprint_id = sprint.id
            task.project_id = sprint.project_id
            task.team_id = sprint.team_id
            if task.status in ('BACKLOG', None):
                task.status = 'TODO'

            # Audit history
            hist = TaskStatusHistory(
                task_id=task.id,
                user_id=user.id if user else None,
                action_type='SPRINT_ASSIGNED',
                old_value=old_sprint_id,
                new_value=sprint.name,
                details=f"Task added to sprint '{sprint.name}'"
            )
            db.session.add(hist)
            added_tasks.append(task)

        db.session.commit()
        return jsonify({
            'success': True,
            'message': f"{len(added_tasks)} task(s) added to sprint '{sprint.name}'.",
            'added_count': len(added_tasks),
            'tasks': [t.to_dict() for t in added_tasks],
            'sprint': sprint.to_dict()
        }), 200

@sprint_bp.route('/<string:sprint_id>/tasks/<string:task_id>', methods=['DELETE'])
@sprint_bp.route('/<string:sprint_id>/tasks/<string:task_id>/', methods=['DELETE'])
@jwt_required(optional=True)
def remove_task_from_sprint(sprint_id, task_id):
    user = _get_auth_user()
    scope = get_user_scope(user)
    sprint = _find_sprint(sprint_id)
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

    if not scope.can_access_sprint(sprint) or scope.is_dev:
        return jsonify({'success': False, 'message': '403 Forbidden: Cannot remove tasks from this sprint.'}), 403

    t_uuid = _parse_uuid(task_id)
    task = Task.query.get(t_uuid or task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    task.sprint_id = None
    if task.status in ('TODO', None):
        task.status = 'BACKLOG'
    hist = TaskStatusHistory(
        task_id=task.id,
        user_id=user.id if user else None,
        action_type='REMOVED_TO_BACKLOG',
        old_value=sprint.name,
        new_value='Product Backlog',
        details=f"Task removed from sprint '{sprint.name}' and returned to Product Backlog"
    )
    db.session.add(hist)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Task '{task.display_title}' returned to product backlog.",
        'task': task.to_dict(),
        'sprint': sprint.to_dict()
    }), 200

# ─── SPRINT COMPLETION & CARRY-FORWARD ────────────────────────────────────────

@sprint_bp.route('/<string:sprint_id>/complete', methods=['POST'])
@sprint_bp.route('/<string:sprint_id>/complete/', methods=['POST'])
@jwt_required(optional=True)
def complete_sprint(sprint_id):
    user = _get_auth_user()
    scope = get_user_scope(user)
    sprint = _find_sprint(sprint_id)
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

    if not scope.can_access_sprint(sprint) or scope.is_dev:
        return jsonify({'success': False, 'message': '403 Forbidden: Cannot complete this sprint.'}), 403

    data = request.get_json() or {}
    target_sprint_id_raw = data.get('target_sprint_id')
    completion_notes = data.get('completion_notes', '')

    target_sprint = None
    if target_sprint_id_raw:
        target_sprint = _find_sprint(target_sprint_id_raw)
        if target_sprint and str(target_sprint.project_id) != str(sprint.project_id):
            return jsonify({'success': False, 'message': 'Validation Error: Target sprint must belong to the same project.'}), 400

    sprint_tasks = Task.query.filter_by(sprint_id=sprint.id).all()
    completed_tasks = [t for t in sprint_tasks if t.status in ('COMPLETED', 'DONE')]
    incomplete_tasks = [t for t in sprint_tasks if t.status not in ('COMPLETED', 'DONE')]

    # Preserve incomplete tasks: carry forward or return to backlog
    carried_count = 0
    for task in incomplete_tasks:
        if target_sprint:
            task.sprint_id = target_sprint.id
            task.team_id = target_sprint.team_id
            action_desc = f"Carried forward to future sprint '{target_sprint.name}'"
        else:
            task.sprint_id = None
            action_desc = "Returned to Product Backlog upon sprint completion"

        hist = TaskStatusHistory(
            task_id=task.id,
            user_id=user.id if user else None,
            action_type='TASK_CARRIED_FORWARD',
            old_value=str(sprint.id),
            new_value=str(target_sprint.id) if target_sprint else 'Product Backlog',
            details=f"Carried forward from sprint '{sprint.name}'. {action_desc}"
        )
        db.session.add(hist)
        carried_count += 1

    sprint.status = 'COMPLETED'
    sprint.completion_date = date.today()
    sprint.completion_notes = completion_notes
    sprint.carry_forward_tasks_count = carried_count

    try:
        log = AuditLog(
            user_email=user.email if user else 'system',
            role_name=user.role_name if user else 'ROLE_LEAD',
            action='SPRINT_COMPLETED',
            details=f"Sprint '{sprint.name}' completed. {len(completed_tasks)} tasks completed, {carried_count} carried forward."
        )
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Sprint '{sprint.name}' marked COMPLETED.",
        'completed_tasks_count': len(completed_tasks),
        'carry_forward_tasks_count': carried_count,
        'sprint': sprint.to_dict()
    }), 200

# ─── SPRINT REVIEW & RETROSPECTIVE ───────────────────────────────────────────

@sprint_bp.route('/<string:sprint_id>/review', methods=['GET'])
@sprint_bp.route('/<string:sprint_id>/review/', methods=['GET'])
@jwt_required(optional=True)
def sprint_review(sprint_id):
    user = _get_auth_user()
    scope = get_user_scope(user)
    sprint = _find_sprint(sprint_id)
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

    if not scope.can_access_sprint(sprint):
        return jsonify({'success': False, 'message': '403 Forbidden: Access denied to this sprint review.'}), 403
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

    sprint_tasks = Task.query.filter_by(sprint_id=sprint.id).all()
    completed = [t for t in sprint_tasks if t.status in ('COMPLETED', 'DONE')]
    incomplete = [t for t in sprint_tasks if t.status not in ('COMPLETED', 'DONE')]

    # Check for tasks carried forward from this specific sprint
    carried_history = TaskStatusHistory.query.filter_by(
        action_type='TASK_CARRIED_FORWARD',
        old_value=str(sprint.id)
    ).all()
    if carried_history:
        carried_task_ids = [h.task_id for h in carried_history]
        carried_tasks = Task.query.filter(Task.id.in_(carried_task_ids)).all()
        for ct in carried_tasks:
            if ct not in incomplete and ct not in completed:
                incomplete.append(ct)

    all_reviewed_tasks = completed + incomplete
    overdue = [t for t in all_reviewed_tasks if t.is_overdue]
    delayed_with_remarks = [t for t in all_reviewed_tasks if t.delay_remark]

    total_count = len(all_reviewed_tasks)
    comp_pct = round((len(completed) / total_count * 100), 2) if total_count > 0 else 0.0

    return jsonify({
        'success': True,
        'sprint': sprint.to_dict(),
        'review': {
            'planned_tasks_count': total_count,
            'completed_tasks_count': len(completed),
            'incomplete_tasks_count': len(incomplete),
            'overdue_tasks_count': len(overdue),
            'completion_percentage': comp_pct,
            'planned_story_points': sprint.to_dict()['planned_story_points'],
            'completed_story_points': sprint.to_dict()['completed_story_points'],
            'remaining_story_points': sprint.to_dict()['remaining_story_points'],
            'capacity': sprint.to_dict()['capacity'],
            'capacity_display': sprint.to_dict()['capacity_display'],
            'completed_tasks': [t.to_dict() for t in completed],
            'incomplete_tasks': [t.to_dict() for t in incomplete],
            'overdue_tasks': [t.to_dict() for t in overdue],
            'delayed_tasks': [
                {
                    'task_id': str(t.id),
                    'title': t.display_title,
                    'assignee': t.assignee_display_name,
                    'delay_reason': t.delay_reason,
                    'delay_remark': t.delay_remark,
                    'team_leader_review': t.team_leader_review
                } for t in delayed_with_remarks
            ],
            'developer_distribution': sprint.to_dict()['developer_distribution'],
            'carry_forward_tasks_count': sprint.carry_forward_tasks_count or len(incomplete)
        }
    }), 200
