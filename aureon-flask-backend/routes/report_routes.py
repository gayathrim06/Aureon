from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import json
from datetime import datetime, timedelta
from extensions import db
from models import Report, Project, Task, Risk, CodeAnalysis, AuditLog, Sprint
from services.rbac_service import get_auth_user, get_user_scope

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
        'health_score': project.health_score if project else None,
        'total_tasks': len(tasks),
        'completed_tasks': len([t for t in tasks if (t.status or '').upper() in ('COMPLETED', 'DONE')]),
        'open_risks': len([r for r in risks if (r.status or '').upper() == 'OPEN'])
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

@report_bp.route('/delivery-analytics', methods=['GET'])
@report_bp.route('/delivery-analytics/', methods=['GET'])
@jwt_required(optional=True)
def get_delivery_analytics():
    """
    Returns verified sprint velocity, task throughput, and deliverable metrics
    calculated directly from PostgreSQL database records.
    """
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    scope = get_user_scope(user)
    project_id_arg = request.args.get('project_id', 'ALL').strip()

    if scope.is_admin:
        project_query = Project.query.filter_by(is_deleted=False)
    else:
        project_query = Project.query.filter_by(is_deleted=False).filter(Project.id.in_(scope.project_ids))

    all_accessible_projects = project_query.all()
    accessible_project_ids = [p.id for p in all_accessible_projects]

    if project_id_arg != 'ALL':
        try:
            import uuid
            filter_uuid = uuid.UUID(project_id_arg)
            if filter_uuid in accessible_project_ids:
                scoped_project_ids = [filter_uuid]
            else:
                return jsonify({'success': False, 'message': '403 Forbidden: Project not accessible.'}), 403
        except ValueError:
            scoped_project_ids = accessible_project_ids
    else:
        scoped_project_ids = accessible_project_ids

    # 1. Fetch real Sprints from database
    if scoped_project_ids:
        sprints = (
            Sprint.query.filter(Sprint.project_id.in_(scoped_project_ids))
            .order_by(Sprint.created_at.asc())
            .all()
        )
        tasks = Task.query.filter(Task.project_id.in_(scoped_project_ids)).all()
    else:
        sprints = []
        tasks = []

    # 2. Build real sprint velocity data
    velocity_data = []
    total_velocity = 0
    for s in sprints:
        s_tasks = [t for t in tasks if t.sprint_id == s.id]
        planned_pts = sum(t.story_points for t in s_tasks) if s_tasks else (s.total_story_points or 0)
        completed_pts = sum(t.story_points for t in s_tasks if (t.status or '').upper() in ('COMPLETED', 'DONE')) if s_tasks else (s.completed_story_points or 0)
        
        # If no story points tracked, use task counts
        if planned_pts == 0 and len(s_tasks) > 0:
            planned_pts = len(s_tasks)
            completed_pts = len([t for t in s_tasks if (t.status or '').upper() in ('COMPLETED', 'DONE')])

        label = s.name[:12] if s.name else 'Sprint'
        velocity_data.append({
            'sprint': label,
            'velocity': round(completed_pts, 1),
            'planned': round(planned_pts, 1),
            'sprint_id': str(s.id)
        })
        total_velocity += completed_pts

    avg_velocity = round(total_velocity / len(velocity_data), 1) if velocity_data else 0.0

    # 3. Calculate weekly task throughput from actual task timestamps
    now = datetime.utcnow()
    throughput_data = []
    for week_idx in range(3, -1, -1):
        week_start = now - timedelta(days=(week_idx + 1) * 7)
        week_end = now - timedelta(days=week_idx * 7)
        label = f"W{4 - week_idx}"

        created_count = len([
            t for t in tasks 
            if t.created_at and week_start <= t.created_at < week_end
        ])
        completed_count = len([
            t for t in tasks 
            if (t.status or '').upper() in ('COMPLETED', 'DONE') 
            and t.updated_at and week_start <= t.updated_at < week_end
        ])

        throughput_data.append({
            'week': label,
            'created': created_count,
            'completed': completed_count
        })

    # 4. Aggregated real KPI metrics
    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if (t.status or '').upper() in ('COMPLETED', 'DONE')])
    completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    # On-time delivery rate: completed tasks that were NOT overdue
    on_time_tasks = len([
        t for t in tasks 
        if (t.status or '').upper() in ('COMPLETED', 'DONE') and not getattr(t, 'is_overdue', False)
    ])
    on_time_rate = round((on_time_tasks / completed_tasks * 100), 1) if completed_tasks > 0 else (100.0 if total_tasks == 0 else 0.0)

    return jsonify({
        'success': True,
        'metrics': {
            'avg_velocity': avg_velocity,
            'total_completed_tasks': completed_tasks,
            'total_tasks': total_tasks,
            'completion_rate_pct': completion_rate,
            'on_time_delivery_pct': on_time_rate,
            'sprints_count': len(sprints)
        },
        'velocity_trend': velocity_data,
        'weekly_throughput': throughput_data
    }), 200
