import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from extensions import db
from models import (
    Task, TaskAttachment, TaskStatusHistory, TaskComment, Team, TeamMember, 
    Sprint, User, AuditLog, Notification, Role, Project, Risk, Commit
)

task_bp = Blueprint('tasks', __name__, url_prefix='/api/v1/tasks')
developer_bp = Blueprint('developer', __name__, url_prefix='/api/v1/developer')

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
    try:
        user_id = get_jwt_identity()
        if user_id:
            u_uuid = _parse_uuid(user_id)
            user = User.query.get(u_uuid or user_id)
            if user:
                return user
    except Exception:
        pass
    return User.query.first()

def _resolve_assigned_user(val):
    if not val:
        return None
    u_uuid = _parse_uuid(val)
    if u_uuid:
        found = User.query.get(u_uuid)
        if found:
            return found
    val_str = str(val).strip().lower()
    users = User.query.all()
    for u in users:
        if u.display_name and u.display_name.strip().lower() == val_str:
            return u
        if u.username and u.username.strip().lower() == val_str:
            return u
        if u.email and u.email.strip().lower() == val_str:
            return u
    for u in users:
        if val_str in (u.display_name or '').lower() or val_str in (u.username or '').lower():
            return u
    return None

def _find_task(task_id):
    if not task_id:
        return None
    t_uuid = _parse_uuid(task_id)
    if t_uuid:
        try:
            found = Task.query.get(t_uuid)
            if found:
                return found
        except Exception:
            pass
    clean_id = str(task_id).strip().lower()
    if clean_id.startswith('tck-') or clean_id.startswith('task-'):
        clean_id = clean_id.split('-', 1)[-1]
    tasks = Task.query.all()
    for t in tasks:
        s_id = str(t.id).lower()
        if clean_id in s_id or s_id.startswith(clean_id) or s_id.endswith(clean_id):
            return t
        if clean_id in (t.title or '').lower():
            return t
    return None

def _is_developer_in_team(user_id, team_id):
    """Verifies that a user is a member or leader of the specified team."""
    if not user_id or not team_id:
        return False
    team = Team.query.get(team_id)
    if not team:
        return False
    if team.team_leader_id and str(team.team_leader_id) == str(user_id):
        return True
    if team.lead_id and str(team.lead_id) == str(user_id):
        return True
    membership = TeamMember.query.filter_by(team_id=team_id, user_id=user_id).first()
    return bool(membership)

# ─── OVERDUE DETECTION & ESCALATION ENGINE ────────────────────────────────────

def check_and_process_overdue_tasks():
    """
    Automated Overdue Detection & Multi-Level Escalation:
    - Identifies active tasks past due date.
    - Level 1: Overdue -> Team Leader notified immediately.
    - Level 2: Overdue >= 2 days or critical -> Project Manager notified.
    - Level 3: Critical/high overdue -> Create/update Project Risk alert.
    Prevents duplicate notifications for the same overdue event.
    """
    try:
        today = date.today()
        overdue_tasks = Task.query.filter(
            Task.status.notin_(['DONE', 'COMPLETED']),
            Task.due_date.isnot(None),
            Task.due_date < today
        ).all()

        for task in overdue_tasks:
            days = (today - task.due_date).days
            project = Project.query.get(task.project_id) if task.project_id else None
            sprint = Sprint.query.get(task.sprint_id) if task.sprint_id else None
            team = Team.query.get(task.team_id) if task.team_id else (sprint.team if sprint else None)
            assignee_name = task.assignee_display_name

            # LEVEL 1: Notify Team Leader
            if not task.overdue_notified_lead:
                lead_id = None
                if team and (team.team_leader_id or team.lead_id):
                    lead_id = team.team_leader_id or team.lead_id
                elif project and project.lead_id:
                    lead_id = project.lead_id

                if lead_id and (not task.assigned_to_id or str(lead_id) != str(task.assigned_to_id)):
                    n = Notification(
                        recipient_id=lead_id,
                        title=f"⚠️ Overdue Task Alert: {task.display_title}",
                        message=f"Task '{task.display_title}' assigned to {assignee_name} is overdue by {days} day(s).\n"
                                f"Project: {project.display_name if project else 'System'}\n"
                                f"Sprint: {sprint.name if sprint else 'Product Backlog'}\n"
                                f"Due Date: {task.due_date.isoformat()}\n"
                                f"Current Status: {task.display_status}\n"
                                f"Priority: {task.priority}"
                                + (f"\nDelay Remark: {task.delay_remark}" if task.delay_remark else ""),
                        notification_type='TASK_OVERDUE',
                        read=False
                    )
                    db.session.add(n)

                task.overdue_notified_lead = True
                task.escalation_level = max(task.escalation_level or 0, 1)

                # Record in TaskStatusHistory
                hist = TaskStatusHistory(
                    task_id=task.id,
                    user_id=None,
                    action_type='BECAME_OVERDUE',
                    old_value='ON_TIME',
                    new_value=f'OVERDUE_{days}D',
                    details=f"Task identified as overdue by {days} days. Team Leader notified."
                )
                db.session.add(hist)

            # LEVEL 2: Overdue beyond threshold (>= 2 days) or Critical -> Escalate to PM
            if (days >= 2 or task.priority == 'CRITICAL') and not task.overdue_notified_pm:
                pm_id = None
                if project and project.manager_id:
                    pm_id = project.manager_id
                else:
                    pm_role = Role.query.filter_by(code='ROLE_PM').first()
                    pm_user = User.query.filter_by(role_id=pm_role.id).first() if pm_role else None
                    if pm_user:
                        pm_id = pm_user.id

                if pm_id:
                    n_pm = Notification(
                        recipient_id=pm_id,
                        title=f"🚨 Escalated Overdue Task: {task.display_title}",
                        message=f"Task '{task.display_title}' in Project '{project.display_name if project else 'System'}' "
                                f"assigned to {assignee_name} has remained overdue for {days} days.\n"
                                f"Sprint: {sprint.name if sprint else 'Product Backlog'}\n"
                                f"Current Status: {task.display_status}, Priority: {task.priority}.\n"
                                f"Delay Remark: {task.delay_remark or 'No delay remark provided yet.'}\n"
                                f"Team Leader Review: {task.team_leader_review or 'Pending review.'}",
                        notification_type='TASK_ESCALATED',
                        read=False
                    )
                    db.session.add(n_pm)

                task.overdue_notified_pm = True
                task.escalation_level = max(task.escalation_level or 0, 2)
                task.escalated_at = datetime.utcnow()

                hist_pm = TaskStatusHistory(
                    task_id=task.id,
                    user_id=None,
                    action_type='TASK_ESCALATED_PM',
                    old_value=f'LEVEL_{task.escalation_level}',
                    new_value='LEVEL_2',
                    details=f"Task remained overdue for {days} days. Escalated to Project Manager."
                )
                db.session.add(hist_pm)

            # LEVEL 3: Critical/High unresolved task -> Show as Project Risk / Alert
            if task.priority in ('CRITICAL', 'HIGH') and days >= 1:
                task.escalation_level = 3
                if project:
                    existing_risk = Risk.query.filter_by(
                        project_id=project.id,
                        title=f"Critical Overdue Task: {task.display_title}"
                    ).first()
                    if not existing_risk:
                        r = Risk(
                            project_id=project.id,
                            title=f"Critical Overdue Task: {task.display_title}",
                            description=f"Task '{task.display_title}' assigned to {assignee_name} is overdue by {days} days with {task.priority} priority.",
                            severity='CRITICAL' if task.priority == 'CRITICAL' else 'HIGH',
                            status='OPEN'
                        )
                        db.session.add(r)

        db.session.commit()
    except Exception as e:
        db.session.rollback()

# ─── TASK ENDPOINTS (`/api/v1/tasks/...`) ─────────────────────────────────────

@task_bp.route('/', methods=['GET', 'POST'])
@task_bp.route('', methods=['GET', 'POST'])
@jwt_required(optional=True)
def manage_tasks():
    user = _get_auth_user()
    check_and_process_overdue_tasks()

    if request.method == 'GET':
        query = Task.query
        proj_param = request.args.get('project_id')
        team_param = request.args.get('team_id')
        sprint_param = request.args.get('sprint_id')
        status_param = request.args.get('status')
        assignee_param = request.args.get('assignee_id') or request.args.get('assigned_to_id')
        backlog_only = request.args.get('backlog')

        if proj_param:
            p_uuid = _parse_uuid(proj_param)
            query = query.filter(Task.project_id == (p_uuid or proj_param))

        if team_param:
            t_uuid = _parse_uuid(team_param)
            query = query.filter(Task.team_id == (t_uuid or team_param))

        if sprint_param:
            s_uuid = _parse_uuid(sprint_param)
            query = query.filter(Task.sprint_id == (s_uuid or sprint_param))
        elif backlog_only and str(backlog_only).lower() in ('true', '1', 'yes'):
            query = query.filter(Task.sprint_id.is_(None))

        if status_param and status_param.upper() != 'ALL':
            query = query.filter(Task.status.ilike(status_param.strip()))

        if assignee_param:
            u_uuid = _parse_uuid(assignee_param)
            query = query.filter(Task.assigned_to_id == (u_uuid or assignee_param))

        tasks = query.order_by(Task.created_at.desc()).all()
        return jsonify({'success': True, 'count': len(tasks), 'tasks': [t.to_dict() for t in tasks]}), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        title = data.get('title') or data.get('task_title')
        if not title or not str(title).strip():
            return jsonify({'success': False, 'message': 'Validation Error: Task title is required.'}), 400

        title = str(title).strip()
        description = data.get('description', '')
        ticket_type = data.get('ticket_type') or data.get('type') or 'Task'
        priority = (data.get('priority') or 'MEDIUM').upper()
        status = (data.get('status') or data.get('task_status') or 'TODO').upper()
        due_date_str = data.get('due_date') or data.get('dueDate')
        estimated_hours = float(data.get('estimated_hours') or data.get('estimatedHours') or 4.0)

        sprint_id = _parse_uuid(data.get('sprint_id'))
        project_id = _parse_uuid(data.get('project_id'))
        team_id = _parse_uuid(data.get('team_id'))
        parent_task_id = _parse_uuid(data.get('parent_task_id'))

        sprint = Sprint.query.get(sprint_id) if sprint_id else None
        if sprint:
            if not project_id:
                project_id = sprint.project_id
            elif str(project_id) != str(sprint.project_id):
                return jsonify({'success': False, 'message': 'Validation Error: Task project must match Sprint project.'}), 400

            if not team_id:
                team_id = sprint.team_id
            elif str(team_id) != str(sprint.team_id):
                return jsonify({'success': False, 'message': 'Validation Error: Task team must match Sprint team.'}), 400

        if not project_id:
            first_p = Project.query.filter_by(is_active=True).first()
            if first_p:
                project_id = first_p.id

        # Resolve assigned developer
        raw_assignee = data.get('assigned_to') or data.get('assigned_to_id') or data.get('assignee') or data.get('assignee_name')
        assigned_user = _resolve_assigned_user(raw_assignee)
        assigned_to_id = assigned_user.id if assigned_user else None

        # ─── RBAC: DEVELOPER CANNOT ASSIGN TASKS TO OTHERS ───
        if user and user.role_name == 'ROLE_DEV':
            if assigned_to_id and str(assigned_to_id) != str(user.id):
                return jsonify({'success': False, 'message': '403 Forbidden: Developers cannot assign tasks to other developers.'}), 403
            assigned_to_id = user.id
            assigned_user = user

        # ─── CROSS-TEAM ASSIGNMENT RESTRICTION ───
        if assigned_to_id and team_id:
            if not _is_developer_in_team(assigned_to_id, team_id):
                return jsonify({
                    'success': False,
                    'message': f"Cross-team assignment rejected: Developer '{assigned_user.display_name if assigned_user else raw_assignee}' does not belong to the sprint's team."
                }), 400

        due_date = None
        if due_date_str:
            try:
                due_date = datetime.strptime(due_date_str.split('T')[0], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'success': False, 'message': 'Validation Error: Invalid due date format. Use YYYY-MM-DD.'}), 400

        task = Task(
            title=title,
            description=description,
            ticket_type=ticket_type,
            parent_task_id=parent_task_id,
            priority=priority,
            status=status,
            due_date=due_date,
            original_due_date=due_date,
            estimated_hours=estimated_hours,
            sprint_id=sprint_id,
            project_id=project_id,
            team_id=team_id,
            assigned_to_id=assigned_to_id,
            created_by_id=user.id if user else None
        )
        db.session.add(task)
        db.session.flush()

        # Audit History
        hist = TaskStatusHistory(
            task_id=task.id,
            user_id=user.id if user else None,
            action_type='TASK_CREATED',
            old_value='',
            new_value=status,
            details=f"Task '{title}' created and assigned to {assigned_user.display_name if assigned_user else 'Unassigned'}"
        )
        db.session.add(hist)

        # Attachments
        attachments_input = data.get('attachments') or []
        for att in attachments_input:
            att_name = att.get('name') or att.get('filename') if isinstance(att, dict) else str(att)
            att_file = att.get('file') or att.get('url') if isinstance(att, dict) else att_name
            db.session.add(TaskAttachment(
                task_id=task.id,
                filename=att_name or 'document.pdf',
                file=att_file or att_name,
                created_by_id=user.id if user else None
            ))

        # Notification to assigned developer
        if assigned_user and (not user or str(user.id) != str(assigned_user.id)):
            db.session.add(Notification(
                recipient_id=assigned_user.id,
                title='⚡ New Task Ticket Assigned',
                message=f"You have been assigned to task: '{title}'. Assigned by {user.display_name if user else 'Team Lead'}.",
                notification_type='TASK_ASSIGNMENT',
                read=False
            ))

        try:
            log = AuditLog(
                user_email=user.email if user else 'system',
                role_name=user.role_name if user else 'ROLE_DEV',
                action='TASK_CREATED',
                details=f"Created task '{title}' assigned to {assigned_user.display_name if assigned_user else 'Unassigned'}"
            )
            db.session.add(log)
            db.session.commit()
        except Exception:
            db.session.commit()

        return jsonify({'success': True, 'message': 'Task created successfully.', 'task': task.to_dict()}), 201

@task_bp.route('/backlog', methods=['GET'])
@task_bp.route('/backlog/', methods=['GET'])
@jwt_required(optional=True)
def get_product_backlog():
    project_id_raw = request.args.get('project_id')
    p_uuid = _parse_uuid(project_id_raw)
    query = Task.query.filter(Task.sprint_id.is_(None))
    if p_uuid:
        query = query.filter_by(project_id=p_uuid)

    backlog_tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(backlog_tasks),
        'backlog_tasks': [t.to_dict() for t in backlog_tasks]
    }), 200

@task_bp.route('/<string:task_id>', methods=['GET', 'PUT', 'DELETE'])
@task_bp.route('/<string:task_id>/', methods=['GET', 'PUT', 'DELETE'])
@jwt_required(optional=True)
def task_detail(task_id):
    user = _get_auth_user()
    check_and_process_overdue_tasks()
    task = _find_task(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    if request.method == 'GET':
        return jsonify({'success': True, 'task': task.to_dict()}), 200

    if request.method == 'PUT':
        data = request.get_json() or {}
        if 'title' in data:
            task.title = str(data['title']).strip()
        if 'description' in data:
            task.description = data['description']
        if 'priority' in data:
            task.priority = str(data['priority']).upper()
        if 'status' in data:
            task.status = str(data['status']).upper()
            if task.status in ('DONE', 'COMPLETED'):
                task.progress = 100
        if 'progress' in data:
            try:
                task.progress = max(0, min(100, int(data['progress'])))
            except (ValueError, TypeError):
                pass
        if 'actual_hours' in data:
            try:
                task.actual_hours = float(data['actual_hours'])
            except (ValueError, TypeError):
                pass
        db.session.commit()
        return jsonify({'success': True, 'message': 'Task updated.', 'task': task.to_dict()}), 200

    if request.method == 'DELETE':
        db.session.delete(task)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Task deleted.'}), 200

@task_bp.route('/<string:task_id>/status', methods=['PUT', 'PATCH'])
@task_bp.route('/<string:task_id>/status/', methods=['PUT', 'PATCH'])
@jwt_required(optional=True)
def update_task_status(task_id):
    user = _get_auth_user()
    data = request.get_json() or {}
    new_status = (data.get('status') or data.get('task_status') or 'TODO').upper()
    
    task = _find_task(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    # Developer permission: developers can only move tasks assigned to them
    if user and user.role_name == 'ROLE_DEV':
        if task.assigned_to_id and str(task.assigned_to_id) != str(user.id):
            return jsonify({'success': False, 'message': '403 Forbidden: You can only update tasks assigned to you.'}), 403

    old_status = task.status
    task.status = new_status

    if new_status in ('DONE', 'COMPLETED'):
        task.progress = 100
        # If task completed, reset overdue escalation
        task.overdue_notified_lead = False
        task.overdue_notified_pm = False
    elif 'progress' in data:
        try:
            task.progress = max(0, min(100, int(data['progress'])))
        except (ValueError, TypeError):
            pass

    if 'actual_hours' in data:
        try:
            task.actual_hours = float(data['actual_hours'])
        except (ValueError, TypeError):
            pass

    # Audit History
    hist = TaskStatusHistory(
        task_id=task.id,
        user_id=user.id if user else None,
        action_type='STATUS_CHANGED',
        old_value=old_status,
        new_value=new_status,
        details=f"Task status moved from {old_status} to {new_status}"
    )
    db.session.add(hist)

    try:
        log = AuditLog(
            user_email=user.email if user else 'developer@aureon.com',
            role_name=user.role_name if user else 'ROLE_DEV',
            action='TASK_STATUS_UPDATED',
            details=f"Task '{task.display_title}' status changed from {old_status} to {new_status}"
        )
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.commit()

    return jsonify({'success': True, 'message': f'Task status updated to {new_status}.', 'task': task.to_dict()}), 200

@task_bp.route('/<string:task_id>/assign', methods=['PATCH', 'PUT'])
@task_bp.route('/<string:task_id>/assign/', methods=['PATCH', 'PUT'])
@jwt_required(optional=True)
def assign_task(task_id):
    user = _get_auth_user()
    task = _find_task(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    # Developer cannot reassign tasks
    if user and user.role_name == 'ROLE_DEV':
        return jsonify({'success': False, 'message': '403 Forbidden: Developers cannot reassign tasks.'}), 403

    data = request.get_json() or {}
    raw_assignee = data.get('assigned_to') or data.get('assigned_to_id') or data.get('assignee')
    assigned_user = _resolve_assigned_user(raw_assignee)
    if not assigned_user:
        return jsonify({'success': False, 'message': 'Assigned developer not found.'}), 400

    # Cross-team assignment validation
    team_id = task.team_id
    if not team_id and task.sprint_id:
        sprint = Sprint.query.get(task.sprint_id)
        if sprint:
            team_id = sprint.team_id

    if team_id and not _is_developer_in_team(assigned_user.id, team_id):
        return jsonify({
            'success': False,
            'message': f"Cross-team error: Developer '{assigned_user.display_name}' does not belong to the sprint's team."
        }), 400

    old_assignee = task.assignee_display_name
    task.assigned_to_id = assigned_user.id
    task.assigned_by_id = user.id if user else None

    hist = TaskStatusHistory(
        task_id=task.id,
        user_id=user.id if user else None,
        action_type='TASK_ASSIGNED',
        old_value=old_assignee,
        new_value=assigned_user.display_name,
        details=f"Task reassigned from {old_assignee} to {assigned_user.display_name}"
    )
    db.session.add(hist)

    # Notify new assignee
    if str(assigned_user.id) != str(user.id if user else ''):
        db.session.add(Notification(
            recipient_id=assigned_user.id,
            title='⚡ Task Ticket Assigned',
            message=f"You have been assigned to task: '{task.display_title}'.",
            notification_type='TASK_ASSIGNMENT',
            read=False
        ))

    db.session.commit()
    return jsonify({'success': True, 'message': 'Task assigned successfully.', 'task': task.to_dict()}), 200

# ─── DELAY REMARKS & TEAM LEADER REVIEWS ──────────────────────────────────────

@task_bp.route('/<string:task_id>/delay-remark', methods=['POST'])
@task_bp.route('/<string:task_id>/delay-remark/', methods=['POST'])
@jwt_required(optional=True)
def add_delay_remark(task_id):
    user = _get_auth_user()
    task = _find_task(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    data = request.get_json() or {}
    reason = data.get('reason') or data.get('delay_reason') or 'Other'
    remark = data.get('remark') or data.get('delay_remark') or ''

    if not remark.strip():
        return jsonify({'success': False, 'message': 'Delay remark explanation is required.'}), 400

    task.delay_reason = reason
    task.delay_remark = remark.strip()
    task.delay_remark_added_at = datetime.utcnow()
    task.delay_remark_by_id = user.id if user else None

    # Audit history
    hist = TaskStatusHistory(
        task_id=task.id,
        user_id=user.id if user else None,
        action_type='DELAY_REMARK_ADDED',
        old_value='',
        new_value=reason,
        details=f"Developer delay remark: [{reason}] {remark.strip()}"
    )
    db.session.add(hist)

    # Notify Team Leader of the new delay remark
    sprint = Sprint.query.get(task.sprint_id) if task.sprint_id else None
    team = Team.query.get(task.team_id) if task.team_id else (sprint.team if sprint else None)
    lead_id = team.team_leader_id or team.lead_id if team else None

    if lead_id and (not user or str(user.id) != str(lead_id)):
        db.session.add(Notification(
            recipient_id=lead_id,
            title=f"📝 Delay Remark Added: {task.display_title}",
            message=f"{user.display_name if user else 'Developer'} provided a delay remark for overdue task '{task.display_title}':\n"
                    f"Reason: {reason}\n"
                    f"Explanation: {remark.strip()}",
            notification_type='TASK_DELAY_REMARK',
            read=False
        ))

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Delay remark recorded and Team Leader notified.',
        'task': task.to_dict()
    }), 200

@task_bp.route('/<string:task_id>/tl-review', methods=['POST'])
@task_bp.route('/<string:task_id>/tl-review/', methods=['POST'])
@jwt_required(optional=True)
def add_team_leader_review(task_id):
    user = _get_auth_user()
    task = _find_task(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    # Developer cannot add TL review
    if user and user.role_name == 'ROLE_DEV':
        return jsonify({'success': False, 'message': '403 Forbidden: Only Team Leaders or Managers can add review notes.'}), 403

    data = request.get_json() or {}
    review_comment = data.get('review') or data.get('review_comment') or data.get('team_leader_review') or ''

    if not review_comment.strip():
        return jsonify({'success': False, 'message': 'Review comment is required.'}), 400

    task.team_leader_review = review_comment.strip()
    task.team_leader_reviewed_at = datetime.utcnow()
    task.team_leader_reviewed_by_id = user.id if user else None

    hist = TaskStatusHistory(
        task_id=task.id,
        user_id=user.id if user else None,
        action_type='TL_REVIEW_ADDED',
        old_value='',
        new_value='REVIEWED',
        details=f"Team Leader review note: {review_comment.strip()}"
    )
    db.session.add(hist)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Team Leader review recorded.',
        'task': task.to_dict()
    }), 200

@task_bp.route('/<string:task_id>/change-due-date', methods=['POST'])
@task_bp.route('/<string:task_id>/change-due-date/', methods=['POST'])
@jwt_required(optional=True)
def change_task_due_date(task_id):
    user = _get_auth_user()
    task = _find_task(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    # Developers cannot silently extend due dates to avoid overdue status
    if user and user.role_name == 'ROLE_DEV':
        return jsonify({'success': False, 'message': '403 Forbidden: Developers cannot change the due date. Contact your Team Leader.'}), 403

    data = request.get_json() or {}
    new_due_date_str = data.get('new_due_date') or data.get('due_date')
    reason = data.get('reason') or data.get('due_date_change_reason') or ''

    if not new_due_date_str:
        return jsonify({'success': False, 'message': 'New due date is required.'}), 400

    try:
        new_due_date = datetime.strptime(new_due_date_str.split('T')[0], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    old_due_date = task.due_date

    # Preserve original due date
    if not task.original_due_date and old_due_date:
        task.original_due_date = old_due_date

    task.due_date = new_due_date
    task.due_date_changed_at = datetime.utcnow()
    task.due_date_changed_by_id = user.id if user else None
    task.due_date_change_reason = reason.strip() or 'Due date extended by Team Lead'

    # If new date is in future, reset overdue notifications
    if new_due_date >= date.today():
        task.overdue_notified_lead = False
        task.overdue_notified_pm = False

    hist = TaskStatusHistory(
        task_id=task.id,
        user_id=user.id if user else None,
        action_type='DUE_DATE_CHANGED',
        old_value=old_due_date.isoformat() if old_due_date else 'None',
        new_value=new_due_date.isoformat(),
        details=f"Due date changed from {old_due_date} to {new_due_date}. Reason: {reason.strip()}"
    )
    db.session.add(hist)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Due date changed to {new_due_date.isoformat()}.",
        'original_due_date': task.original_due_date.isoformat() if task.original_due_date else None,
        'new_due_date': task.due_date.isoformat(),
        'task': task.to_dict()
    }), 200

@task_bp.route('/<string:task_id>/escalate', methods=['POST'])
@task_bp.route('/<string:task_id>/escalate/', methods=['POST'])
@jwt_required(optional=True)
def escalate_task_to_pm(task_id):
    user = _get_auth_user()
    task = _find_task(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    data = request.get_json() or {}
    reason = data.get('reason') or data.get('escalation_reason') or 'Escalated by Team Lead for PM intervention'

    project = Project.query.get(task.project_id) if task.project_id else None
    pm_id = project.manager_id if project and project.manager_id else None

    if not pm_id:
        pm_role = Role.query.filter_by(code='ROLE_PM').first()
        pm_user = User.query.filter_by(role_id=pm_role.id).first() if pm_role else None
        if pm_user:
            pm_id = pm_user.id

    task.escalation_level = 3 if task.priority == 'CRITICAL' else 2
    task.escalation_reason = reason.strip()
    task.escalated_at = datetime.utcnow()
    task.overdue_notified_pm = True

    if pm_id:
        db.session.add(Notification(
            recipient_id=pm_id,
            title=f"🚨 Manual Escalation: {task.display_title}",
            message=f"Team Leader {user.display_name if user else ''} has escalated task '{task.display_title}' to you.\n"
                    f"Project: {project.display_name if project else 'System'}\n"
                    f"Assigned Developer: {task.assignee_display_name}\n"
                    f"Due Date: {task.due_date.isoformat() if task.due_date else 'None'}\n"
                    f"Escalation Reason: {reason.strip()}",
            notification_type='TASK_ESCALATED',
            read=False
        ))

    # If critical/high, add Project Risk
    if task.priority in ('CRITICAL', 'HIGH') and project:
        db.session.add(Risk(
            project_id=project.id,
            title=f"Escalated Task Risk: {task.display_title}",
            description=f"Task '{task.display_title}' explicitly escalated. Reason: {reason.strip()}",
            severity='CRITICAL' if task.priority == 'CRITICAL' else 'HIGH',
            status='OPEN'
        ))

    hist = TaskStatusHistory(
        task_id=task.id,
        user_id=user.id if user else None,
        action_type='TASK_ESCALATED',
        old_value='LEVEL_1',
        new_value=f'LEVEL_{task.escalation_level}',
        details=f"Task escalated to Project Manager. Reason: {reason.strip()}"
    )
    db.session.add(hist)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Task escalated to Project Manager.',
        'task': task.to_dict()
    }), 200

# ─── WORK BREAKDOWN / SUBTASKS ────────────────────────────────────────────────

@task_bp.route('/<string:task_id>/breakdown', methods=['POST'])
@task_bp.route('/<string:task_id>/breakdown/', methods=['POST'])
@jwt_required(optional=True)
def breakdown_task(task_id):
    user = _get_auth_user()
    parent_task = _find_task(task_id)
    if not parent_task:
        return jsonify({'success': False, 'message': 'Parent task not found.'}), 404

    data = request.get_json() or {}
    title = data.get('title')
    if not title or not str(title).strip():
        return jsonify({'success': False, 'message': 'Subtask title is required.'}), 400

    raw_assignee = data.get('assigned_to') or data.get('assigned_to_id')
    assigned_user = _resolve_assigned_user(raw_assignee) if raw_assignee else parent_task.assigned_user

    # Cross-team check
    if assigned_user and parent_task.team_id:
        if not _is_developer_in_team(assigned_user.id, parent_task.team_id):
            return jsonify({'success': False, 'message': 'Developer does not belong to this sprint team.'}), 400

    subtask = Task(
        title=str(title).strip(),
        description=data.get('description', ''),
        ticket_type=data.get('ticket_type', 'Task'),
        parent_task_id=parent_task.id,
        priority=data.get('priority', parent_task.priority),
        status='TODO',
        due_date=parent_task.due_date,
        original_due_date=parent_task.due_date,
        estimated_hours=float(data.get('estimated_hours', 2.0)),
        project_id=parent_task.project_id,
        team_id=parent_task.team_id,
        sprint_id=parent_task.sprint_id,
        assigned_to_id=assigned_user.id if assigned_user else None,
        created_by_id=user.id if user else None
    )
    db.session.add(subtask)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Subtask created.', 'task': subtask.to_dict()}), 201

# ─── TASK AUDIT HISTORY & COMMENTS ───────────────────────────────────────────

@task_bp.route('/<string:task_id>/history', methods=['GET'])
@task_bp.route('/<string:task_id>/history/', methods=['GET'])
@jwt_required(optional=True)
def get_task_history(task_id):
    task = _find_task(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    history = TaskStatusHistory.query.filter_by(task_id=task.id).order_by(TaskStatusHistory.created_at.asc()).all()
    return jsonify({
        'success': True,
        'task_id': str(task.id),
        'title': task.display_title,
        'count': len(history),
        'history': [h.to_dict() for h in history]
    }), 200

@task_bp.route('/<string:task_id>/comments', methods=['GET', 'POST'])
@task_bp.route('/<string:task_id>/comments/', methods=['GET', 'POST'])
@jwt_required(optional=True)
def task_comments(task_id):
    user = _get_auth_user()
    task = _find_task(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    if request.method == 'GET':
        comments = TaskComment.query.filter_by(task_id=task.id).order_by(TaskComment.created_at.asc()).all()
        return jsonify({'success': True, 'count': len(comments), 'comments': [c.to_dict() for c in comments]}), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        text = data.get('comment') or data.get('text')
        if not text or not str(text).strip():
            return jsonify({'success': False, 'message': 'Comment text is required.'}), 400

        c = TaskComment(
            task_id=task.id,
            user_id=user.id if user else None,
            comment=str(text).strip()
        )
        db.session.add(c)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Comment posted.', 'comment': c.to_dict()}), 201

# ─── DEVELOPER SCOPED ENDPOINTS (`/api/v1/developer/...`) ─────────────────────

@developer_bp.route('/my-tasks', methods=['GET'])
@developer_bp.route('/my-tasks/', methods=['GET'])
@jwt_required(optional=True)
def get_developer_my_tasks():
    check_and_process_overdue_tasks()
    user = None
    email_param = request.args.get('email')
    user_id_param = request.args.get('user_id')
    name_param = request.args.get('name')

    if email_param:
        user = User.query.filter(User.email.ilike(email_param.strip())).first()
    elif user_id_param:
        u_uuid = _parse_uuid(user_id_param)
        user = User.query.get(u_uuid or user_id_param)
    elif name_param:
        user = User.query.filter((User.full_name.ilike(f"%{name_param.strip()}%")) | (User.username.ilike(f"%{name_param.strip()}%"))).first()

    if not user:
        user = _get_auth_user()

    if not user:
        tasks = Task.query.all()
        return jsonify({'success': True, 'count': len(tasks), 'tasks': [t.to_dict() for t in tasks]}), 200

    u_uuid = user.id
    u_name = (user.display_name or user.username or '').strip().lower()
    all_tasks = Task.query.all()
    my_tasks = []
    seen_ids = set()

    for t in all_tasks:
        if t.id in seen_ids:
            continue
        if t.assigned_to_id and str(t.assigned_to_id) == str(u_uuid):
            my_tasks.append(t)
            seen_ids.add(t.id)
        elif t.assigned_user and u_name and (u_name in t.assigned_user.display_name.lower() or t.assigned_user.display_name.lower() in u_name):
            my_tasks.append(t)
            seen_ids.add(t.id)

    return jsonify({
        'success': True,
        'count': len(my_tasks),
        'tasks': [t.to_dict() for t in my_tasks]
    }), 200

# ─── STATS & ATTACHMENTS ──────────────────────────────────────────────────────

@task_bp.route('/stats', methods=['GET'])
@task_bp.route('/stats/', methods=['GET'])
@jwt_required(optional=True)
def get_task_stats():
    check_and_process_overdue_tasks()
    tasks = Task.query.all()
    todo_count = len([t for t in tasks if t.status == 'TODO'])
    in_prog_count = len([t for t in tasks if t.status == 'IN_PROGRESS'])
    review_count = len([t for t in tasks if t.status in ('REVIEW', 'CODE_REVIEW', 'IN_REVIEW')])
    completed_count = len([t for t in tasks if t.status in ('COMPLETED', 'DONE')])
    blocked_count = len([t for t in tasks if t.status == 'BLOCKED'])
    overdue_count = len([t for t in tasks if t.is_overdue])

    completion_pct = round((completed_count / len(tasks) * 100), 2) if tasks else 0.0

    return jsonify({
        'success': True,
        'stats': {
            'total_tasks': len(tasks),
            'todo': todo_count,
            'in_progress': in_prog_count,
            'in_review': review_count,
            'completed': completed_count,
            'blocked': blocked_count,
            'overdue': overdue_count,
            'completion_percentage': completion_pct
        }
    }), 200

@task_bp.route('/<task_id>/attachments', methods=['GET', 'POST'])
@jwt_required(optional=True)
def task_attachments(task_id):
    task = _find_task(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    if request.method == 'GET':
        atts = TaskAttachment.query.filter_by(task_id=task.id, is_deleted=False).all()
        return jsonify({'success': True, 'count': len(atts), 'attachments': [a.to_dict() for a in atts]}), 200

    if request.method == 'POST':
        user = _get_auth_user()
        data = request.get_json() or {}
        filename = data.get('filename') or data.get('name') or 'document.pdf'
        file_path = data.get('file') or data.get('url') or filename

        new_att = TaskAttachment(
            task_id=task.id,
            filename=filename,
            file=file_path,
            created_by_id=user.id if user else None
        )
        db.session.add(new_att)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Attachment added successfully.', 'attachment': new_att.to_dict()}), 201
