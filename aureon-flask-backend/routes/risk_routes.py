from flask import Blueprint, request, jsonify
from extensions import db
from models import Risk, AuditLog
from services.risk_engine_service import RuleEngine

risk_bp = Blueprint('risks', __name__, url_prefix='/api/v1/risks')

@risk_bp.route('/', methods=['GET'])
@risk_bp.route('', methods=['GET'])
def get_risks():
    # Evaluate project risks before returning
    RuleEngine.evaluate_project_risks(1)
    risks = Risk.query.order_by(Risk.detected_at.desc()).all()
    return jsonify({'success': True, 'count': len(risks), 'risks': [r.to_dict() for r in risks]}), 200

@risk_bp.route('/evaluate', methods=['POST'])
@risk_bp.route('/evaluate/', methods=['POST'])
def trigger_evaluation():
    data = request.get_json() or {}
    project_id = data.get('project_id', 1)
    new_risks = RuleEngine.evaluate_project_risks(project_id)
    return jsonify({'success': True, 'new_risks_detected': len(new_risks), 'risks': [r.to_dict() for r in new_risks]}), 200

@risk_bp.route('/<int:risk_id>/status', methods=['PUT', 'PATCH'])
def update_risk_status(risk_id):
    data = request.get_json() or {}
    new_status = data.get('status', 'RESOLVED')
    
    risk = Risk.query.get(risk_id)
    if not risk:
        return jsonify({'success': False, 'message': 'Risk not found.'}), 404

    risk.status = new_status
    log = AuditLog(
        action='RISK_STATUS_UPDATED',
        entity='Risk',
        entity_id=str(risk.id),
        details=f"Risk '{risk.title}' status updated to {new_status}"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'success': True, 'message': f'Risk updated to {new_status}.', 'risk': risk.to_dict()}), 200
