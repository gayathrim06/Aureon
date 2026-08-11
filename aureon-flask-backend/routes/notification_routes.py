from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Notification, User, Role

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/v1/notifications')

def _get_auth_user():
    user_id = get_jwt_identity()
    user = None
    if user_id:
        user = User.query.get(user_id)
    if not user:
        user = User.query.first()
    return user

@notification_bp.route('/', methods=['GET'])
@notification_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def list_notifications():
    user = _get_auth_user()
    if not user:
        return jsonify({'success': True, 'count': 0, 'notifications': []}), 200

    notifs = Notification.query.filter(
        (Notification.recipient_id == user.id) | (Notification.recipient_id.is_(None))
    ).order_by(Notification.created_at.desc()).all()

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

    notifs = Notification.query.filter(
        (Notification.recipient_id == user.id) | (Notification.recipient_id.is_(None))
    ).all()
    for n in notifs:
        n.read = True
    db.session.commit()

    return jsonify({'success': True, 'message': 'All notifications marked as read.'}), 200
