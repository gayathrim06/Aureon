from flask import Blueprint, request, jsonify
from extensions import db
from models import Team, TeamMember, User, Project, AuditLog

team_bp = Blueprint('teams', __name__, url_prefix='/api/v1/teams')

@team_bp.route('/', methods=['GET', 'POST'])
@team_bp.route('', methods=['GET', 'POST'])
def manage_teams():
    if request.method == 'GET':
        teams = Team.query.all()
        return jsonify({'success': True, 'count': len(teams), 'teams': [t.to_dict() for t in teams]}), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name')
        project_id = data.get('project_id', 1)
        lead_id = data.get('lead_id')
        department = data.get('department', 'Engineering')

        team = Team(
            name=name,
            project_id=project_id,
            lead_id=lead_id,
            department=department
        )
        db.session.add(team)
        db.session.flush()

        log = AuditLog(
            action='TEAM_CREATED',
            entity='Team',
            entity_id=str(team.id),
            details=f"Created engineering team {name}"
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Team created.', 'team': team.to_dict()}), 201
