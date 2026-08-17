from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from extensions import db
from models import Project, ProjectMember, Team, TeamMember, User, AuditLog, Notification, Role

project_bp = Blueprint('projects', __name__, url_prefix='/api/v1/projects')
pm_bp = Blueprint('project_manager', __name__, url_prefix='/api/v1/project-manager')

def _get_auth_pm():
    user_id = get_jwt_identity()
    user = None
    if user_id:
        user = User.query.get(user_id)
    if not user:
        pm_role = Role.query.filter_by(code='ROLE_PM').first()
        if pm_role:
            user = User.query.filter_by(role_id=pm_role.id).first()
        if not user:
            user = User.query.first()
    return user

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
        team_id = data.get('team_id')
        team_lead_id = data.get('team_lead_id') or data.get('lead_id')

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
    team = Team.query.get(team_id)
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

    projects = Project.query.filter(
        (Project.project_manager_id == user.id) | (Project.manager_id == user.id),
        Project.is_active == True
    ).all()

    if not projects:
        projects = Project.query.filter_by(is_active=True).all()

    return jsonify({'success': True, 'count': len(projects), 'projects': [p.to_dict() for p in projects]}), 200
