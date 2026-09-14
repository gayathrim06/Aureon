import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from extensions import db
from models import Project, ProjectMember, Team, TeamMember, User, AuditLog, Notification, Role, Repository, CodeQualityReport

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

def _get_auth_user():
    try:
        user_id = get_jwt_identity()
        if user_id:
            u_uuid = _parse_uuid(user_id)
            user = User.query.get(u_uuid or user_id)
            if user:
                return user
    except Exception:
        pass
    return None

def _get_auth_pm():
    user = _get_auth_user()
    if user:
        return user
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
        member_ids = data.get('member_ids') or data.get('team_members') or []

        if not project_name:
            return jsonify({'success': False, 'message': 'Project name is required.'}), 400

        # Validate Team Lead Selection if provided
        team_lead = None
        if team_lead_id:
            team_lead = User.query.get(team_lead_id)
        if not team_lead:
            raw_lead = data.get('lead_name') or data.get('lead')
            if raw_lead:
                clean_lead = str(raw_lead).strip().lower()
                for u in User.query.all():
                    if (u.display_name and clean_lead in u.display_name.lower()) or (u.username and clean_lead in u.username.lower()):
                        team_lead = u
                        break

        # ─── TRANSACTIONAL PROJECT CREATION (PM Workflow) ───
        try:
            s_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d').date() if start_date_str else None
            e_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d').date() if end_date_str else None

            project = Project(
                name=project_name,
                description=description,
                priority=priority,
                status=data.get('status') or 'IN_PROGRESS',
                start_date=s_date,
                target_deadline=e_date,
                manager_id=user.id if user else None,
                lead_id=team_lead.id if team_lead else None,
                is_active=True
            )
            db.session.add(project)
            db.session.flush()

            # Allocate Team Members to Project
            allocated_count = 0
            if isinstance(member_ids, list) and len(member_ids) > 0:
                for m_item in member_ids:
                    m_val = m_item.get('id') if isinstance(m_item, dict) else m_item
                    m_uuid = _parse_uuid(m_val)
                    if not m_uuid and isinstance(m_item, dict):
                        m_name = (m_item.get('name') or m_item.get('email') or '').strip().lower()
                        for u in User.query.all():
                            if (u.display_name and m_name in u.display_name.lower()) or (u.email and m_name in u.email.lower()):
                                m_uuid = u.id
                                break
                    if m_uuid:
                        pm_rec = ProjectMember(project_id=project.id, user_id=m_uuid)
                        db.session.add(pm_rec)
                        allocated_count += 1

            # If no explicit members provided, auto-allocate the assigned Team Lead's squad developers
            if allocated_count == 0 and team_lead:
                target_team = Team.query.filter(
                    (Team.team_leader_id == team_lead.id) | 
                    (Team.lead_id == team_lead.id)
                ).first()
                
                if target_team:
                    for tm in TeamMember.query.filter_by(team_id=target_team.id).all():
                        pm_rec = ProjectMember(project_id=project.id, user_id=tm.user_id)
                        db.session.add(pm_rec)
                        allocated_count += 1
                
                # Fallback to developers in engineering pool if team query was empty
                if allocated_count == 0:
                    dev_users = User.query.filter(User.role_name.in_(['ROLE_DEV', 'ROLE_QA'])).limit(3).all()
                    for du in dev_users:
                        pm_rec = ProjectMember(project_id=project.id, user_id=du.id)
                        db.session.add(pm_rec)

            # Create Audit Log
            log = AuditLog(
                user_email=user.email if user else 'pm@aureon.com',
                role_name=user.role_name if user else 'ROLE_PM',
                action='PROJECT_CREATED',
                details=f"PM created project '{project_name}' and assigned Team Lead '{team_lead.display_name if team_lead else 'Unassigned'}'"
            )
            db.session.add(log)

            # Create Notification for Team Lead
            if team_lead:
                notif = Notification(
                    recipient_id=team_lead.id,
                    title='New Project Lead Assignment',
                    message=f"You have been assigned as Team Lead for project '{project_name}' by Project Manager.",
                    notification_type='ASSIGNMENT'
                )
                db.session.add(notif)

            db.session.commit()
            return jsonify({'success': True, 'message': 'Project created and Team Lead assigned successfully.', 'project': project.to_dict()}), 201

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
        if 'lead_id' in data or 'team_lead_id' in data:
            lead_uuid = _parse_uuid(data.get('lead_id') or data.get('team_lead_id'))
            project.lead_id = lead_uuid

        member_ids = data.get('member_ids') or data.get('team_members')
        if isinstance(member_ids, list):
            ProjectMember.query.filter_by(project_id=project.id).delete()
            for m_id in member_ids:
                m_uuid = _parse_uuid(m_id)
                if m_uuid:
                    pm_rec = ProjectMember(project_id=project.id, user_id=m_uuid)
                    db.session.add(pm_rec)

        db.session.commit()
        return jsonify({'success': True, 'message': 'Project updated.', 'project': project.to_dict()}), 200

    if request.method == 'DELETE':
        project.is_active = False
        project.is_deleted = True
        db.session.commit()
        return jsonify({'success': True, 'message': 'Project soft-deleted.'}), 200

@project_bp.route('/my-lead-projects', methods=['GET'])
@jwt_required(optional=True)
def my_lead_projects():
    user = _get_auth_user()
    if not user:
        return jsonify({'success': True, 'count': 0, 'projects': []}), 200
    lead_projects = Project.query.filter_by(lead_id=user.id, is_active=True).all()
    return jsonify({'success': True, 'count': len(lead_projects), 'projects': [p.to_dict() for p in lead_projects]}), 200

# ---------------------------------------------------------------------------
# Health Score Endpoints
# ---------------------------------------------------------------------------

@project_bp.route('/<uuid:project_id>/health', methods=['GET'])
@jwt_required(optional=True)
def get_project_health(project_id):
    """Return the latest health calculation for the project.
    Any authenticated project member may view.
    """
    from services.project_health_service import HealthCalculator
    from models import Project
    project = Project.query.get_or_404(project_id)
    user = _get_auth_user()
    if not user or not hasattr(project, 'members') or user not in project.members:
        return jsonify({'success': False, 'message': 'Forbidden'}), 403
    result = HealthCalculator.calculate_health_score(project_id, explicit_request=False)
    return jsonify(result)

@project_bp.route('/<uuid:project_id>/health/calculate', methods=['POST'])
@jwt_required(optional=True)
def calculate_project_health(project_id):
    """Force a health recalculation and persist snapshot.
    Restricted to ADMIN, PM, TL roles.
    """
    user = _get_auth_user()
    if not user or user.role_name not in ['ROLE_ADMIN', 'ROLE_PM', 'ROLE_TL']:
        return jsonify({'success': False, 'message': 'Forbidden'}), 403
    from services.project_health_service import HealthCalculator
    from models import Project
    project = Project.query.get_or_404(project_id)
    result = HealthCalculator.calculate_health_score(project_id, explicit_request=True)
    return jsonify(result)

@project_bp.route('/<uuid:project_id>/health/history', methods=['GET'])
@jwt_required(optional=True)
def get_health_history(project_id):
    from models import ProjectHealthHistory, Project
    user = _get_auth_user()
    project = Project.query.get_or_404(project_id)
    if not user or not hasattr(project, 'members') or user not in project.members:
        return jsonify({'success': False, 'message': 'Forbidden'}), 403
    histories = (
        ProjectHealthHistory.query.filter_by(project_id=project_id)
        .order_by(ProjectHealthHistory.calculated_at.desc())
        .limit(100)
        .all()
    )
    return jsonify([h.to_dict() for h in histories])

@project_bp.route('/<uuid:project_id>/health/risks', methods=['GET'])
@jwt_required(optional=True)
def get_project_risks(project_id):
    from services.project_health_service import HealthCalculator
    from models import Project
    user = _get_auth_user()
    project = Project.query.get_or_404(project_id)
    if not user or not hasattr(project, 'members') or user not in project.members:
        return jsonify({'success': False, 'message': 'Forbidden'}), 403
    github = HealthCalculator._calculate_github_score(project_id)
    eng = HealthCalculator._calculate_engineering_risk_score(project_id)
    combined = github.get('risks', []) + eng.get('risks', [])
    return jsonify(combined)
