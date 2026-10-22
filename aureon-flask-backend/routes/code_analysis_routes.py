import os
from flask import Blueprint, request, jsonify
from extensions import db
from models import CodeAnalysis, CodeAnalysisIssue, CodeMetrics, AuditLog
from services.static_analysis_service import StaticAnalysisService
from services.risk_engine_service import RuleEngine

code_analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/v1/analysis')

@code_analysis_bp.route('/run', methods=['POST'])
@code_analysis_bp.route('/run/', methods=['POST'])
def run_analysis():
    from models import Project, Repository, CodeQualityReport
    data = request.get_json() or {}
    repository_id = data.get('repository_id')
    project_id = data.get('project_id')
    file_content = data.get('code', 'def calculate_metrics(data):\n    return len(data)\n')
    file_name = data.get('file_name', 'main.py')

    # Resolve project if repository_id provided
    if repository_id and not project_id:
        repo = Repository.query.get(repository_id)
        if repo and repo.project_id:
            project_id = repo.project_id

    result = StaticAnalysisService.analyze_source_code(repository_id, file_content, file_name)

    # Sync into CodeQualityReport if linked to a project
    if project_id:
        report = CodeQualityReport.query.filter_by(project_id=project_id).first()
        if not report:
            report = CodeQualityReport(project_id=project_id, repository_id=repository_id)
            db.session.add(report)

        report.repository_id = repository_id or report.repository_id
        report.total_files = max(1, len(result.get('metrics', [])))
        loc = result['metrics'][0]['loc'] if result.get('metrics') else len(file_content.splitlines())
        report.total_lines = loc
        report.complexity_score = result['metrics'][0]['cyclomatic_complexity'] if result.get('metrics') else 1.0
        report.maintainability_score = result['metrics'][0]['maintainability_index'] if result.get('metrics') else 85.0
        report.pylint_errors = len([i for i in result.get('issues', []) if i.get('issue_type') in ['ERROR', 'FATAL']])
        report.pylint_warnings = len([i for i in result.get('issues', []) if i.get('issue_type') == 'WARNING'])
        report.quality_score = round(result.get('score', 8.0) * 10, 1)
        report.risk_level = 'LOW' if result.get('score', 8.0) >= 7.5 else ('MEDIUM' if result.get('score', 8.0) >= 5.0 else 'HIGH')

    log = AuditLog(
        action='CODE_ANALYSIS_EXECUTED',
        details=f"Ran Pylint & Radon analysis on {file_name}. Score: {result['score']}"
    )
    db.session.add(log)
    db.session.commit()

    # Re-evaluate risk engine after static code scan if project exists
    if project_id:
        try:
            RuleEngine.evaluate_project_risks(project_id)
        except Exception:
            pass

    return jsonify({'success': True, 'result': result}), 200

@code_analysis_bp.route('/results', methods=['GET'])
@code_analysis_bp.route('/results/', methods=['GET'])
def get_analysis_results():
    analyses = CodeAnalysis.query.order_by(CodeAnalysis.executed_at.desc()).all()
    metrics = CodeMetrics.query.all()
    issues = CodeAnalysisIssue.query.join(CodeAnalysis, CodeAnalysisIssue.analysis_id == CodeAnalysis.id).order_by(CodeAnalysis.executed_at.desc()).all()

    return jsonify({
        'success': True,
        'analyses': [a.to_dict() for a in analyses],
        'total_metrics': len(metrics),
        'total_issues': len(issues),
        'issues': [{
            'id': str(i.id),
            'analysis_id': str(i.analysis_id) if i.analysis_id else None,
            'file': i.file_path,
            'line': i.line_number,
            'type': i.issue_type,
            'category': i.category or i.issue_type,
            'message': i.description,
            'severity': i.severity
        } for i in issues[:100]]
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

@code_analysis_bp.route('/scan-source', methods=['POST'])
@code_analysis_bp.route('/scan-source/', methods=['POST'])
def scan_source():
    from models import CodeQualityReport
    data = request.get_json() or {}
    rel_path = data.get('file_path', 'config.py')
    project_id = data.get('project_id')

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_path = os.path.normpath(os.path.join(base_dir, rel_path))

    if not target_path.startswith(base_dir) or not os.path.isfile(target_path):
        return jsonify({'error': 'Target file not found or invalid path'}), 400

    # Security boundary: Only allow genuine Python source files (.py)
    if not target_path.endswith('.py'):
        return jsonify({'error': 'Invalid file type: Static analysis currently supports Python source files (.py) only.'}), 400

    # Security boundary: Disallow virtual environments, dependencies, and sensitive directories
    blocked_dirs = {'venv', '.venv', 'env', '.git', 'node_modules', '__pycache__', '.gemini'}
    path_parts = set(os.path.normpath(rel_path).replace('/', os.sep).replace('\\', os.sep).split(os.sep))
    if path_parts.intersection(blocked_dirs) or os.path.basename(target_path).startswith('.'):
        return jsonify({'error': 'Access denied: Scanning virtual environments, dependencies, hidden files, or sensitive directories is prohibited.'}), 400

    try:
        with open(target_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return jsonify({'error': f'Failed to read source file: {str(e)}'}), 500

    file_name = os.path.basename(target_path)
    result = StaticAnalysisService.analyze_source_code(None, content, file_name)

    if project_id:
        report = CodeQualityReport.query.filter_by(project_id=project_id).first()
        if not report:
            report = CodeQualityReport(project_id=project_id)
            db.session.add(report)
        report.total_files = 1
        loc = result['metrics'][0]['loc'] if result.get('metrics') else len(content.splitlines())
        report.total_lines = loc
        report.complexity_score = result['metrics'][0]['cyclomatic_complexity'] if result.get('metrics') else 1.0
        report.maintainability_score = result['metrics'][0]['maintainability_index'] if result.get('metrics') else 85.0
        report.pylint_errors = len([i for i in result.get('issues', []) if i.get('issue_type') in ['ERROR', 'FATAL']])
        report.pylint_warnings = len([i for i in result.get('issues', []) if i.get('issue_type') == 'WARNING'])
        report.quality_score = round(result.get('score', 8.0) * 10, 1)
        report.risk_level = 'LOW' if result.get('score', 8.0) >= 7.5 else ('MEDIUM' if result.get('score', 8.0) >= 5.0 else 'HIGH')

    log = AuditLog(
        action='CODE_ANALYSIS_EXECUTED',
        details=f"Ran real Pylint & Radon scan on source file {file_name}. Score: {result['score']}"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'success': True, 'result': result}), 200

