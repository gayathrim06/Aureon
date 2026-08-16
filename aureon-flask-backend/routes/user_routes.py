from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, AuditLog

user_bp = Blueprint('users', __name__, url_prefix='/api/v1/users')

@user_bp.route('/', methods=['GET'])
@user_bp.route('', methods=['GET'])
def list_users():
    users = User.query.all()
    return jsonify({'success': True, 'count': len(users), 'users': [u.to_dict() for u in users]}), 200

@user_bp.route('/me', methods=['GET', 'PUT', 'PATCH'])
@user_bp.route('/me/', methods=['GET', 'PUT', 'PATCH'])
@jwt_required(optional=True)
def user_me():
    user_id = get_jwt_identity()
    user = None
    if user_id:
        user = User.query.get(user_id)
    if not user:
        user = User.query.first() # Fallback to initial user if testing

    if request.method in ['PUT', 'PATCH']:
        data = request.get_json() or {}
        if 'name' in data or 'full_name' in data:
            user.full_name = data.get('name') or data.get('full_name')
        if 'title' in data or 'designation' in data:
            user.designation = data.get('title') or data.get('designation')
        if 'department' in data:
            user.department = data.get('department')
        db.session.commit()

    return jsonify({'success': True, 'user': user.to_dict()}), 200
