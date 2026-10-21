from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Notification, User, Role

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/v1/notifications')

def _get_auth_user():
    user = None
    try:
        user_id = get_jwt_identity()
        if user_id:
            user = User.query.get(user_id)
    except Exception:
        pass

    if not user:
        x_uid = request.headers.get('X-User-Id')
        x_email = request.headers.get('X-User-Email')
        if x_uid:
            try:
                user = User.query.get(x_uid)
            except Exception:
                pass
        if not user and x_email:
            user = User.query.filter_by(email=x_email.strip().lower()).first()

    if not user:
        q_email = request.args.get('email')
        if q_email:
            user = User.query.filter_by(email=q_email.strip().lower()).first()

    if not user:
        # Default to admin account for system overview
        user = User.query.filter_by(email='admin@aureon.com').first() or User.query.first()
    return user

@notification_bp.route('/', methods=['GET'])
@notification_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def list_notifications():
    user = _get_auth_user()
    if not user:
        return jsonify({'success': True, 'count': 0, 'notifications': []}), 200

    x_role = request.headers.get('X-User-Role', '')
    user_role = (user.role.code if user.role else '') if hasattr(user, 'role') else ''
    is_admin = (
        'ADMIN' in x_role.upper() or 
        'ADMIN' in user_role.upper() or 
        user.email == 'admin@aureon.com' or 
        request.args.get('scope') == 'all'
    )

    query = Notification.query
    if is_admin:
        # Admins see global broadcasts, direct admin alerts, and security/system events
        notifs = query.order_by(Notification.created_at.desc()).limit(100).all()
    else:
        notifs = query.filter(
            (Notification.recipient_id == user.id) | (Notification.recipient_id.is_(None))
        ).order_by(Notification.created_at.desc()).limit(100).all()

    return jsonify({
        'success': True,
        'count': len(notifs),
        'notifications': [n.to_dict() for n in notifs]
    }), 200

@notification_bp.route('/<string:notif_id>/read', methods=['PATCH', 'PUT'])
@notification_bp.route('/<string:notif_id>/read/', methods=['PATCH', 'PUT'])
@jwt_required(optional=True)
def mark_notification_read(notif_id):
    notif = Notification.query.get(notif_id)
    if not notif:
        return jsonify({'success': False, 'message': 'Notification not found.'}), 404

    notif.read = True
    db.session.commit()
    return jsonify({'success': True, 'message': 'Notification marked as read.', 'notification': notif.to_dict()}), 200

@notification_bp.route('/read-all', methods=['PATCH', 'PUT'])
@notification_bp.route('/read-all/', methods=['PATCH', 'PUT'])
@jwt_required(optional=True)
def mark_all_notifications_read():
    user = _get_auth_user()
    if not user:
        return jsonify({'success': True, 'message': 'No notifications to update.'}), 200

    x_role = request.headers.get('X-User-Role', '')
    if 'ADMIN' in x_role.upper() or user.email == 'admin@aureon.com':
        notifs = Notification.query.filter(Notification.read == False).all()
    else:
        notifs = Notification.query.filter(
            (Notification.recipient_id == user.id) | (Notification.recipient_id.is_(None)),
            Notification.read == False
        ).all()

    for n in notifs:
        n.read = True
    db.session.commit()

    return jsonify({'success': True, 'message': 'All notifications marked as read.'}), 200

@notification_bp.route('/<string:notif_id>', methods=['DELETE'])
@notification_bp.route('/<string:notif_id>/', methods=['DELETE'])
@jwt_required(optional=True)
def delete_notification(notif_id):
    notif = Notification.query.get(notif_id)
    if not notif:
        return jsonify({'success': False, 'message': 'Notification not found.'}), 404

    db.session.delete(notif)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Notification removed.'}), 200

@notification_bp.route('/clear-all', methods=['DELETE'])
@notification_bp.route('/clear-all/', methods=['DELETE'])
@jwt_required(optional=True)
def clear_all_notifications():
    user = _get_auth_user()
    if not user:
        return jsonify({'success': True, 'message': 'No notifications to clear.'}), 200

    x_role = request.headers.get('X-User-Role', '')
    if 'ADMIN' in x_role.upper() or user.email == 'admin@aureon.com':
        # Mark all read or clear read notifications
        Notification.query.filter(Notification.read == True).delete(synchronize_session=False)
    else:
        Notification.query.filter(
            (Notification.recipient_id == user.id) | (Notification.recipient_id.is_(None)),
            Notification.read == True
        ).delete(synchronize_session=False)

    db.session.commit()
    return jsonify({'success': True, 'message': 'Read notifications cleared.'}), 200

