from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
from extensions import db
from models import User, Role, AuditLog

auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

@auth_bp.route('/login', methods=['POST'])
@auth_bp.route('/login/', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = (data.get('email') or data.get('username') or '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter((User.email == identifier) | (User.username == identifier)).first()
    if not user or not user.check_password(password):
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= 5:
                user.account_status = 'LOCKED'
            db.session.commit()

        # Audit Log Failure
        try:
            log = AuditLog(
                user_email=identifier,
                role_name='UNAUTHENTICATED',
                action='USER_LOGIN_FAILED',
                details='Invalid email or password'
            )
            db.session.add(log)
            db.session.commit()
        except Exception:
            db.session.rollback()

        return jsonify({'success': False, 'message': 'Invalid corporate email or password.'}), 401

    if user.account_status and user.account_status != 'ACTIVE':
        return jsonify({'success': False, 'message': 'Account is inactive or locked.'}), 403

    # Reset failed logins
    user.failed_login_attempts = 0
    
    # Generate JWT access token
    access_token = create_access_token(identity=str(user.id))

    # Audit Log Success
    try:
        log = AuditLog(
            user_email=user.email,
            role_name=user.role_name,
            action='USER_LOGIN_SUCCESS',
            details='Authenticated via REST API'
        )
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.rollback()

    return jsonify({
        'success': True,
        'access': access_token,
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/register', methods=['POST'])
@auth_bp.route('/register/', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    full_name = data.get('full_name', data.get('fullName', ''))
    role_name = data.get('role_code') or data.get('role') or 'ROLE_DEV'
    department = data.get('department', 'Engineering')
    designation = data.get('designation') or 'Team Member'
    
    dob_str = data.get('date_of_birth') or data.get('dateOfBirth')
    dob = None
    if dob_str:
        try:
            dob = datetime.strptime(dob_str.split('T')[0], '%Y-%m-%d').date()
        except Exception:
            pass
            
    pet_name = data.get('pet_name') or data.get('petName', '')
    best_friend_name = data.get('best_friend_name') or data.get('bestFriendName') or data.get('schoolFriendName', '')

    if not email or not password or not full_name:
        return jsonify({'success': False, 'message': 'Full name, email, and password are required.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'User with this email already exists.'}), 400

    # Look up Role ID in tbl_role (e.g. ROLE_PM, ROLE_LEAD, ROLE_DEV, ROLE_QA)
    role_obj = Role.query.filter(
        db.or_(
            Role.code == role_name,
            Role.code == role_name.upper()
        )
    ).first()

    if not role_obj:
        role_obj = Role(code=role_name, name=role_name.replace('ROLE_', '').replace('_', ' ').title())
        db.session.add(role_obj)
        db.session.flush()

    role_id = role_obj.id if role_obj else None

    user = User(
        email=email,
        username=email.split('@')[0] if email else '',
        full_name=full_name,
        role_id=role_id,
        department=department,
        designation=designation,
        date_of_birth=dob,
        pet_name=pet_name,
        school_friend_name=best_friend_name,
        account_status='ACTIVE',
        is_active=True
    )
    user.set_password(password)

    db.session.add(user)
    db.session.flush()

    access_token = create_access_token(identity=str(user.id))

    try:
        log = AuditLog(
            user_email=user.email,
            role_name=user.role_name,
            action='USER_REGISTERED',
            details=f"Created account for {full_name}"
        )
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Account registered successfully.',
        'access': access_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/forgot-password', methods=['POST'])
@auth_bp.route('/forgot-password/', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    dob_str = data.get('date_of_birth') or data.get('dateOfBirth')
    best_friend = data.get('best_friend_name') or data.get('bestFriendName') or data.get('schoolFriendName', '')
    new_password = data.get('new_password') or data.get('newPassword')

    if not email or not dob_str or not best_friend or not new_password:
        return jsonify({'success': False, 'message': 'Email, date of birth, best friend name, and new password are required.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found or incorrect verification details.'}), 404

    # Verify dob and best friend name
    db_dob_str = user.date_of_birth.strftime('%Y-%m-%d') if user.date_of_birth else None
    input_dob_str = dob_str.split('T')[0] if dob_str else None

    stored_friend = (user.school_friend_name or '').strip().lower()
    input_friend = best_friend.strip().lower()

    if not db_dob_str or db_dob_str != input_dob_str or (stored_friend and stored_friend != input_friend):
        return jsonify({'success': False, 'message': 'Security answers do not match our records.'}), 400

    user.set_password(new_password)
    try:
        log = AuditLog(
            user_email=user.email,
            role_name=user.role_name,
            action='PASSWORD_RESET',
            details="User successfully reset password using security questions"
        )
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.commit()

    return jsonify({'success': True, 'message': 'Password reset successfully.'}), 200

@auth_bp.route('/logout', methods=['POST'])
@auth_bp.route('/logout/', methods=['POST'])
def logout():
    return jsonify({'success': True, 'message': 'Logged out successfully.'}), 200
