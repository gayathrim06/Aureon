from flask import Blueprint, request, jsonify
import json
from extensions import db
from models import Report, Project, Task, Risk, CodeAnalysis, AuditLog

report_bp = Blueprint('reports', __name__, url_prefix='/api/v1/reports')

@report_bp.route('/', methods=['GET'])
@report_bp.route('', methods=['GET'])
def list_reports():
    reports = Report.query.order_by(Report.created_at.desc()).all()
    return jsonify({'success': True, 'count': len(reports), 'reports': [r.to_dict() for r in reports]}), 200

@report_bp.route('/generate', methods=['POST'])
@report_bp.route('/generate/', methods=['POST'])
def generate_report():
    data = request.get_json() or {}
    report_type = data.get('type', 'PROJECT_HEALTH')
    project_id = data.get('project_id', 1)

    project = Project.query.get(project_id)
    tasks = Task.query.filter_by(project_id=project_id).all()
    risks = Risk.query.filter_by(project_id=project_id).all()

    content = {
        'project': project.name if project else 'System-Wide',
        'health_score': project.health_score if project else 85,
        'total_tasks': len(tasks),
        'completed_tasks': len([t for t in tasks if t.status == 'COMPLETED']),
        'open_risks': len([r for r in risks if r.status == 'OPEN'])
    }

    report = Report(
        project_id=project_id,
        report_type=report_type,
        title=f"{report_type.replace('_', ' ').title()} Report - {project.name if project else 'General'}",
        content_json=json.dumps(content)
    )
    db.session.add(report)

    log = AuditLog(
        action='REPORT_GENERATED',
        entity='Report',
        details=f"Generated {report_type} report for project {project_id}"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'success': True, 'report': report.to_dict(), 'content': content}), 201
