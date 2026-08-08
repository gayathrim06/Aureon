from flask import Blueprint, request, jsonify
from extensions import db
from models import CodeAnalysis, CodeAnalysisIssue, CodeMetrics, AuditLog
from services.static_analysis_service import StaticAnalysisService
from services.risk_engine_service import RuleEngine

code_analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/v1/analysis')

@code_analysis_bp.route('/run', methods=['POST'])
@code_analysis_bp.route('/run/', methods=['POST'])
def run_analysis():
    data = request.get_json() or {}
    repository_id = data.get('repository_id', 1)
    file_content = data.get('code', 'def calculate_metrics(data):\n    return len(data)\n')
    file_name = data.get('file_name', 'main.py')

    result = StaticAnalysisService.analyze_source_code(repository_id, file_content, file_name)

    log = AuditLog(
        action='CODE_ANALYSIS_EXECUTED',
        entity='CodeAnalysis',
        entity_id=str(result['analysis_id']),
        details=f"Ran Pylint & Radon analysis on {file_name}. Score: {result['score']}"
    )
    db.session.add(log)
    db.session.commit()

    # Re-evaluate risk engine after static code scan
    RuleEngine.evaluate_project_risks(1)

    return jsonify({'success': True, 'result': result}), 200

@code_analysis_bp.route('/results', methods=['GET'])
@code_analysis_bp.route('/results/', methods=['GET'])
def get_analysis_results():
    analyses = CodeAnalysis.query.order_by(CodeAnalysis.executed_at.desc()).all()
    metrics = CodeMetrics.query.all()
    issues = CodeAnalysisIssue.query.all()

    return jsonify({
        'success': True,
        'analyses': [a.to_dict() for a in analyses],
        'total_metrics': len(metrics),
        'total_issues': len(issues),
        'issues': [{
            'id': i.id,
            'file': i.file_path,
            'line': i.line_number,
            'type': i.issue_type,
            'message': i.description,
            'severity': i.severity
        } for i in issues[:20]]
    }), 200
