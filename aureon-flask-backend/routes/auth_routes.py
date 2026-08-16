from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
from extensions import db
from models import User, AuditLog

auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

@auth_bp.route('/login', methods=['POST'])
@auth_bp.route('/login/', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        if user:
            user.failed_logins += 1
            if user.failed_logins >= 5:
                user.status = 'LOCKED'
            db.session.commit()

        # Audit Log Failure
        log = AuditLog(
            user_email=email,
            action='USER_LOGIN_FAILED',
            details='Invalid email or password'
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({'success': False, 'message': 'Invalid corporate email or password.'}), 401

    if user.status != 'ACTIVE':
        return jsonify({'success': False, 'message': 'Account is inactive or locked.'}), 403

    # Reset failed logins & update last active
    user.failed_logins = 0
    user.last_login = datetime.now()
    
    # Generate JWT access token
    access_token = create_access_token(identity=str(user.id))

    # Audit Log Success
    log = AuditLog(
        user_id=user.id,
        user_email=user.email,
        role_name=user.role_name,
        action='USER_LOGIN_SUCCESS',
        details='Authenticated via REST API'
    )
    db.session.add(log)
    db.session.commit()

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
    role_name = data.get('role', 'ROLE_DEV')
    department = data.get('department', 'Engineering')

    if not email or not password or not full_name:
        return jsonify({'success': False, 'message': 'Full name, email, and password are required.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'User with this email already exists.'}), 400

    user = User(
        email=email,
        full_name=full_name,
        role_name=role_name,
        department=department,
        status='ACTIVE'
    )
    user.set_password(password)

    db.session.add(user)
    db.session.flush()

    log = AuditLog(
        user_id=user.id,
        user_email=user.email,
        role_name=user.role_name,
        action='USER_REGISTERED',
        details=f"Created account for {full_name}"
    )
    db.session.add(log)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'success': True,
        'message': 'Account registered successfully.',
        'access': access_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/logout', methods=['POST'])
@auth_bp.route('/logout/', methods=['POST'])
def logout():
    return jsonify({'success': True, 'message': 'Logged out successfully.'}), 200
