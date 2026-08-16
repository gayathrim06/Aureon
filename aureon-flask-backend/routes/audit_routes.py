from flask import Blueprint, jsonify
from extensions import db
from models import AuditLog

audit_bp = Blueprint('audit', __name__, url_prefix='/api/v1/audit-logs')

@audit_bp.route('/', methods=['GET'])
@audit_bp.route('', methods=['GET'])
def list_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).all()
    return jsonify({'success': True, 'count': len(logs), 'logs': [l.to_dict() for l in logs]}), 200
