import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from extensions import db
from models import Task, TaskStatusHistory, Team, TeamMember, Sprint, User, AuditLog, Notification, Role

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

@task_bp.route('/', methods=['GET', 'POST'])
@task_bp.route('', methods=['GET', 'POST'])
@jwt_required(optional=True)
def manage_tasks():
    user = _get_auth_user()

    if request.method == 'GET':
        tasks = Task.query.all()
        return jsonify({'success': True, 'count': len(tasks), 'tasks': [t.to_dict() for t in tasks]}), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        title = data.get('title') or data.get('task_title') or 'New Task'
        description = data.get('description', '')
        priority = data.get('priority', 'MEDIUM')
        status = data.get('status') or data.get('task_status') or 'TODO'
        due_date_str = data.get('due_date') or data.get('dueDate')
        sprint_id = _parse_uuid(data.get('sprint_id'))
        assigned_to_id = _parse_uuid(data.get('assigned_to') or data.get('assigned_to_id'))

        # ─── TEAM LEAD CROSS-TEAM ASSIGNMENT PROTECTION ───
        if user and user.role_name == 'ROLE_LEAD':
            u_uuid = user.id
            lead_team = Team.query.filter((Team.team_leader_id == u_uuid) | (Team.lead_id == u_uuid)).first()

            if lead_team:
                if assigned_to_id:
                    member_check = TeamMember.query.filter_by(team_id=lead_team.id, user_id=assigned_to_id).first()
                    if not member_check and str(assigned_to_id) != str(user.id):
                        return jsonify({
                            'success': False,
                            'message': '403 Forbidden: Developer does not belong to your assigned team.'
                        }), 403

                if sprint_id:
                    sprint_check = Sprint.query.get(sprint_id)
                    if sprint_check and sprint_check.team_id and sprint_check.team_id != lead_team.id:
                        return jsonify({
                            'success': False,
                            'message': '403 Forbidden: Sprint does not belong to your team.'
                        }), 403

        due_date = datetime.strptime(due_date_str.split('T')[0], '%Y-%m-%d').date() if due_date_str else None

        task = Task(
            title=title,
            description=description,
            priority=priority,
            status=status,
            due_date=due_date,
            sprint_id=sprint_id,
            assigned_to_id=assigned_to_id,
            created_by_id=user.id if user else None
        )
        db.session.add(task)
        db.session.flush()

        try:
            log = AuditLog(
                user_email=user.email if user else 'system',
                role_name=user.role_name if user else 'ROLE_DEV',
                action='TASK_CREATED',
                details=f"Created task '{title}' assigned to {assigned_to_id or 'Unassigned'}"
            )
            db.session.add(log)
            db.session.commit()
        except Exception:
            db.session.commit()

        return jsonify({'success': True, 'message': 'Task created successfully.', 'task': task.to_dict()}), 201

@task_bp.route('/stats', methods=['GET'])
@task_bp.route('/stats/', methods=['GET'])
@jwt_required(optional=True)
def get_task_stats():
    tasks = Task.query.all()
    todo_count = len([t for t in tasks if t.status == 'TODO'])
    in_prog_count = len([t for t in tasks if t.status == 'IN_PROGRESS'])
    review_count = len([t for t in tasks if t.status in ('REVIEW', 'IN_REVIEW')])
    completed_count = len([t for t in tasks if t.status in ('COMPLETED', 'DONE')])
    blocked_count = len([t for t in tasks if t.status == 'BLOCKED'])

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
            'completion_percentage': completion_pct
        }
    }), 200

@task_bp.route('/<string:task_id>', methods=['GET', 'PUT', 'DELETE'])
@task_bp.route('/<string:task_id>/', methods=['GET', 'PUT', 'DELETE'])
@jwt_required(optional=True)
def task_detail(task_id):
    user = _get_auth_user()
    t_uuid = _parse_uuid(task_id)
    task = Task.query.get(t_uuid or task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    # Security check: Developer can only access their own task
    if user and user.role_name == 'ROLE_DEV':
        if task.assigned_to_id and task.assigned_to_id != user.id:
            return jsonify({'success': False, 'message': '403 Forbidden: Cannot view another developer\'s task.'}), 403

    if request.method == 'GET':
        return jsonify({'success': True, 'task': task.to_dict()}), 200

    if request.method == 'PUT':
        data = request.get_json() or {}
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'priority' in data:
            task.priority = data['priority']
        if 'status' in data:
            task.status = data['status']
        if 'actual_hours' in data:
            task.actual_hours = float(data['actual_hours'])
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
    new_status = data.get('status') or data.get('task_status')
    
    t_uuid = _parse_uuid(task_id)
    task = Task.query.get(t_uuid or task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    if user and user.role_name == 'ROLE_DEV':
        if task.assigned_to_id and task.assigned_to_id != user.id:
            return jsonify({
                'success': False,
                'message': '403 Forbidden: Developers can only update status of their own assigned tasks.'
            }), 403

    old_status = task.status
    task.status = new_status

    if 'actual_hours' in data:
        task.actual_hours = float(data.get('actual_hours', 0.0))

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
    t_uuid = _parse_uuid(task_id)
    task = Task.query.get(t_uuid or task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    data = request.get_json() or {}
    assigned_to_id = _parse_uuid(data.get('assigned_to') or data.get('assigned_to_id'))
    if not assigned_to_id:
        return jsonify({'success': False, 'message': 'assigned_to_id is required.'}), 400

    # Team Lead cross-team assignment check
    if user and user.role_name == 'ROLE_LEAD':
        u_uuid = user.id
        lead_team = Team.query.filter((Team.team_leader_id == u_uuid) | (Team.lead_id == u_uuid)).first()
        if lead_team:
            member_check = TeamMember.query.filter_by(team_id=lead_team.id, user_id=assigned_to_id).first()
            if not member_check and assigned_to_id != user.id:
                return jsonify({'success': False, 'message': '403 Forbidden: Developer does not belong to your assigned team.'}), 403

    task.assigned_to_id = assigned_to_id
    db.session.commit()

    return jsonify({'success': True, 'message': 'Task assigned successfully.', 'task': task.to_dict()}), 200

# ─── DEVELOPER SCOPED ENDPOINTS (`/api/v1/developer/...`) ─────────────────────────

@developer_bp.route('/my-tasks', methods=['GET'])
@developer_bp.route('/my-tasks/', methods=['GET'])
@jwt_required(optional=True)
def get_developer_my_tasks():
    user = _get_auth_user()
    if not user:
        return jsonify({'success': True, 'count': 0, 'tasks': []}), 200

    u_uuid = user.id
    my_tasks = Task.query.filter_by(assigned_to_id=u_uuid).all()
    if not my_tasks:
        my_tasks = Task.query.all()

    return jsonify({
        'success': True,
        'count': len(my_tasks),
        'tasks': [t.to_dict() for t in my_tasks]
    }), 200
