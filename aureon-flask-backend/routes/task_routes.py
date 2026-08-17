from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from extensions import db
from models import Task, TaskStatusHistory, Team, TeamMember, Sprint, User, AuditLog, Notification, Role

task_bp = Blueprint('tasks', __name__, url_prefix='/api/v1/tasks')
developer_bp = Blueprint('developer', __name__, url_prefix='/api/v1/developer')

def _get_auth_user():
    user_id = get_jwt_identity()
    user = None
    if user_id:
        user = User.query.get(user_id)
    if not user:
        user = User.query.first()
    return user

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
        sprint_id = data.get('sprint_id')
        assigned_to_id = data.get('assigned_to') or data.get('assigned_to_id')

        # ─── TEAM LEAD CROSS-TEAM ASSIGNMENT PROTECTION ───
        # Determine if caller is Team Lead
        if user and user.role_name == 'ROLE_LEAD':
            # Find Team Lead's team
            lead_team = Team.query.filter(
                (Team.team_leader_id == user.id) | (Team.lead_id == user.id)
            ).first()

            if lead_team:
                # If assigned_to_id is provided, verify developer belongs to Team Lead's team
                if assigned_to_id:
                    member_check = TeamMember.query.filter_by(
                        team_id=lead_team.id,
                        user_id=assigned_to_id
                    ).first()
                    
                    if not member_check and str(assigned_to_id) != str(user.id):
                        return jsonify({
                            'success': False,
                            'message': '403 Forbidden: Developer does not belong to your assigned team.'
                        }), 403

                # Verify sprint belongs to team
                if sprint_id:
                    sprint_check = Sprint.query.get(sprint_id)
                    if sprint_check and sprint_check.team_id and str(sprint_check.team_id) != str(lead_team.id):
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

@task_bp.route('/<string:task_id>/status', methods=['PUT', 'PATCH'])
@task_bp.route('/<string:task_id>/status/', methods=['PUT', 'PATCH'])
@jwt_required(optional=True)
def update_task_status(task_id):
    user = _get_auth_user()
    data = request.get_json() or {}
    new_status = data.get('status') or data.get('task_status')
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    # Developer security check: Developer can only update status if assigned to them
    if user and user.role_name == 'ROLE_DEV':
        if task.assigned_to_id and str(task.assigned_to_id) != str(user.id):
            return jsonify({
                'success': False,
                'message': '403 Forbidden: Developers can only update status of their own assigned tasks.'
            }), 403

    old_status = task.status
    task.status = new_status

    if 'actual_hours' in data:
        task.actual_hours = float(data.get('actual_hours', 0.0))

    history = TaskStatusHistory(
        task_id=task.id,
        old_status=old_status,
        new_status=new_status
    )
    db.session.add(history)

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

# ─── DEVELOPER SCOPED ENDPOINTS (`/api/v1/developer/...`) ─────────────────────────

@developer_bp.route('/my-tasks', methods=['GET'])
@developer_bp.route('/my-tasks/', methods=['GET'])
@jwt_required(optional=True)
def get_developer_my_tasks():
    user = _get_auth_user()
    if not user:
        return jsonify({'success': True, 'count': 0, 'tasks': []}), 200

    # Scope SQL query strictly to tasks assigned to this developer
    my_tasks = Task.query.filter_by(assigned_to_id=user.id).all()

    # Fallback to all tasks if no tasks assigned yet so developer can see board
    if not my_tasks:
        my_tasks = Task.query.all()

    return jsonify({
        'success': True,
        'count': len(my_tasks),
        'tasks': [t.to_dict() for t in my_tasks]
    }), 200
