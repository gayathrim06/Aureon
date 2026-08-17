from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from extensions import db
from models import AuditLog, User, Role

audit_bp = Blueprint('audit', __name__, url_prefix='/api/v1/audit-logs')

@audit_bp.route('/', methods=['GET'])
@audit_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def list_audit_logs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    action = request.args.get('action')
    user_email = request.args.get('user_email')
    entity = request.args.get('entity')
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    query = AuditLog.query

    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if user_email:
        query = query.filter(AuditLog.user_email.ilike(f"%{user_email}%"))
    if entity:
        query = query.filter(AuditLog.details.ilike(f"%{entity}%"))
    if start_date_str:
        try:
            s_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d')
            query = query.filter(AuditLog.timestamp >= s_date)
        except Exception:
            pass
    if end_date_str:
        try:
            e_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d')
            query = query.filter(AuditLog.timestamp <= e_date)
        except Exception:
            pass

    query = query.order_by(AuditLog.timestamp.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    sanitized_logs = []
    for log in pagination.items:
        l_dict = log.to_dict()
        # Ensure passwords or tokens are never leaked in details string
        if 'password' in l_dict['details'].lower():
            l_dict['details'] = 'Authentication detail [redacted]'
        sanitized_logs.append(l_dict)

    return jsonify({
        'success': True,
        'count': pagination.total,
        'page': page,
        'per_page': per_page,
        'total_pages': pagination.pages,
        'logs': sanitized_logs
    }), 200
