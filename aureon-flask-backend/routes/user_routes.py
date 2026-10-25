import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from extensions import db
from models import User, AuditLog, Task, Commit, Role
from services.rbac_service import get_auth_user, get_user_scope

user_bp = Blueprint('users', __name__, url_prefix='/api/v1/users')

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

def _heal_null_roles():
    """Backfills role_id for any user in tbl_user where role_id is None based on designation or email."""
    try:
        null_users = User.query.filter(User.role_id.is_(None)).all()
        if not null_users:
            return
        roles = {r.code: r for r in Role.query.all()}
        changed = False
        for u in null_users:
            d = (u.designation or '').upper()
            em = (u.email or '').lower()
            r_code = 'ROLE_DEV'
            if em in ('admin@aureon.com', 'gayathri@aureon.com') or u.is_superuser:
                r_code = 'ROLE_ADMIN'
            elif 'LEAD' in d or 'ARCHITECT' in d:
                r_code = 'ROLE_LEAD'
            elif 'PM' in d or 'PROJECT MANAGER' in d or 'MANAGER' in d or 'SCRUM' in d or em in ('feba@aureon.com', 'deepak.n@aureon.com', 'gopika@aureon.com', 'sarah.j@aureon.com', 'eli@aureon.com'):
                r_code = 'ROLE_PM'
            elif 'QA' in d or 'TEST' in d or 'QUALITY' in d or em in ('ann@aureon.com', 'riya@gmail.com', 'jiya@aureon.com', 'venu.qa@aureon.com', 'ananya.v@aureon.com'):
                r_code = 'ROLE_QA'

            if r_code in roles:
                u.role_id = roles[r_code].id
                changed = True
        if changed:
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[HEAL_NULL_ROLES ERROR] {e}")

@user_bp.route('/', methods=['GET'])
@user_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def list_users():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401
    
    _heal_null_roles()
    scope = get_user_scope(user)
    role_param = request.args.get('role')

    if scope.is_admin:
        query = User.query.outerjoin(Role)
        if role_param:
            clean_role = role_param.upper().replace('ROLE_', '')
            query = query.filter(
                (Role.code.ilike(f"%{role_param}%")) |
                (User.designation.ilike(f"%{clean_role}%"))
            )
        users = query.all()
    elif scope.is_pm:
        # PM sees all candidate Team Leads, Developers, and QA engineers (and peer PMs) for staffing, project creation, and team allocation
        query = User.query.outerjoin(Role).filter(
            (Role.code.in_(['ROLE_LEAD', 'ROLE_DEV', 'ROLE_QA', 'ROLE_PM'])) |
            (User.role_id.is_(None))
        )
        if role_param:
            clean_role = role_param.upper().replace('ROLE_', '')
            query = query.filter(
                (Role.code.ilike(f"%{role_param}%")) |
                (User.designation.ilike(f"%{clean_role}%"))
            )
        # Exclude System Administrator from PM staffing pools
        users = [u for u in query.all() if u.role_name != 'ROLE_ADMIN']
    elif scope.is_lead:
        # TL sees all candidate developers and QA engineers for task delegation and sprint allocation
        query = User.query.outerjoin(Role).filter(
            (Role.code.in_(['ROLE_DEV', 'ROLE_QA', 'ROLE_LEAD'])) |
            (User.role_id.is_(None))
        )
        if role_param:
            clean_role = role_param.upper().replace('ROLE_', '')
            query = query.filter(
                (Role.code.ilike(f"%{role_param}%")) |
                (User.designation.ilike(f"%{clean_role}%"))
            )
        users = [u for u in query.all() if u.role_name not in ('ROLE_ADMIN', 'ROLE_PM')]
    else:
        # Developer user scoping: strictly restricted to own profile (/users/me or User.id == user.id)
        users = [user] if user else []

    return jsonify({'success': True, 'count': len(users), 'users': [u.to_dict() for u in users]}), 200

@user_bp.route('/roles', methods=['GET'])
@user_bp.route('/roles/', methods=['GET'])
def list_system_roles():
    roles = Role.query.all()
    res = []
    perm_map = {
        'ROLE_ADMIN': ['admin:all', 'users:manage', 'rbac:manage', 'audit:view', 'projects:create', 'teams:assign', 'system:manage'],
        'ROLE_PM': ['projects:create', 'projects:manage', 'sprints:plan', 'tasks:assign', 'milestones:track', 'reports:generate', 'team:view'],
        'ROLE_LEAD': ['sprint:manage', 'tasks:allocate', 'tasks:approve', 'developers:monitor', 'codequality:view', 'repository:view'],
        'ROLE_DEV': ['tasks:view', 'tasks:update', 'code:commit', 'pullrequest:create', 'review:submit', 'profile:manage'],
        'ROLE_QA': ['bugs:report', 'bugs:verify', 'testcases:execute', 'quality:audit', 'reports:export']
    }
    level_map = {
        'ROLE_ADMIN': 5,
        'ROLE_PM': 4,
        'ROLE_LEAD': 3,
        'ROLE_QA': 2,
        'ROLE_DEV': 1
    }
    for r in roles:
        u_count = User.query.filter_by(role_id=r.id, is_active=True).count()
        res.append({
            'id': r.code,
            'name': r.name,
            'description': r.description or f"Role: {r.name}",
            'level': level_map.get(r.code, 1),
            'user_count': u_count,
            'permissions': perm_map.get(r.code, ['access:basic'])
        })
    return jsonify({'success': True, 'count': len(res), 'roles': res}), 200

@user_bp.route('/me', methods=['GET', 'PUT', 'PATCH'])
@user_bp.route('/me/', methods=['GET', 'PUT', 'PATCH'])
@jwt_required(optional=True)
def user_me():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    data = request.get_json() or {} if request.method in ['PUT', 'PATCH'] else {}

    if request.method in ['PUT', 'PATCH']:
        if 'name' in data or 'full_name' in data:
            user.full_name = data.get('name') or data.get('full_name')
        if 'username' in data:
            user.username = data.get('username')
        if 'phone' in data:
            user.phone = data.get('phone')
        if 'employee_id' in data or 'employeeId' in data:
            user.employee_id = data.get('employee_id') or data.get('employeeId')
        
        if 'title' in data or 'designation' in data or 'role' in data or 'role_name' in data:
            new_title = data.get('title') or data.get('designation') or ''
            new_role_code = data.get('role') or data.get('role_name') or data.get('role_code') or ''
            if new_title:
                user.designation = new_title

            target_str = (new_role_code + ' ' + new_title).upper()
            if 'PM' in target_str or 'MANAGER' in target_str:
                target_code = 'ROLE_PM'
            elif 'LEAD' in target_str:
                target_code = 'ROLE_LEAD'
            elif 'QA' in target_str:
                target_code = 'ROLE_QA'
            elif 'ADMIN' in target_str:
                target_code = 'ROLE_ADMIN'
            else:
                target_code = 'ROLE_DEV'

            role_obj = Role.query.filter_by(code=target_code).first()
            if not role_obj:
                role_obj = Role(code=target_code, name=target_code.replace('ROLE_', '').replace('_', ' ').title())
                db.session.add(role_obj)
                db.session.flush()
            user.role_id = role_obj.id

        if 'department' in data:
            user.department = data.get('department')
        if 'gender' in data:
            user.gender = data.get('gender')
        if 'date_of_birth' in data or 'dob' in data:
            dob_str = data.get('date_of_birth') or data.get('dob')
            if isinstance(dob_str, str) and dob_str:
                try:
                    user.date_of_birth = datetime.strptime(dob_str, '%Y-%m-%d').date()
                except Exception:
                    pass
        if 'pet_name' in data or 'petName' in data:
            user.pet_name = data.get('pet_name') or data.get('petName')
        if 'school_friend_name' in data or 'best_friend_name' in data or 'bestFriendName' in data:
            user.school_friend_name = data.get('school_friend_name') or data.get('best_friend_name') or data.get('bestFriendName')
        
        db.session.commit()

    return jsonify({'success': True, 'user': user.to_dict()}), 200

@user_bp.route('/me/stats', methods=['GET'])
@user_bp.route('/me/stats/', methods=['GET'])
@jwt_required(optional=True)
def user_me_stats():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    commits_count = Commit.query.filter(
        (Commit.author_email == user.email) | (Commit.author_name == user.full_name)
    ).count()

    completed_tasks = Task.query.filter_by(assigned_to_id=user.id, status='COMPLETED').count()
    total_tasks = Task.query.filter_by(assigned_to_id=user.id).count()
    audit_logs_count = AuditLog.query.filter_by(user_id=user.id).count()

    return jsonify({
        'success': True,
        'stats': {
          'commits': commits_count,
          'tasks_done': completed_tasks,
          'pull_requests': 0,
          'code_reviews': 0,
          'audit_logs': audit_logs_count
        }
    }), 200

# ─── AUTHORIZED DEVELOPER SKILLS & CAPACITY MANAGEMENT ────────────────────────

@user_bp.route('/<string:user_id>', methods=['GET'])
@user_bp.route('/<string:user_id>/', methods=['GET'])
@jwt_required(optional=True)
def get_user_profile(user_id):
    """Retrieves user details including qualifications, skills, and current capacity."""
    caller = get_auth_user()
    if not caller:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401
    scope = get_user_scope(caller)
    u_uuid = _parse_uuid(user_id)
    target_user = User.query.get(u_uuid or user_id)
    if not target_user:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    # Scoping check
    if not scope.is_admin and not scope.can_access_user(target_user) and str(target_user.id) != str(caller.id if caller else ''):
        return jsonify({'success': False, 'message': '403 Forbidden: Access denied.'}), 403

    return jsonify({'success': True, 'user': target_user.to_dict()}), 200

@user_bp.route('/<string:user_id>/skills', methods=['GET', 'PUT', 'PATCH'])
@user_bp.route('/<string:user_id>/skills/', methods=['GET', 'PUT', 'PATCH'])
@jwt_required(optional=True)
def manage_user_skills(user_id):
    """
    Authorized endpoint to view and update developer skills and task capacity limits.
    Permitted: Admin, PM or Lead managing the user's project/team, or the user themselves.
    """
    caller = get_auth_user()
    if not caller:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401
    scope = get_user_scope(caller)
    u_uuid = _parse_uuid(user_id)
    target_user = User.query.get(u_uuid or user_id)
    if not target_user:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    # Permission check for viewing
    is_self = caller and (str(caller.id) == str(target_user.id))
    if not (scope.is_admin or is_self or scope.can_access_user(target_user)):
        return jsonify({'success': False, 'message': '403 Forbidden: Access denied to this user profile.'}), 403

    if request.method == 'GET':
        return jsonify({
            'success': True,
            'user_id': str(target_user.id),
            'name': target_user.display_name,
            'skills': target_user.skills or '',
            'skills_list': target_user.skills_list,
            'max_concurrent_tasks': target_user.max_concurrent_tasks or 3,
            'capacity_hours': target_user.capacity_hours or 40.0
        }), 200

    # Permission check for updating skills:
    # Only Admin, Team Lead, PM, or the user themselves can update skills.
    # Other developers cannot update another developer’s skills.
    if scope.is_dev and not is_self:
        return jsonify({'success': False, 'message': '403 Forbidden: Developers cannot update another developer’s skills.'}), 403

    data = request.get_json() or {}
    new_skills = data.get('skills')
    if new_skills is not None:
        if isinstance(new_skills, list):
            target_user.skills = ', '.join([str(s).strip() for s in new_skills if str(s).strip()])
        else:
            target_user.skills = str(new_skills).strip()

    if 'max_concurrent_tasks' in data and (scope.is_admin or scope.is_lead or scope.is_pm):
        try:
            target_user.max_concurrent_tasks = max(1, int(data['max_concurrent_tasks']))
        except (ValueError, TypeError):
            pass

    if 'capacity_hours' in data and (scope.is_admin or scope.is_lead or scope.is_pm):
        try:
            target_user.capacity_hours = max(5.0, float(data['capacity_hours']))
        except (ValueError, TypeError):
            pass

    target_user.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Qualifications and skills updated for {target_user.display_name}.",
        'user': target_user.to_dict()
    }), 200

@user_bp.route('/<string:user_id>', methods=['PATCH', 'PUT'])
@user_bp.route('/<string:user_id>/', methods=['PATCH', 'PUT'])
@jwt_required(optional=True)
def update_user_profile(user_id):
    """Updates user information including skills, designation, and status."""
    caller = get_auth_user()
    if not caller:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401
    scope = get_user_scope(caller)
    u_uuid = _parse_uuid(user_id)
    target_user = User.query.get(u_uuid or user_id)
    if not target_user:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    is_self = caller and (str(caller.id) == str(target_user.id))
    if not (scope.is_admin or is_self or scope.can_access_user(target_user)):
        return jsonify({'success': False, 'message': '403 Forbidden: Access denied.'}), 403

    data = request.get_json() or {}
    if 'skills' in data:
        new_skills = data['skills']
        if isinstance(new_skills, list):
            target_user.skills = ', '.join([str(s).strip() for s in new_skills if str(s).strip()])
        else:
            target_user.skills = str(new_skills).strip()

    if 'max_concurrent_tasks' in data and (scope.is_admin or scope.is_lead or scope.is_pm):
        try:
            target_user.max_concurrent_tasks = max(1, int(data['max_concurrent_tasks']))
        except (ValueError, TypeError):
            pass

    if 'capacity_hours' in data and (scope.is_admin or scope.is_lead or scope.is_pm):
        try:
            target_user.capacity_hours = max(5.0, float(data['capacity_hours']))
        except (ValueError, TypeError):
            pass

    if 'department' in data and (scope.is_admin or scope.is_pm):
        target_user.department = data['department']

    if 'designation' in data and (scope.is_admin or scope.is_pm):
        target_user.designation = data['designation']

    target_user.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'success': True, 'message': 'User profile updated.', 'user': target_user.to_dict()}), 200
