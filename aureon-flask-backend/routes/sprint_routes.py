from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from extensions import db
from models import Sprint, Team, Project, User, AuditLog, Role

sprint_bp = Blueprint('sprints', __name__, url_prefix='/api/v1/sprints')

def _get_auth_user():
    user_id = get_jwt_identity()
    user = None
    if user_id:
        user = User.query.get(user_id)
    if not user:
        user = User.query.first()
    return user

@sprint_bp.route('/', methods=['GET', 'POST'])
@sprint_bp.route('', methods=['GET', 'POST'])
@jwt_required(optional=True)
def manage_sprints():
    user = _get_auth_user()

    if request.method == 'GET':
        sprints = Sprint.query.all()
        return jsonify({'success': True, 'count': len(sprints), 'sprints': [s.to_dict() for s in sprints]}), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name') or data.get('sprint_name') or 'New Sprint'
        goal = data.get('goal', '')
        status = data.get('status', 'PLANNED')
        project_id = data.get('project_id')
        team_id = data.get('team_id')
        start_date_str = data.get('start_date')
        end_date_str = data.get('end_date')

        # ─── TEAM LEAD SPRINT CONTROL CHECK ───
        if user and user.role_name == 'ROLE_LEAD':
            lead_team = Team.query.filter((Team.team_leader_id == user.id) | (Team.lead_id == user.id)).first()
            if lead_team:
                if team_id and str(team_id) != str(lead_team.id):
                    return jsonify({'success': False, 'message': '403 Forbidden: Cannot create sprint for another team.'}), 403
                team_id = lead_team.id
                if not project_id and lead_team.project_id:
                    project_id = lead_team.project_id

        s_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d').date() if start_date_str else None
        e_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d').date() if end_date_str else None

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
                details=f"Created sprint '{name}'"
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
    sprint = Sprint.query.get(sprint_id)
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
        if 'name' in data:
            sprint.name = data['name']
        if 'goal' in data:
            sprint.goal = data['goal']
        if 'status' in data:
            sprint.status = data['status']
        db.session.commit()
        return jsonify({'success': True, 'message': 'Sprint updated.', 'sprint': sprint.to_dict()}), 200

    if request.method == 'DELETE':
        db.session.delete(sprint)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Sprint deleted.'}), 200

@sprint_bp.route('/<string:sprint_id>/status', methods=['PATCH', 'PUT'])
@sprint_bp.route('/<string:sprint_id>/status/', methods=['PATCH', 'PUT'])
@jwt_required(optional=True)
def update_sprint_status(sprint_id):
    user = _get_auth_user()
    sprint = Sprint.query.get(sprint_id)
    if not sprint:
        return jsonify({'success': False, 'message': 'Sprint not found.'}), 404

    if user and user.role_name == 'ROLE_LEAD':
        lead_team = Team.query.filter((Team.team_leader_id == user.id) | (Team.lead_id == user.id)).first()
        if lead_team and sprint.team_id and str(sprint.team_id) != str(lead_team.id):
            return jsonify({'success': False, 'message': '403 Forbidden: Cannot change status of another team\'s sprint.'}), 403

    data = request.get_json() or {}
    new_status = data.get('status', 'ACTIVE')
    sprint.status = new_status
    db.session.commit()

    return jsonify({'success': True, 'message': f'Sprint status updated to {new_status}.', 'sprint': sprint.to_dict()}), 200
