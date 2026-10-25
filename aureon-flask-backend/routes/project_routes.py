import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from extensions import db
from models import Project, ProjectMember, Team, TeamMember, User, AuditLog, Notification, Role, Repository, CodeQualityReport
from services.rbac_service import get_user_scope, get_auth_user

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
    return get_auth_user()

def _get_auth_pm():
    return get_auth_user()

@project_bp.route('/', methods=['GET', 'POST'])
@project_bp.route('', methods=['GET', 'POST'])
@jwt_required(optional=True)
def manage_projects():
    user = _get_auth_user()
    scope = get_user_scope(user)

    if request.method == 'GET':
        if not user:
            return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required to view projects.'}), 401
        if scope.is_admin:
            query = Project.query.filter_by(is_deleted=False)
        else:
            query = Project.query.filter_by(is_deleted=False).filter(Project.id.in_(scope.project_ids))
        projects = query.all()
        return jsonify({'success': True, 'count': len(projects), 'projects': [p.to_dict() for p in projects]}), 200

    if request.method == 'POST':
        if not user:
            return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required to create projects.'}), 401
        if not (scope.is_admin or scope.is_pm):
            return jsonify({'success': False, 'message': '403 Forbidden: Only Project Managers or Admins can create projects.'}), 403
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

            # Allocate Team Members to Project with Foreign Key Safety & User Resolution
            allocated_user_ids = set()
            if isinstance(member_ids, list) and len(member_ids) > 0:
                for m_item in member_ids:
                    m_val = m_item.get('id') if isinstance(m_item, dict) else m_item
                    m_uuid = _parse_uuid(m_val)
                    target_user = None
                    if m_uuid:
                        target_user = User.query.get(m_uuid)

                    if not target_user and isinstance(m_item, dict):
                        m_name = (m_item.get('name') or m_item.get('display_name') or m_item.get('username') or '').strip().lower()
                        m_email = (m_item.get('email') or '').strip().lower()
                        for u in User.query.all():
                            u_disp = (u.display_name or '').strip().lower()
                            u_mail = (u.email or '').strip().lower()
                            if (m_email and u_mail == m_email) or (m_name and (m_name == u_disp or m_name in u_disp or u_disp in m_name)):
                                target_user = u
                                break

                    if target_user and target_user.id not in allocated_user_ids:
                        pm_rec = ProjectMember(project_id=project.id, user_id=target_user.id)
                        db.session.add(pm_rec)
                        allocated_user_ids.add(target_user.id)

            # If no explicit members provided, auto-allocate the assigned Team Lead's squad developers
            if len(allocated_user_ids) == 0 and team_lead:
                target_team = Team.query.filter(
                    (Team.team_leader_id == team_lead.id) | 
                    (Team.lead_id == team_lead.id)
                ).first()
                
                if target_team:
                    for tm in TeamMember.query.filter_by(team_id=target_team.id).all():
                        if tm.user_id and tm.user_id not in allocated_user_ids:
                            u_rec = User.query.get(tm.user_id)
                            if u_rec:
                                pm_rec = ProjectMember(project_id=project.id, user_id=u_rec.id)
                                db.session.add(pm_rec)
                                allocated_user_ids.add(u_rec.id)
                
                # Fallback to developers in engineering pool if team query was empty
                if len(allocated_user_ids) == 0:
                    dev_users = User.query.filter(User.role_name.in_(['ROLE_DEV', 'ROLE_QA'])).limit(3).all()
                    for du in dev_users:
                        if du.id not in allocated_user_ids:
                            pm_rec = ProjectMember(project_id=project.id, user_id=du.id)
                            db.session.add(pm_rec)
                            allocated_user_ids.add(du.id)

            # Auto-connect GitHub repository if URL provided
            repo_url = data.get('github_repo_url') or data.get('repository_url')
            if repo_url:
                try:
                    from services.github_service import GitHubService
                    from models import GitHubRepository, Repository
                    owner, repo_name = GitHubService.parse_github_url(repo_url)
                    meta = GitHubService.get_repository(owner, repo_name)
                    gh_repo = GitHubRepository(
                        project_id=project.id,
                        github_repository_id=meta.get('github_repository_id'),
                        owner=owner,
                        repository_name=repo_name,
                        repository_url=meta.get('repository_url') or repo_url,
                        default_branch=meta.get('default_branch', 'main'),
                        description=meta.get('description', ''),
                        visibility=meta.get('visibility', 'public'),
                        language=meta.get('language', 'Other'),
                        is_active=True
                    )
                    db.session.add(gh_repo)
                    db.session.flush()
                    legacy_repo = Repository(
                        id=gh_repo.id,
                        project_id=project.id,
                        repository_name=repo_name,
                        name=repo_name,
                        repository_url=gh_repo.repository_url,
                        url=gh_repo.repository_url,
                        provider='GitHub',
                        default_branch=gh_repo.default_branch,
                        status='CONNECTED',
                        connection_status='CONNECTED',
                        last_synced=datetime.utcnow()
                    )
                    db.session.add(legacy_repo)
                except Exception as ex:
                    print(f"[AUTO ATTACH REPO ERROR] {ex}")

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
                    title='⚡ New Project Lead Assignment',
                    message=f"You have been assigned as Team Lead for project '{project_name}' by Project Manager.",
                    notification_type='ASSIGNMENT',
                    read=False
                )
                db.session.add(notif)

            # Create Notification for each allocated Team Member
            for uid in allocated_user_ids:
                if team_lead and uid == team_lead.id:
                    continue
                m_user = User.query.get(uid)
                if m_user:
                    role_label = 'Quality Assurance' if m_user.role_name == 'ROLE_QA' else 'Developer'
                    m_notif = Notification(
                        recipient_id=m_user.id,
                        title='⚡ New Project Team Allocation',
                        message=f"You have been assigned as a team member ({role_label}) to project '{project_name}' by Project Manager.",
                        notification_type='ASSIGNMENT',
                        read=False
                    )
                    db.session.add(m_notif)

            # Create Confirmation Notification for Project Manager
            if user:
                lead_disp = team_lead.display_name if team_lead else 'Unassigned'
                pm_notif = Notification(
                    recipient_id=user.id,
                    title='Project Created Successfully',
                    message=f"Project '{project_name}' created successfully with Team Lead '{lead_disp}' and {len(allocated_user_ids)} team members allocated.",
                    notification_type='SYSTEM'
                )
                db.session.add(pm_notif)

            db.session.commit()
            return jsonify({'success': True, 'message': 'Project created and team notified successfully.', 'project': project.to_dict()}), 201

        except Exception as err:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Failed to create project: {str(err)}'}), 500

@project_bp.route('/<string:project_id>', methods=['GET', 'PUT', 'DELETE'])
@project_bp.route('/<string:project_id>/', methods=['GET', 'PUT', 'DELETE'])
@jwt_required(optional=True)
def project_detail(project_id):
    user = _get_auth_user()
    scope = get_user_scope(user)
    p_uuid = _parse_uuid(project_id)
    project = Project.query.get(p_uuid or project_id)
    if not project:
        return jsonify({'success': False, 'message': 'Project not found.'}), 404

    if not scope.can_access_project(project):
        return jsonify({'success': False, 'message': '403 Forbidden: You do not have permission to access this project.'}), 403

    if request.method == 'GET':
        return jsonify({'success': True, 'project': project.to_dict()}), 200

    if request.method in ('PUT', 'DELETE') and (scope.is_dev or scope.is_lead):
        return jsonify({'success': False, 'message': '403 Forbidden: Only Admin or PM can modify or delete projects.'}), 403

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

        # Update or Attach GitHub Repository
        repo_url = data.get('github_repo_url') or data.get('repository_url')
        if repo_url:
            try:
                from services.github_service import GitHubService
                from models import GitHubRepository, Repository
                owner, repo_name = GitHubService.parse_github_url(repo_url)
                existing_gh = GitHubRepository.query.filter_by(project_id=project.id, is_active=True).first()
                if not existing_gh:
                    meta = GitHubService.get_repository(owner, repo_name)
                    gh_repo = GitHubRepository(
                        project_id=project.id,
                        github_repository_id=meta.get('github_repository_id'),
                        owner=owner,
                        repository_name=repo_name,
                        repository_url=meta.get('repository_url') or repo_url,
                        default_branch=meta.get('default_branch', 'main'),
                        description=meta.get('description', ''),
                        visibility=meta.get('visibility', 'public'),
                        language=meta.get('language', 'Other'),
                        is_active=True
                    )
                    db.session.add(gh_repo)
                    db.session.flush()
                    legacy_repo = Repository(
                        id=gh_repo.id,
                        project_id=project.id,
                        repository_name=repo_name,
                        name=repo_name,
                        repository_url=gh_repo.repository_url,
                        url=gh_repo.repository_url,
                        provider='GitHub',
                        default_branch=gh_repo.default_branch,
                        status='CONNECTED',
                        connection_status='CONNECTED',
                        last_synced=datetime.utcnow()
                    )
                    db.session.add(legacy_repo)
                else:
                    existing_gh.owner = owner
                    existing_gh.repository_name = repo_name
                    existing_gh.repository_url = repo_url
            except Exception as ex:
                print(f"[UPDATE ATTACH REPO ERROR] {ex}")

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
    scope = get_user_scope(user)
    if not user or not scope.can_access_project(project):
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
    scope = get_user_scope(user)
    if not user or not (scope.is_admin or scope.is_pm or scope.is_lead):
        return jsonify({'success': False, 'message': 'Forbidden'}), 403
    from services.project_health_service import HealthCalculator
    from models import Project
    project = Project.query.get_or_404(project_id)
    if not scope.can_access_project(project):
        return jsonify({'success': False, 'message': 'Forbidden'}), 403
    result = HealthCalculator.calculate_health_score(project_id, explicit_request=True)
    return jsonify(result)

@project_bp.route('/<uuid:project_id>/health/history', methods=['GET'])
@jwt_required(optional=True)
def get_health_history(project_id):
    from models import ProjectHealthHistory, Project
    user = _get_auth_user()
    scope = get_user_scope(user)
    project = Project.query.get_or_404(project_id)
    if not user or not scope.can_access_project(project):
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
    scope = get_user_scope(user)
    project = Project.query.get_or_404(project_id)
    if not user or not scope.can_access_project(project):
        return jsonify({'success': False, 'message': 'Forbidden'}), 403
    github = HealthCalculator._calculate_github_score(project_id)
    eng = HealthCalculator._calculate_engineering_risk_score(project_id)
    combined = github.get('risks', []) + eng.get('risks', [])
    return jsonify(combined)


@project_bp.route('/health-summary', methods=['GET'])
@project_bp.route('/health-summary/', methods=['GET'])
@jwt_required(optional=True)
def get_all_projects_health_summary():
    """
    Returns verified health scores, multi-pillar breakdown, risk diagnostics, and task progress
    across accessible active projects directly from PostgreSQL.
    """
    from services.project_health_service import HealthCalculator
    from models import Project, Task, Sprint, User
    user = _get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    scope = get_user_scope(user)
    if scope.is_admin:
        query = Project.query.filter_by(is_active=True, is_deleted=False)
    else:
        query = Project.query.filter_by(is_active=True, is_deleted=False).filter(Project.id.in_(scope.project_ids))

    projects = query.all()
    project_summaries = []
    total_risks_count = 0
    total_overdue_tasks = 0

    for p in projects:
        health_data = HealthCalculator.calculate_health_score(p.id, explicit_request=False)
        tasks = Task.query.filter_by(project_id=p.id).all()
        sprints = Sprint.query.filter_by(project_id=p.id).all()
        completed = [t for t in tasks if (t.status or '').upper() in ['DONE', 'COMPLETED', 'CLOSED']]
        in_prog = [t for t in tasks if (t.status or '').upper() in ['IN_PROGRESS', 'IN PROGRESS']]
        in_rev = [t for t in tasks if (t.status or '').upper() in ['IN_REVIEW', 'IN REVIEW', 'REVIEW']]
        overdue = [t for t in tasks if getattr(t, 'is_overdue', False)]
        total_overdue_tasks += len(overdue)

        score = health_data.get('overall_score')
        status = health_data.get('overall_status') or ('HEALTHY' if (score and score >= 80) else 'WARNING' if score else 'NO_DATA')
        risks = health_data.get('risks', [])
        total_risks_count += len(risks)

        clean_risks = []
        for r in risks:
            if isinstance(r, dict):
                clean_risks.append(r)
            else:
                clean_risks.append({'title': str(r), 'severity': 'MEDIUM'})

        mgr = User.query.get(p.manager_id) if p.manager_id else None
        lead = User.query.get(p.lead_id) if p.lead_id else None
        project_summaries.append({
            'id': str(p.id),
            'name': p.name,
            'description': p.description,
            'status': p.status or 'ACTIVE',
            'priority': p.priority or 'HIGH',
            'health_score': score,
            'health_status': status,
            'manager_name': mgr.display_name if mgr else 'Unassigned',
            'lead_name': lead.display_name if lead else 'Unassigned',
            'total_tasks': len(tasks),
            'completed_tasks': len(completed),
            'in_progress_tasks': len(in_prog),
            'in_review_tasks': len(in_rev),
            'overdue_tasks': len(overdue),
            'sprints_count': len(sprints),
            'components': health_data.get('components', {}),
            'risks': clean_risks
        })

    valid_scores = [p['health_score'] for p in project_summaries if p['health_score'] is not None]
    avg_score = round(sum(valid_scores) / len(valid_scores)) if valid_scores else None

    return jsonify({
        'success': True,
        'portfolio_avg_score': avg_score,
        'total_projects': len(project_summaries),
        'total_risks_count': total_risks_count,
        'total_overdue_tasks': total_overdue_tasks,
        'projects': project_summaries
    }), 200
