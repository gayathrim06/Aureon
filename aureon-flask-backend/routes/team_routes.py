import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from extensions import db
from models import Team, TeamMember, User, Project, Sprint, Task, AuditLog, Notification, Role

team_bp = Blueprint('teams', __name__, url_prefix='/api/v1/teams')
team_lead_bp = Blueprint('team_lead', __name__, url_prefix='/api/v1/team-lead')

def _parse_uuid(val):
    if not val:
        return None
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return None

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
        team_leader_id = _parse_uuid(data.get('team_leader_id') or data.get('lead_id'))

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
        db.session.commit()

        return jsonify({'success': True, 'message': 'Team created successfully as AVAILABLE.', 'team': team.to_dict()}), 201

@team_bp.route('/available', methods=['GET'])
@team_bp.route('/available/', methods=['GET'])
@jwt_required(optional=True)
def get_available_teams():
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

@team_bp.route('/<string:team_id>', methods=['GET', 'PUT', 'DELETE'])
@team_bp.route('/<string:team_id>/', methods=['GET', 'PUT', 'DELETE'])
@jwt_required(optional=True)
def team_detail(team_id):
    t_uuid = _parse_uuid(team_id)
    team = Team.query.get(t_uuid or team_id)
    if not team:
        return jsonify({'success': False, 'message': 'Team not found.'}), 404

    if request.method == 'GET':
        return jsonify({'success': True, 'team': team.to_dict()}), 200

    if request.method == 'PUT':
        data = request.get_json() or {}
        if 'name' in data:
            team.name = data['name']
        if 'description' in data:
            team.description = data['description']
        if 'team_leader_id' in data or 'lead_id' in data:
            lead_val = _parse_uuid(data.get('team_leader_id') or data.get('lead_id'))
            team.team_leader_id = lead_val
            team.lead_id = lead_val
        db.session.commit()
        return jsonify({'success': True, 'message': 'Team updated.', 'team': team.to_dict()}), 200

    if request.method == 'DELETE':
        team.is_deleted = True
        team.status = 'INACTIVE'
        db.session.commit()
        return jsonify({'success': True, 'message': 'Team soft-deleted.'}), 200

@team_bp.route('/<string:team_id>/team-leads', methods=['GET'])
@team_bp.route('/<string:team_id>/team-leads/', methods=['GET'])
@jwt_required(optional=True)
def get_team_leads_for_team(team_id):
    t_uuid = _parse_uuid(team_id)
    team = Team.query.get(t_uuid or team_id)
    if not team:
        return jsonify({'success': False, 'message': 'Selected team not found.'}), 404

    members = TeamMember.query.filter_by(team_id=team.id).all()
    member_user_ids = [m.user_id for m in members]
    if team.team_leader_id:
        member_user_ids.append(team.team_leader_id)

    lead_role = Role.query.filter_by(code='ROLE_LEAD').first()
    lead_role_id = lead_role.id if lead_role else None

    leads_query = User.query.filter(
        User.id.in_(member_user_ids) if member_user_ids else True,
        User.account_status == 'ACTIVE',
        (User.role_id == lead_role_id) if lead_role_id else True
    ).all()

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

# ─── TEAM MEMBER MANAGEMENT ENDPOINTS ───────────────────

@team_bp.route('/<string:team_id>/members', methods=['GET', 'POST'])
@team_bp.route('/<string:team_id>/members/', methods=['GET', 'POST'])
@jwt_required(optional=True)
def manage_team_members(team_id):
    t_uuid = _parse_uuid(team_id)
    team = Team.query.get(t_uuid or team_id)
    if not team:
        return jsonify({'success': False, 'message': 'Team not found.'}), 404

    if request.method == 'GET':
        memberships = TeamMember.query.filter_by(team_id=team.id).all()
        member_users = [User.query.get(m.user_id) for m in memberships if User.query.get(m.user_id)]
        return jsonify({
            'success': True,
            'count': len(member_users),
            'members': [u.to_dict() for u in member_users]
        }), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        u_uuid = _parse_uuid(data.get('user_id'))
        if not u_uuid:
            return jsonify({'success': False, 'message': 'user_id is required.'}), 400

        user_obj = User.query.get(u_uuid)
        if not user_obj:
            return jsonify({'success': False, 'message': 'User not found.'}), 404

        # Prevent duplicate membership
        existing = TeamMember.query.filter_by(team_id=team.id, user_id=user_obj.id).first()
        if existing:
            return jsonify({'success': True, 'message': 'User is already a member of this team.'}), 200

        membership = TeamMember(team_id=team.id, user_id=user_obj.id)
        db.session.add(membership)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Member added to team.', 'member': user_obj.to_dict()}), 201

@team_bp.route('/<string:team_id>/members/<string:user_id>', methods=['DELETE'])
@team_bp.route('/<string:team_id>/members/<string:user_id>/', methods=['DELETE'])
@jwt_required(optional=True)
def remove_team_member(team_id, user_id):
    t_uuid = _parse_uuid(team_id)
    u_uuid = _parse_uuid(user_id)
    membership = TeamMember.query.filter_by(team_id=t_uuid or team_id, user_id=u_uuid or user_id).first()
    if not membership:
        return jsonify({'success': False, 'message': 'Team membership record not found.'}), 404

    db.session.delete(membership)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Member removed from team.'}), 200

# ─── SCOPED TEAM LEAD APIs (`/api/v1/team-lead/...`) ─────────────────────────────

def _get_auth_team_lead():
    try:
        user_id = get_jwt_identity()
        if user_id:
            u_uuid = _parse_uuid(user_id)
            user = User.query.get(u_uuid or user_id)
            if user:
                return user
    except Exception:
        pass
    lead_role = Role.query.filter_by(code='ROLE_LEAD').first()
    if lead_role:
        return User.query.filter_by(role_id=lead_role.id).first()
    return User.query.first()

@team_lead_bp.route('/my-team', methods=['GET'])
@team_lead_bp.route('/my-team/', methods=['GET'])
@jwt_required(optional=True)
def get_my_team():
    user = _get_auth_team_lead()
    if not user:
        return jsonify({'success': False, 'message': 'Authenticated user not found.'}), 404

    u_uuid = user.id

    team = Team.query.filter((Team.team_leader_id == u_uuid) | (Team.lead_id == u_uuid)).first()

    if not team:
        tm = TeamMember.query.filter_by(user_id=u_uuid).first()
        if tm:
            team = Team.query.get(tm.team_id)

    if not team:
        team = Team.query.filter_by(status='ACTIVE').first()

    if not team:
        return jsonify({'success': False, 'message': 'No team assigned to this Team Lead.'}), 404

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
    u_uuid = user.id if user else None
    team = Team.query.filter((Team.team_leader_id == u_uuid) | (Team.lead_id == u_uuid)).first() if u_uuid else None
    if not team and u_uuid:
        tm = TeamMember.query.filter_by(user_id=u_uuid).first()
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
    u_uuid = user.id if user else None
    team = Team.query.filter((Team.team_leader_id == u_uuid) | (Team.lead_id == u_uuid)).first() if u_uuid else None
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
        db.session.commit()

        return jsonify({'success': True, 'message': 'Sprint created.', 'sprint': sprint.to_dict()}), 201

@team_lead_bp.route('/my-team/tasks', methods=['GET'])
@team_lead_bp.route('/my-team/tasks/', methods=['GET'])
@jwt_required(optional=True)
def get_my_team_tasks():
    user = _get_auth_team_lead()
    u_uuid = user.id if user else None
    team = Team.query.filter((Team.team_leader_id == u_uuid) | (Team.lead_id == u_uuid)).first() if u_uuid else None
    if not team:
        team = Team.query.filter_by(status='ACTIVE').first()

    if not team:
        return jsonify({'success': True, 'count': 0, 'tasks': []}), 200

    tasks = Task.query.filter(
        (Task.team_id == team.id) | (Task.project_id == team.project_id) if team.project_id else (Task.team_id == team.id)
    ).all()

    return jsonify({'success': True, 'count': len(tasks), 'tasks': [t.to_dict() for t in tasks]}), 200
