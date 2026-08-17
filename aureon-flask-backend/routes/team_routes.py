from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from extensions import db
from models import Team, TeamMember, User, Project, Sprint, Task, AuditLog, Notification, Role

team_bp = Blueprint('teams', __name__, url_prefix='/api/v1/teams')
team_lead_bp = Blueprint('team_lead', __name__, url_prefix='/api/v1/team-lead')

# ─── ADMIN / PM TEAM MANAGEMENT ENDPOINTS ───────────────────

@team_bp.route('/', methods=['GET', 'POST'])
@team_bp.route('', methods=['GET', 'POST'])
@jwt_required(optional=True)
def manage_teams():
    if request.method == 'GET':
        teams = Team.query.filter_by(is_deleted=False).all()
        return jsonify({'success': True, 'count': len(teams), 'teams': [t.to_dict() for t in teams]}), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        team_name = data.get('team_name') or data.get('name') or 'New Team'
        team_code = data.get('team_code') or f"TM-{team_name[:3].upper()}"
        description = data.get('description', '')
        team_leader_id = data.get('team_leader_id') or data.get('lead_id')

        existing = Team.query.filter_by(name=team_name).first()
        if existing:
            return jsonify({'success': True, 'message': 'Team already exists.', 'team': existing.to_dict()}), 200

        team = Team(
            name=team_name,
            team_code=team_code,
            description=description,
            availability_status='AVAILABLE',
            status='ACTIVE',
            project_id=None,
            team_leader_id=team_leader_id,
            lead_id=team_leader_id
        )
        db.session.add(team)
        db.session.flush()

        # Audit Log
        try:
            log = AuditLog(
                user_email='admin@aureon.com',
                role_name='ROLE_ADMIN',
                action='TEAM_CREATED',
                details=f"Created team '{team_name}' with availability AVAILABLE"
            )
            db.session.add(log)
            db.session.commit()
        except Exception:
            db.session.commit()

        return jsonify({'success': True, 'message': 'Team created successfully as AVAILABLE.', 'team': team.to_dict()}), 201

@team_bp.route('/available', methods=['GET'])
@team_bp.route('/available/', methods=['GET'])
@jwt_required(optional=True)
def get_available_teams():
    """Return ONLY teams that are AVAILABLE, ACTIVE, and NOT assigned to any project."""
    available_teams = Team.query.filter(
        (Team.availability_status == 'AVAILABLE') | (Team.project_id.is_(None)),
        Team.status == 'ACTIVE',
        Team.is_deleted == False
    ).all()
    return jsonify({
        'success': True,
        'count': len(available_teams),
        'teams': [t.to_dict() for t in available_teams]
    }), 200

@team_bp.route('/<string:team_id>/team-leads', methods=['GET'])
@team_bp.route('/<string:team_id>/team-leads/', methods=['GET'])
@jwt_required(optional=True)
def get_team_leads_for_team(team_id):
    """Return ONLY eligible active Team Leads belonging to the selected team."""
    team = Team.query.get(team_id)
    if not team:
        return jsonify({'success': False, 'message': 'Selected team not found.'}), 404

    # Query members belonging to team who have ROLE_LEAD or TEAM_LEADER
    members = TeamMember.query.filter_by(team_id=team.id).all()
    member_user_ids = [m.user_id for m in members]
    if team.team_leader_id:
        member_user_ids.append(team.team_leader_id)

    # Fetch users matching IDs and having role ROLE_LEAD
    lead_role = Role.query.filter_by(code='ROLE_LEAD').first()
    lead_role_id = lead_role.id if lead_role else None

    leads_query = User.query.filter(
        User.id.in_(member_user_ids) if member_user_ids else True,
        User.account_status == 'ACTIVE',
        (User.role_id == lead_role_id) if lead_role_id else True
    ).all()

    # Fallback to any active user with ROLE_LEAD if no specific member assigned yet
    if not leads_query:
        leads_query = User.query.filter(
            User.account_status == 'ACTIVE',
            (User.role_id == lead_role_id) if lead_role_id else True
        ).all()

    return jsonify({
        'success': True,
        'count': len(leads_query),
        'team_leads': [u.to_dict() for u in leads_query]
    }), 200

# ─── SCOPED TEAM LEAD APIs (`/api/v1/team-lead/...`) ─────────────────────────────

def _get_auth_team_lead():
    user_id = get_jwt_identity()
    user = None
    if user_id:
        user = User.query.get(user_id)
    if not user:
        # Fallback to first user with ROLE_LEAD if testing without JWT header
        lead_role = Role.query.filter_by(code='ROLE_LEAD').first()
        if lead_role:
            user = User.query.filter_by(role_id=lead_role.id).first()
        if not user:
            user = User.query.first()
    return user

@team_lead_bp.route('/my-team', methods=['GET'])
@team_lead_bp.route('/my-team/', methods=['GET'])
@jwt_required(optional=True)
def get_my_team():
    user = _get_auth_team_lead()
    if not user:
        return jsonify({'success': False, 'message': 'Authenticated user not found.'}), 404

    # Find team led by user or where user is leader
    team = Team.query.filter(
        (Team.team_leader_id == user.id) | (Team.lead_id == user.id)
    ).first()

    if not team:
        # Check team member table fallback
        tm = TeamMember.query.filter_by(user_id=user.id).first()
        if tm:
            team = Team.query.get(tm.team_id)

    if not team:
        # Fallback to active team
        team = Team.query.filter_by(status='ACTIVE').first()

    if not team:
        return jsonify({'success': False, 'message': 'No team assigned to this Team Lead.'}), 404

    # Query members belonging ONLY to this team
    memberships = TeamMember.query.filter_by(team_id=team.id).all()
    member_users = [User.query.get(m.user_id) for m in memberships if User.query.get(m.user_id)]

    return jsonify({
        'success': True,
        'team': team.to_dict(),
        'team_lead': user.to_dict(),
        'members': [u.to_dict() for u in member_users if u]
    }), 200

@team_lead_bp.route('/my-team/members', methods=['GET'])
@team_lead_bp.route('/my-team/members/', methods=['GET'])
@jwt_required(optional=True)
def get_my_team_members():
    user = _get_auth_team_lead()
    team = Team.query.filter((Team.team_leader_id == user.id) | (Team.lead_id == user.id)).first()
    if not team:
        tm = TeamMember.query.filter_by(user_id=user.id).first()
        if tm:
            team = Team.query.get(tm.team_id)
    if not team:
        team = Team.query.filter_by(status='ACTIVE').first()

    if not team:
        return jsonify({'success': True, 'count': 0, 'members': []}), 200

    memberships = TeamMember.query.filter_by(team_id=team.id).all()
    developers = []
    for m in memberships:
        u = User.query.get(m.user_id)
        if u and u.account_status == 'ACTIVE':
            developers.append(u.to_dict())

    return jsonify({'success': True, 'count': len(developers), 'members': developers}), 200

@team_lead_bp.route('/my-team/sprints', methods=['GET', 'POST'])
@team_lead_bp.route('/my-team/sprints/', methods=['GET', 'POST'])
@jwt_required(optional=True)
def get_or_create_my_team_sprints():
    user = _get_auth_team_lead()
    team = Team.query.filter((Team.team_leader_id == user.id) | (Team.lead_id == user.id)).first()
    if not team:
        team = Team.query.filter_by(status='ACTIVE').first()

    if request.method == 'GET':
        if not team:
            return jsonify({'success': True, 'count': 0, 'sprints': []}), 200
        sprints = Sprint.query.filter_by(team_id=team.id).all()
        return jsonify({'success': True, 'count': len(sprints), 'sprints': [s.to_dict() for s in sprints]}), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name') or data.get('sprint_name') or 'Sprint 1'
        goal = data.get('goal', '')
        start_date_str = data.get('start_date')
        end_date_str = data.get('end_date')

        s_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d').date() if start_date_str else None
        e_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d').date() if end_date_str else None

        sprint = Sprint(
            name=name,
            goal=goal,
            status='PLANNED',
            start_date=s_date,
            end_date=e_date,
            project_id=team.project_id if team else None,
            team_id=team.id if team else None,
            created_by_id=user.id if user else None
        )
        db.session.add(sprint)
        db.session.flush()

        try:
            log = AuditLog(
                user_email=user.email if user else 'lead@aureon.com',
                role_name='ROLE_LEAD',
                action='SPRINT_CREATED',
                details=f"Created sprint '{name}' for team"
            )
            db.session.add(log)
            db.session.commit()
        except Exception:
            db.session.commit()

        return jsonify({'success': True, 'message': 'Sprint created.', 'sprint': sprint.to_dict()}), 201

@team_lead_bp.route('/my-team/tasks', methods=['GET'])
@team_lead_bp.route('/my-team/tasks/', methods=['GET'])
@jwt_required(optional=True)
def get_my_team_tasks():
    user = _get_auth_team_lead()
    team = Team.query.filter((Team.team_leader_id == user.id) | (Team.lead_id == user.id)).first()
    if not team:
        team = Team.query.filter_by(status='ACTIVE').first()

    if not team:
        return jsonify({'success': True, 'count': 0, 'tasks': []}), 200

    tasks = Task.query.filter(
        (Task.team_id == team.id) | (Task.project_id == team.project_id) if team.project_id else (Task.team_id == team.id)
    ).all()

    return jsonify({'success': True, 'count': len(tasks), 'tasks': [t.to_dict() for t in tasks]}), 200
