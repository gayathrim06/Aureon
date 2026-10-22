from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Notification, User
from services.rbac_service import get_auth_user, get_user_scope

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/v1/notifications')

@notification_bp.route('/', methods=['GET'])
@notification_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def list_notifications():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    scope = get_user_scope(user)
    is_admin = scope.is_admin

    query = Notification.query
    if is_admin and request.args.get('scope') == 'all':
        # Admins see global broadcasts and system events when explicitly requesting all
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
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    notif = Notification.query.get(notif_id)
    if not notif:
        return jsonify({'success': False, 'message': 'Notification not found.'}), 404

    scope = get_user_scope(user)
    if not scope.is_admin and notif.recipient_id is not None and str(notif.recipient_id) != str(user.id):
        return jsonify({'success': False, 'message': '403 Forbidden: You cannot mark another user\'s notification.'}), 403

    notif.read = True
    db.session.commit()
    return jsonify({'success': True, 'message': 'Notification marked as read.', 'notification': notif.to_dict()}), 200

@notification_bp.route('/read-all', methods=['PATCH', 'PUT'])
@notification_bp.route('/read-all/', methods=['PATCH', 'PUT'])
@jwt_required(optional=True)
def mark_all_notifications_read():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    scope = get_user_scope(user)
    if scope.is_admin and request.args.get('scope') == 'all':
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
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    notif = Notification.query.get(notif_id)
    if not notif:
        return jsonify({'success': False, 'message': 'Notification not found.'}), 404

    scope = get_user_scope(user)
    if not scope.is_admin and notif.recipient_id is not None and str(notif.recipient_id) != str(user.id):
        return jsonify({'success': False, 'message': '403 Forbidden: You cannot delete another user\'s notification.'}), 403

    db.session.delete(notif)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Notification removed.'}), 200

@notification_bp.route('/clear-all', methods=['DELETE'])
@notification_bp.route('/clear-all/', methods=['DELETE'])
@jwt_required(optional=True)
def clear_all_notifications():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    scope = get_user_scope(user)
    if scope.is_admin and request.args.get('scope') == 'all':
        Notification.query.filter(Notification.read == True).delete(synchronize_session=False)
    else:
        Notification.query.filter(
            (Notification.recipient_id == user.id) | (Notification.recipient_id.is_(None)),
            Notification.read == True
        ).delete(synchronize_session=False)

    db.session.commit()
    return jsonify({'success': True, 'message': 'Read notifications cleared.'}), 200
