from flask import Blueprint, jsonify
from extensions import db
from models import User, Project, Task, Risk, Repository, Commit, CodeAnalysis, AuditLog
from services.project_health_service import HealthCalculator
from services.risk_engine_service import RuleEngine

dashboard_bp = Blueprint('dashboards', __name__, url_prefix='/api/v1/dashboards')

@dashboard_bp.route('/admin', methods=['GET'])
@dashboard_bp.route('/admin/', methods=['GET'])
def get_admin_dashboard():
    total_users = User.query.count()
    active_users = User.query.filter_by(status='ACTIVE').count()
    total_projects = Project.query.count()
    total_risks = Risk.query.filter_by(status='OPEN').count()
    recent_logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(10).all()

    return jsonify({
        'success': True,
        'metrics': {
            'total_users': total_users,
            'active_users': active_users,
            'total_projects': total_projects,
            'open_risks': total_risks,
            'system_health': 'OPERATIONAL'
        },
        'audit_logs': [l.to_dict() for l in recent_logs]
    }), 200

@dashboard_bp.route('/pm', methods=['GET'])
@dashboard_bp.route('/pm/', methods=['GET'])
def get_pm_dashboard():
    projects = Project.query.all()
    tasks = Task.query.all()
    open_risks = Risk.query.filter_by(status='OPEN').all()
    completed_tasks = [t for t in tasks if t.status == 'COMPLETED']
    delayed_tasks = [t for t in tasks if t.status != 'COMPLETED' and t.due_date and str(t.due_date) < str(Project.query.first().created_at.date() if Project.query.first() else '')]

    avg_health = sum(p.health_score for p in projects) // len(projects) if projects else 85

    return jsonify({
        'success': True,
        'metrics': {
            'project_health_avg': avg_health,
            'total_projects': len(projects),
            'completed_tasks_pct': int((len(completed_tasks) / len(tasks) * 100)) if tasks else 75,
            'delayed_tasks_count': len(delayed_tasks),
            'open_risks_count': len(open_risks)
        },
        'projects': [p.to_dict() for p in projects],
        'risks': [r.to_dict() for r in open_risks]
    }), 200

@dashboard_bp.route('/lead', methods=['GET'])
@dashboard_bp.route('/lead/', methods=['GET'])
def get_lead_dashboard():
    tasks = Task.query.all()
    commits = Commit.query.order_by(Commit.timestamp.desc()).limit(15).all()
    developers = User.query.filter_by(role_name='ROLE_DEV').all()

    return jsonify({
        'success': True,
        'metrics': {
            'team_size': len(developers),
            'active_tasks': len([t for t in tasks if t.status == 'IN_PROGRESS']),
            'completed_tasks': len([t for t in tasks if t.status == 'COMPLETED']),
            'total_commits': len(commits)
        },
        'developers': [d.to_dict() for d in developers],
        'recent_commits': [c.to_dict() for c in commits]
    }), 200

@dashboard_bp.route('/dev', methods=['GET'])
@dashboard_bp.route('/dev/', methods=['GET'])
def get_dev_dashboard():
    dev_user = User.query.filter_by(role_name='ROLE_DEV').first()
    dev_id = dev_user.id if dev_user else 4

    assigned_tasks = Task.query.filter_by(assigned_to_id=dev_id).all()
    my_commits = Commit.query.limit(10).all()

    return jsonify({
        'success': True,
        'metrics': {
            'assigned_tasks_count': len(assigned_tasks),
            'in_progress_count': len([t for t in assigned_tasks if t.status == 'IN_PROGRESS']),
            'completed_count': len([t for t in assigned_tasks if t.status == 'COMPLETED']),
            'my_commits_count': len(my_commits)
        },
        'tasks': [t.to_dict() for t in assigned_tasks],
        'commits': [c.to_dict() for c in my_commits]
    }), 200
