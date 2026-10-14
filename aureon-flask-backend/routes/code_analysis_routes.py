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
            'id': str(i.id),
            'file': i.file_path,
            'line': i.line_number,
            'type': i.issue_type,
            'message': i.description,
            'severity': i.severity
        } for i in issues[:50]]
    }), 200

@code_analysis_bp.route('/quality-summary', methods=['GET'])
@code_analysis_bp.route('/quality-summary/', methods=['GET'])
def get_quality_summary():
    from models import Project, CodeQualityReport, CodeAnalysis, CodeAnalysisIssue
    projects = Project.query.filter_by(is_active=True, is_deleted=False).all()
    project_items = []
    total_bugs = 0
    total_smells = 0
    passed_count = 0

    for p in projects:
        report = CodeQualityReport.query.filter_by(project_id=p.id).order_by(CodeQualityReport.analysis_date.desc()).first()
        if report:
            q_score = report.quality_score or 0
            gate = 'PASSED' if q_score >= 80 else 'WARNING'
            if gate == 'PASSED':
                passed_count += 1
            bugs_count = report.pylint_errors or 0
            smells_count = report.pylint_warnings or 0
            total_bugs += bugs_count
            total_smells += smells_count
            cov_val = f"{round(max(0.0, min(100.0, q_score)), 1)}%"
            tech_debt = f"{max(1, 10 - int(q_score / 10))}d"
            rating = 'A' if q_score >= 85 else 'B'
            last_scan = report.analysis_date.strftime('%Y-%m-%d') if report.analysis_date else 'Recent'
        else:
            gate = 'NOT_CONNECTED'
            bugs_count = 0
            smells_count = 0
            cov_val = 'N/A'
            tech_debt = 'NO DATA'
            rating = 'N/A'
            last_scan = 'No CI Data'

        project_items.append({
            'id': str(p.id),
            'projectName': p.display_name,
            'projectKey': p.display_name[:4].upper() if p.display_name else 'PROJ',
            'qualityGate': gate,
            'bugs': bugs_count,
            'codeSmells': smells_count,
            'coverage': cov_val,
            'technicalDebt': tech_debt,
            'rating': rating,
            'lastScan': last_scan
        })

    reports_exist = any(p['qualityGate'] != 'NOT_CONNECTED' for p in project_items)
    overall_gate = 'PASSED' if (reports_exist and passed_count >= len(project_items) * 0.7) else ('NOT_CONNECTED' if not reports_exist else 'WARNING')
    valid_covs = [float(p['coverage'].replace('%', '')) for p in project_items if p['coverage'] != 'N/A']
    avg_cov = f"{round(sum(valid_covs) / len(valid_covs), 1)}%" if valid_covs else 'N/A'

    return jsonify({
        'success': True,
        'summary': {
            'overallQualityGate': overall_gate,
            'bugs': total_bugs,
            'vulnerabilities': 0,
            'codeSmells': total_smells,
            'coverage': avg_cov
        },
        'projects': project_items
    }), 200

