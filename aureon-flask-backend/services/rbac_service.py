from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import User

def require_role(allowed_roles):
    """
    RBAC Middleware decorator enforcing server-side authorization.
    Verifies JWT token validity and user role permissions.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user_id = get_jwt_identity()
                user = User.query.get(user_id)

                if not user or user.status != 'ACTIVE':
                    return jsonify({'success': False, 'message': 'User account inactive or unauthenticated.'}), 401

                if user.role_name not in allowed_roles and 'ROLE_ADMIN' not in [user.role_name]:
                    return jsonify({'success': False, 'message': f"Access denied. Required role: {', '.join(allowed_roles)}"}), 403

                # Attach user object to request context
                request.current_user = user
                return fn(*args, **kwargs)
            except Exception as e:
                return jsonify({'success': False, 'message': f"Authentication failed: {str(e)}"}), 401
        return wrapper
    return decorator
