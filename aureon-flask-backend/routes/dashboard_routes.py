from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from extensions import db
from models import User, Project, Team, Task, Risk, Repository, Commit, CodeAnalysis, AuditLog, TeamMember, Sprint, Role

dashboard_bp = Blueprint('dashboards', __name__, url_prefix='/api/v1/dashboards')

def _get_jwt_user():
    user_id = get_jwt_identity()
    user = None
    if user_id:
        user = User.query.get(user_id)
    return user

@dashboard_bp.route('/admin', methods=['GET'])
@dashboard_bp.route('/admin/', methods=['GET'])
@jwt_required(optional=True)
def get_admin_dashboard():
    today_str = datetime.utcnow().strftime('%Y-%m-%d')

    total_users = User.query.count()
    active_users = User.query.filter_by(account_status='ACTIVE').count()
    inactive_users = User.query.filter_by(account_status='INACTIVE').count()
    locked_users = User.query.filter_by(account_status='LOCKED').count()

    total_projects = Project.query.filter_by(is_active=True).count()
    active_projects = Project.query.filter_by(is_active=True, status='IN_PROGRESS').count()
    completed_projects = Project.query.filter_by(status='COMPLETED').count()

    total_teams = Team.query.filter_by(is_deleted=False).count()
    available_teams = Team.query.filter(Team.availability_status == 'AVAILABLE', Team.is_deleted == False).count()
    assigned_teams = Team.query.filter(Team.availability_status == 'ASSIGNED', Team.is_deleted == False).count()

    tasks = Task.query.all()
    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t.status in ('COMPLETED', 'DONE')])
    pending_tasks = len([t for t in tasks if t.status in ('TODO', 'IN_PROGRESS', 'REVIEW')])
    overdue_tasks = len([t for t in tasks if t.status not in ('COMPLETED', 'DONE') and t.due_date and str(t.due_date) < today_str])

    system_alerts = Risk.query.filter_by(status='OPEN').count()
    recent_logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(8).all()
    projects = Project.query.filter_by(is_active=True).all()
    avg_health = sum((p.health_score or 90) for p in projects) // len(projects) if projects else 90

    return jsonify({
        'success': True,
        'metrics': {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'locked_users': locked_users,
            'total_projects': total_projects,
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'total_teams': total_teams,
            'available_teams': available_teams,
            'assigned_teams': assigned_teams,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'overdue_tasks': overdue_tasks,
            'system_alerts': system_alerts,
            'overall_project_health': avg_health
        },
        'recent_activities': [l.to_dict() for l in recent_logs]
    }), 200

@dashboard_bp.route('/project-manager', methods=['GET'])
@dashboard_bp.route('/project-manager/', methods=['GET'])
@dashboard_bp.route('/pm', methods=['GET'])
@dashboard_bp.route('/pm/', methods=['GET'])
@jwt_required(optional=True)
def get_pm_dashboard():
    today_str = datetime.utcnow().strftime('%Y-%m-%d')
    user = _get_jwt_user()
    if not user:
        pm_role = Role.query.filter_by(code='ROLE_PM').first()
        if pm_role:
            user = User.query.filter_by(role_id=pm_role.id).first()
        if not user:
            user = User.query.first()

    my_projects = Project.query.filter(
        (Project.manager_id == user.id) | (Project.lead_id == user.id),
        Project.is_active == True
    ).all() if user else []

    if not my_projects:
        my_projects = Project.query.filter_by(is_active=True).all()

    project_ids = [p.id for p in my_projects]
    tasks = Task.query.filter(Task.project_id.in_(project_ids)).all() if project_ids else []
    completed_tasks = [t for t in tasks if t.status in ('COMPLETED', 'DONE')]
    overdue_tasks = [t for t in tasks if t.status not in ('COMPLETED', 'DONE') and t.due_date and str(t.due_date) < today_str]
    open_risks = Risk.query.filter(Risk.project_id.in_(project_ids), Risk.status == 'OPEN').all() if project_ids else []

    assigned_teams = Team.query.filter(Team.project_id.in_(project_ids)).all() if project_ids else []
    available_teams = Team.query.filter(Team.availability_status == 'AVAILABLE', Team.is_deleted == False).all()

    avg_health = sum((p.health_score or 90) for p in my_projects) // len(my_projects) if my_projects else 85

    return jsonify({
        'success': True,
        'metrics': {
            'own_projects_count': len(my_projects),
            'active_projects_count': len([p for p in my_projects if p.status == 'IN_PROGRESS']),
            'assigned_teams_count': len(assigned_teams),
            'available_teams_count': len(available_teams),
            'total_tasks': len(tasks),
            'completed_tasks': len(completed_tasks),
            'overdue_tasks': len(overdue_tasks),
            'open_risks_count': len(open_risks),
            'project_health_avg': avg_health
        },
        'projects': [p.to_dict() for p in my_projects],
        'risks': [r.to_dict() for r in open_risks]
    }), 200

@dashboard_bp.route('/team-leader', methods=['GET'])
@dashboard_bp.route('/team-leader/', methods=['GET'])
@dashboard_bp.route('/lead', methods=['GET'])
@dashboard_bp.route('/lead/', methods=['GET'])
@jwt_required(optional=True)
def get_lead_dashboard():
    today_str = datetime.utcnow().strftime('%Y-%m-%d')
    user = _get_jwt_user()
    if not user:
        lead_role = Role.query.filter_by(code='ROLE_LEAD').first()
        if lead_role:
            user = User.query.filter_by(role_id=lead_role.id).first()
        if not user:
            user = User.query.first()

    my_team = Team.query.filter((Team.team_leader_id == user.id) | (Team.lead_id == user.id)).first() if user else None
    if not my_team:
        my_team = Team.query.filter_by(status='ACTIVE').first()

    if not my_team:
        return jsonify({
            'success': True,
            'metrics': {'team_size': 0, 'active_tasks': 0, 'completed_tasks': 0},
            'developers': [],
            'recent_commits': []
        }), 200

    memberships = TeamMember.query.filter_by(team_id=my_team.id).all()
    member_users = [User.query.get(m.user_id) for m in memberships if User.query.get(m.user_id)]

    team_sprints = Sprint.query.filter_by(team_id=my_team.id).all()
    team_tasks = Task.query.filter_by(team_id=my_team.id).all()
    completed_tasks = [t for t in team_tasks if t.status in ('COMPLETED', 'DONE')]
    pending_tasks = [t for t in team_tasks if t.status in ('TODO', 'IN_PROGRESS')]
    blocked_tasks = [t for t in team_tasks if t.status == 'BLOCKED']
    overdue_tasks = [t for t in team_tasks if t.status not in ('COMPLETED', 'DONE') and t.due_date and str(t.due_date) < today_str]

    commits = Commit.query.order_by(Commit.timestamp.desc()).limit(10).all()

    return jsonify({
        'success': True,
        'team': my_team.to_dict(),
        'metrics': {
            'team_size': len(member_users),
            'developer_count': len(member_users),
            'sprints_count': len(team_sprints),
            'total_tasks': len(team_tasks),
            'active_tasks': len(pending_tasks),
            'completed_tasks': len(completed_tasks),
            'pending_tasks': len(pending_tasks),
            'blocked_tasks': len(blocked_tasks),
            'overdue_tasks': len(overdue_tasks),
            'total_commits': len(commits)
        },
        'developers': [u.to_dict() for u in member_users],
        'recent_commits': [c.to_dict() for c in commits]
    }), 200

@dashboard_bp.route('/developer', methods=['GET'])
@dashboard_bp.route('/developer/', methods=['GET'])
@dashboard_bp.route('/dev', methods=['GET'])
@dashboard_bp.route('/dev/', methods=['GET'])
@jwt_required(optional=True)
def get_dev_dashboard():
    today_str = datetime.utcnow().strftime('%Y-%m-%d')
    user = _get_jwt_user()
    if not user:
        dev_role = Role.query.filter_by(code='ROLE_DEV').first()
        if dev_role:
            user = User.query.filter_by(role_id=dev_role.id).first()
        if not user:
            user = User.query.first()

    assigned_tasks = Task.query.filter_by(assigned_to_id=user.id).all() if user else []
    completed_tasks = [t for t in assigned_tasks if t.status in ('COMPLETED', 'DONE')]
    pending_tasks = [t for t in assigned_tasks if t.status in ('TODO', 'IN_PROGRESS')]
    overdue_tasks = [t for t in assigned_tasks if t.status not in ('COMPLETED', 'DONE') and t.due_date and str(t.due_date) < today_str]

    my_commits = Commit.query.filter_by(user_id=user.id).limit(10).all() if user else []

    return jsonify({
        'success': True,
        'metrics': {
            'assigned_tasks_count': len(assigned_tasks),
            'completed_tasks_count': len(completed_tasks),
            'pending_tasks_count': len(pending_tasks),
            'overdue_tasks_count': len(overdue_tasks),
            'my_commits_count': len(my_commits)
        },
        'tasks': [t.to_dict() for t in assigned_tasks],
        'commits': [c.to_dict() for c in my_commits]
    }), 200
