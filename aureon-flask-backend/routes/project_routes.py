from flask import Blueprint, request, jsonify
from datetime import datetime, date
from extensions import db
from models import Project, ProjectMember, User, AuditLog
from services.project_health_service import HealthCalculator
from services.risk_engine_service import RuleEngine

project_bp = Blueprint('projects', __name__, url_prefix='/api/v1/projects')

@project_bp.route('/', methods=['GET', 'POST'])
@project_bp.route('', methods=['GET', 'POST'])
def manage_projects():
    if request.method == 'GET':
        projects = Project.query.all()
        result = []
        for p in projects:
            # Dynamically recalculate health score & evaluate risks
            RuleEngine.evaluate_project_risks(p.id)
            health_info = HealthCalculator.calculate_health_score(p.id)
            p_dict = p.to_dict()
            p_dict['health_status'] = health_info['status']
            result.append(p_dict)
        return jsonify({'success': True, 'count': len(result), 'projects': result}), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name')
        code = data.get('code', name.upper()[:4] if name else 'PRJ')
        description = data.get('description', '')
        priority = data.get('priority', 'HIGH')

        if not name:
            return jsonify({'success': False, 'message': 'Project name is required.'}), 400

        project = Project(
            name=name,
            code=code,
            description=description,
            priority=priority,
            status='IN_PROGRESS',
            health_score=90
        )
        db.session.add(project)
        db.session.flush()

        log = AuditLog(
            action='PROJECT_CREATED',
            entity='Project',
            entity_id=str(project.id),
            details=f"Created project {name} ({code})"
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Project created successfully.', 'project': project.to_dict()}), 201

@project_bp.route('/<int:project_id>/health', methods=['GET'])
def get_project_health(project_id):
    health = HealthCalculator.calculate_health_score(project_id)
    return jsonify({'success': True, 'health': health}), 200
