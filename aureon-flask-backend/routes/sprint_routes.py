import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from extensions import db
from models import Sprint, Team, Project, User, AuditLog, Role, Task, TaskStatusHistory, Notification

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
    user_id = get_jwt_identity()
    user = None
    if user_id:
        u_uuid = _parse_uuid(user_id)
        user = User.query.get(u_uuid or user_id)
    if not user:
        user = User.query.first()
    return user

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

    if request.method == 'GET':
        query = Sprint.query
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
            lead_team = Team.query.filter((Team.team_leader_id == user.id) | (Team.lead_id == user.id)).first()
            if lead_team:
                if team_id and str(team_id) != str(lead_team.id):
                    return jsonify({'success': False, 'message': '403 Forbidden: Cannot create sprint for another team.'}), 403
                team_id = lead_team.id
                if not project_id and lead_team.project_id:
                    project_id = lead_team.project_id

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

        # Fallback to team assigned to project if not provided
        if not team_id:
            first_t = Team.query.filter_by(project_id=project_id, is_deleted=False).first()
            if first_t:
                team_id = first_t.id
            else:
                first_t = Team.query.filter_by(is_deleted=False).first()
                if first_t:
                    team_id = first_t.id

        if not team_id:
            return jsonify({'success': False, 'message': 'Validation Error: A valid team_id is required.'}), 400

        team = Team.query.get(team_id)
        if not team:
            return jsonify({'success': False, 'message': 'Validation Error: Team not found.'}), 404

        # Validate Team belongs to selected Project
        if team.project_id and str(team.project_id) != str(project_id):
            return jsonify({'success': False, 'message': 'Validation Error: Team does not belong to the selected project.'}), 400
        elif not team.project_id:
            # Associate team with project if previously available
            team.project_id = project_id
            team.availability_status = 'ASSIGNED'

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

        # Validate active status vs start date
        if status == 'ACTIVE' and s_date > date.today():
            status = 'PLANNED'

        sprint = Sprint(
            name=name,
            goal=goal,
            status=status,
            start_date=s_date,
            end_date=e_date,
            project_id=project_id,
            team_id=team_id,
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
    sprint = _find_sprint(sprint_id)
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

    # Team Lead scope check
    if user and user.role_name == 'ROLE_LEAD':
        lead_team = Team.query.filter((Team.team_leader_id == user.id) | (Team.lead_id == user.id)).first()
        if lead_team and sprint.team_id and str(sprint.team_id) != str(lead_team.id):
            return jsonify({'success': False, 'message': '403 Forbidden: Cannot view or modify another team\'s sprint.'}), 403

    if request.method == 'GET':
        return jsonify({'success': True, 'sprint': sprint.to_dict()}), 200

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
    sprint = _find_sprint(sprint_id)
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

    if user and user.role_name == 'ROLE_LEAD':
        lead_team = Team.query.filter((Team.team_leader_id == user.id) | (Team.lead_id == user.id)).first()
        if lead_team and sprint.team_id and str(sprint.team_id) != str(lead_team.id):
            return jsonify({'success': False, 'message': '403 Forbidden: Cannot change status of another team\'s sprint.'}), 403

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
    sprint = _find_sprint(sprint_id)
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

    if request.method == 'GET':
        tasks = Task.query.filter_by(sprint_id=sprint.id).all()
        return jsonify({
            'success': True,
            'sprint': sprint.to_dict(),
            'count': len(tasks),
            'tasks': [t.to_dict() for t in tasks]
        }), 200

    if request.method == 'POST':
        # Add tasks from product backlog to this sprint
        data = request.get_json() or {}
        raw_ids = data.get('task_ids') or [data.get('task_id')]
        task_ids = [_parse_uuid(t) for t in raw_ids if t]

        if not task_ids:
            return jsonify({'success': False, 'message': 'task_ids list is required.'}), 400

        added_tasks = []
        for tid in task_ids:
            task = Task.query.get(tid)
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
    sprint = _find_sprint(sprint_id)
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

    t_uuid = _parse_uuid(task_id)
    task = Task.query.get(t_uuid or task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    task.sprint_id = None
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
    sprint = _find_sprint(sprint_id)
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

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
    sprint = _find_sprint(sprint_id)
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
