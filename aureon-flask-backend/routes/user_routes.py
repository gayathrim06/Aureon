import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from extensions import db
from models import User, AuditLog, Task, Commit, Role

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

@user_bp.route('/', methods=['GET'])
@user_bp.route('', methods=['GET'])
def list_users():
    users = User.query.all()
    return jsonify({'success': True, 'count': len(users), 'users': [u.to_dict() for u in users]}), 200

@user_bp.route('/me', methods=['GET', 'PUT', 'PATCH'])
@user_bp.route('/me/', methods=['GET', 'PUT', 'PATCH'])
@jwt_required(optional=True)
def user_me():
    data = request.get_json() or {} if request.method in ['PUT', 'PATCH'] else {}
    email_param = request.args.get('email') or data.get('email')

    user_id = get_jwt_identity()
    user = None
    if user_id:
        u_uuid = _parse_uuid(user_id)
        user = User.query.get(u_uuid or user_id)

    if not user and email_param:
        user = User.query.filter_by(email=email_param.strip().lower()).first()

    if not user:
        user = User.query.first()

    if not user:
        return jsonify({'success': False, 'message': 'User account not found.'}), 404

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
    user_id = get_jwt_identity()
    user = None
    if user_id:
        u_uuid = _parse_uuid(user_id)
        user = User.query.get(u_uuid or user_id)
    if not user:
        user = User.query.first()

    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

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
