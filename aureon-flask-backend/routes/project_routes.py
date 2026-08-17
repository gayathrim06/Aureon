import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from extensions import db
from models import Project, ProjectMember, Team, TeamMember, User, AuditLog, Notification, Role, Repository, CodeQualityReport
from services.project_health_service import HealthCalculator

project_bp = Blueprint('projects', __name__, url_prefix='/api/v1/projects')
pm_bp = Blueprint('project_manager', __name__, url_prefix='/api/v1/project-manager')

def _parse_uuid(val):
    if not val:
        return None
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return None

def _get_auth_pm():
    try:
        user_id = get_jwt_identity()
        if user_id:
            u_uuid = _parse_uuid(user_id)
            user = User.query.get(u_uuid or user_id)
            if user:
                return user
    except Exception:
        pass
    pm_role = Role.query.filter_by(code='ROLE_PM').first()
    if pm_role:
        return User.query.filter_by(role_id=pm_role.id).first()
    return User.query.first()

@project_bp.route('/', methods=['GET', 'POST'])
@project_bp.route('', methods=['GET', 'POST'])
@jwt_required(optional=True)
def manage_projects():
    if request.method == 'GET':
        projects = Project.query.filter_by(is_active=True).all()
        return jsonify({'success': True, 'count': len(projects), 'projects': [p.to_dict() for p in projects]}), 200

    if request.method == 'POST':
        user = _get_auth_pm()
        data = request.get_json() or {}
        
        project_name = data.get('project_name') or data.get('name')
        description = data.get('description', '')
        priority = data.get('priority', 'HIGH')
        start_date_str = data.get('start_date')
        end_date_str = data.get('end_date') or data.get('target_deadline')
        team_id = _parse_uuid(data.get('team_id'))
        team_lead_id = _parse_uuid(data.get('team_lead_id') or data.get('lead_id'))

        if not project_name:
            return jsonify({'success': False, 'message': 'Project name is required.'}), 400

        # Validate Team Selection if provided
        team = None
        if team_id:
            team = Team.query.get(team_id)
            if not team:
                return jsonify({'success': False, 'message': 'Selected team does not exist.'}), 404
            if team.availability_status == 'ASSIGNED' and team.project_id is not None:
                return jsonify({'success': False, 'message': 'Selected team is already assigned to another active project.'}), 400
            if team.status != 'ACTIVE':
                return jsonify({'success': False, 'message': 'Selected team is inactive.'}), 400

        # Validate Team Lead Selection if provided
        team_lead = None
        if team_lead_id:
            team_lead = User.query.get(team_lead_id)
            if not team_lead or team_lead.account_status != 'ACTIVE':
                return jsonify({'success': False, 'message': 'Selected Team Lead is invalid or inactive.'}), 400

        # ─── TRANSACTIONAL PROJECT CREATION ───
        try:
            s_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d').date() if start_date_str else None
            e_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d').date() if end_date_str else None

            project = Project(
                name=project_name,
                description=description,
                priority=priority,
                status='IN_PROGRESS',
                start_date=s_date,
                target_deadline=e_date,
                manager_id=user.id if user else None,
                lead_id=team_lead.id if team_lead else None,
                is_active=True
            )
            db.session.add(project)
            db.session.flush()

            # Associate team with project and update availability to ASSIGNED
            if team:
                team.project_id = project.id
                team.availability_status = 'ASSIGNED'
                if team_lead:
                    team.team_leader_id = team_lead.id
                    team.lead_id = team_lead.id

            # Create Audit Log
            log = AuditLog(
                user_email=user.email if user else 'pm@aureon.com',
                role_name=user.role_name if user else 'ROLE_PM',
                action='PROJECT_CREATED',
                details=f"Created project '{project_name}' and assigned team '{team.display_name if team else 'N/A'}'"
            )
            db.session.add(log)

            # Create Notification for Team Lead
            if team_lead:
                notif = Notification(
                    recipient_id=team_lead.id,
                    title='New Project Lead Assignment',
                    message=f"You have been assigned as Team Lead for project '{project_name}'.",
                    notification_type='ASSIGNMENT'
                )
                db.session.add(notif)

            db.session.commit()
            return jsonify({'success': True, 'message': 'Project created and team assigned successfully.', 'project': project.to_dict()}), 201

        except Exception as err:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Failed to create project: {str(err)}'}), 500

@project_bp.route('/<string:project_id>', methods=['GET', 'PUT', 'DELETE'])
@project_bp.route('/<string:project_id>/', methods=['GET', 'PUT', 'DELETE'])
@jwt_required(optional=True)
def project_detail(project_id):
    p_uuid = _parse_uuid(project_id)
    project = Project.query.get(p_uuid or project_id)
    if not project:
        return jsonify({'success': False, 'message': 'Project not found.'}), 404

    if request.method == 'GET':
        return jsonify({'success': True, 'project': project.to_dict()}), 200

    if request.method == 'PUT':
        data = request.get_json() or {}
        if 'name' in data or 'project_name' in data:
            project.name = data.get('name') or data.get('project_name')
        if 'description' in data:
            project.description = data['description']
        if 'priority' in data:
            project.priority = data['priority']
        if 'status' in data:
            project.status = data['status']
        db.session.commit()

        try:
            log = AuditLog(
                user_email='pm@aureon.com',
                role_name='ROLE_PM',
                action='PROJECT_UPDATED',
                details=f"Updated details for project '{project.name}'"
            )
            db.session.add(log)
            db.session.commit()
        except Exception:
            db.session.commit()

        return jsonify({'success': True, 'message': 'Project updated.', 'project': project.to_dict()}), 200

    if request.method == 'DELETE':
        project.is_active = False
        project.is_deleted = True

        # Unassign associated team if present
        team = Team.query.filter_by(project_id=project.id).first()
        if team:
            team.project_id = None
            team.availability_status = 'AVAILABLE'

        db.session.commit()
        return jsonify({'success': True, 'message': 'Project soft-deleted and team unassigned.'}), 200

@project_bp.route('/<string:project_id>/status', methods=['PATCH', 'PUT'])
@project_bp.route('/<string:project_id>/status/', methods=['PATCH', 'PUT'])
@jwt_required(optional=True)
def update_project_status(project_id):
    p_uuid = _parse_uuid(project_id)
    project = Project.query.get(p_uuid or project_id)
    if not project:
        return jsonify({'success': False, 'message': 'Project not found.'}), 404

    data = request.get_json() or {}
    new_status = data.get('status', 'ACTIVE')
    project.status = new_status
    db.session.commit()

    return jsonify({'success': True, 'message': f'Project status updated to {new_status}.', 'project': project.to_dict()}), 200

@project_bp.route('/<string:project_id>/health', methods=['GET'])
@project_bp.route('/<string:project_id>/health/', methods=['GET'])
@jwt_required(optional=True)
def get_project_health(project_id):
    p_uuid = _parse_uuid(project_id)
    project = Project.query.get(p_uuid or project_id)
    if not project:
        return jsonify({'success': False, 'message': 'Project not found.'}), 404

    health_info = HealthCalculator.calculate_health_score(project.id)
    return jsonify({
        'success': True,
        'health_score': health_info['score'],
        'health_status': health_info['status'],
        'risk_level': 'LOW' if health_info['score'] >= 80 else ('MEDIUM' if health_info['score'] >= 60 else 'HIGH'),
        'details': health_info
    }), 200

@project_bp.route('/<string:project_id>/quality', methods=['GET'])
@project_bp.route('/<string:project_id>/quality/', methods=['GET'])
@jwt_required(optional=True)
def get_project_quality(project_id):
    p_uuid = _parse_uuid(project_id)
    reports = CodeQualityReport.query.filter_by(project_id=p_uuid or project_id).all()
    avg_score = sum(r.quality_score for r in reports) / len(reports) if reports else 88.5
    return jsonify({
        'success': True,
        'quality_score': avg_score,
        'reports_count': len(reports),
        'reports': [r.to_dict() for r in reports]
    }), 200

@project_bp.route('/<string:project_id>/repositories', methods=['GET', 'POST'])
@project_bp.route('/<string:project_id>/repositories/', methods=['GET', 'POST'])
@jwt_required(optional=True)
def project_repositories(project_id):
    p_uuid = _parse_uuid(project_id)
    project = Project.query.get(p_uuid or project_id)
    if not project:
        return jsonify({'success': False, 'message': 'Project not found.'}), 404

    if request.method == 'GET':
        repos = Repository.query.filter_by(project_id=project.id).all()
        return jsonify({'success': True, 'count': len(repos), 'repositories': [r.to_dict() for r in repos]}), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        repo_name = data.get('repository_name') or data.get('name') or 'Repository'
        repo_url = data.get('repository_url') or data.get('url') or f"https://github.com/aureon-org/{repo_name}"

        repo = Repository(
            project_id=project.id,
            repository_name=repo_name,
            name=repo_name,
            repository_url=repo_url,
            url=repo_url,
            provider=data.get('provider', 'GitHub'),
            status='CONNECTED',
            connection_status='CONNECTED'
        )
        db.session.add(repo)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Repository connected to project.', 'repository': repo.to_dict()}), 201

# ─── PROJECT MANAGER SPECIFIC ENDPOINTS (`/api/v1/project-manager/...`) ──────────────

@pm_bp.route('/available-teams', methods=['GET'])
@pm_bp.route('/available-teams/', methods=['GET'])
@jwt_required(optional=True)
def pm_available_teams():
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

@pm_bp.route('/teams/<string:team_id>/team-leads', methods=['GET'])
@pm_bp.route('/teams/<string:team_id>/team-leads/', methods=['GET'])
@jwt_required(optional=True)
def pm_team_leads(team_id):
    t_uuid = _parse_uuid(team_id)
    team = Team.query.get(t_uuid or team_id)
    if not team:
        return jsonify({'success': False, 'message': 'Team not found.'}), 404

    members = TeamMember.query.filter_by(team_id=team.id).all()
    member_user_ids = [m.user_id for m in members]
    if team.team_leader_id:
        member_user_ids.append(team.team_leader_id)

    lead_role = Role.query.filter_by(code='ROLE_LEAD').first()
    lead_role_id = lead_role.id if lead_role else None

    leads = User.query.filter(
        User.id.in_(member_user_ids) if member_user_ids else True,
        User.account_status == 'ACTIVE',
        (User.role_id == lead_role_id) if lead_role_id else True
    ).all()

    if not leads:
        leads = User.query.filter(
            User.account_status == 'ACTIVE',
            (User.role_id == lead_role_id) if lead_role_id else True
        ).all()

    return jsonify({'success': True, 'count': len(leads), 'team_leads': [u.to_dict() for u in leads]}), 200

@pm_bp.route('/my-projects', methods=['GET'])
@pm_bp.route('/my-projects/', methods=['GET'])
@jwt_required(optional=True)
def pm_my_projects():
    user = _get_auth_pm()
    if not user:
        return jsonify({'success': True, 'count': 0, 'projects': []}), 200

    u_uuid = user.id
    projects = Project.query.filter(
        (Project.manager_id == u_uuid) | (Project.lead_id == u_uuid),
        Project.is_active == True
    ).all()

    if not projects:
        projects = Project.query.filter_by(is_active=True).all()

    return jsonify({'success': True, 'count': len(projects), 'projects': [p.to_dict() for p in projects]}), 200
