from flask import Blueprint, request, jsonify
from datetime import datetime, date
from extensions import db
from models import Task, TaskStatusHistory, AuditLog
from services.risk_engine_service import RuleEngine

task_bp = Blueprint('tasks', __name__, url_prefix='/api/v1/tasks')

@task_bp.route('/', methods=['GET', 'POST'])
@task_bp.route('', methods=['GET', 'POST'])
def manage_tasks():
    if request.method == 'GET':
        tasks = Task.query.all()
        # Trigger Task Delay Rule check across projects
        projects_set = set(t.project_id for t in tasks if t.project_id)
        for pid in projects_set:
            RuleEngine.evaluate_project_risks(pid)

        return jsonify({'success': True, 'count': len(tasks), 'tasks': [t.to_dict() for t in tasks]}), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        title = data.get('title')
        description = data.get('description', '')
        project_id = data.get('project_id', 1)
        assigned_to_id = data.get('assigned_to_id')
        priority = data.get('priority', 'MEDIUM')
        due_date_str = data.get('due_date')

        due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date() if due_date_str else None

        task = Task(
            title=title,
            description=description,
            project_id=project_id,
            assigned_to_id=assigned_to_id,
            priority=priority,
            status='IN_PROGRESS',
            due_date=due_date
        )
        db.session.add(task)
        db.session.flush()

        log = AuditLog(
            action='TASK_CREATED',
            entity='Task',
            entity_id=str(task.id),
            details=f"Created task '{title}'"
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Task created.', 'task': task.to_dict()}), 201

@task_bp.route('/<int:task_id>/status', methods=['PUT', 'PATCH'])
def update_task_status(task_id):
    data = request.get_json() or {}
    new_status = data.get('status')
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    old_status = task.status
    task.status = new_status
    if new_status == 'COMPLETED':
        task.completion_date = date.today()

    history = TaskStatusHistory(
        task_id=task.id,
        old_status=old_status,
        new_status=new_status
    )
    db.session.add(history)

    log = AuditLog(
        action='TASK_STATUS_UPDATED',
        entity='Task',
        entity_id=str(task.id),
        details=f"Task '{task.title}' status changed from {old_status} to {new_status}"
    )
    db.session.add(log)
    db.session.commit()

    # Re-evaluate risks after status change
    RuleEngine.evaluate_project_risks(task.project_id)

    return jsonify({'success': True, 'message': f'Task status updated to {new_status}.', 'task': task.to_dict()}), 200
