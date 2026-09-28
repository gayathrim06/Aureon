from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid
from datetime import datetime
from extensions import db
from models import Bug, User, Project, AuditLog

bug_bp = Blueprint('bugs', __name__, url_prefix='/api/v1/bugs')

def _get_auth_user():
    user_id = get_jwt_identity()
    user = None
    if user_id:
        user = User.query.get(user_id)
    if not user:
        user = User.query.first()
    return user

@bug_bp.route('/', methods=['GET'])
@bug_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def list_bugs():
    project_id = request.args.get('project_id')
    status = request.args.get('status')
    severity = request.args.get('severity')

    query = Bug.query.filter_by(is_deleted=False)
    if project_id:
        query = query.filter_by(project_id=project_id)
    if status:
        query = query.filter(Bug.status.ilike(status))
    if severity:
        query = query.filter(Bug.severity.ilike(severity))

    bugs = query.order_by(Bug.created_at.desc()).all()
    bugs_data = [b.to_dict() for b in bugs]
    return jsonify({
        'success': True,
        'count': len(bugs),
        'bugs': bugs_data,
        'data': bugs_data
    }), 200

@bug_bp.route('/', methods=['POST'])
@bug_bp.route('', methods=['POST'])
@jwt_required(optional=True)
def create_bug():
    data = request.get_json() or {}
    title = data.get('title')
    if not title or not str(title).strip():
        return jsonify({'success': False, 'message': 'Bug title is required.'}), 400

    auth_user = _get_auth_user()
    reporter_id = data.get('reporter_id') or (auth_user.id if auth_user else None)
    project_id = data.get('project_id') or data.get('projectId')
    if not project_id:
        p = Project.query.filter_by(is_active=True, is_deleted=False).first()
        project_id = p.id if p else None

    assigned_developer_id = data.get('assigned_developer_id') or data.get('assigned_to')

    bug_count = Bug.query.count()
    bug_code = f"BUG-{bug_count + 101}"

    new_bug = Bug(
        bug_id=bug_code,
        title=str(title).strip(),
        description=data.get('description', ''),
        steps_to_reproduce=data.get('steps_to_reproduce', data.get('stepsToReproduce', '')),
        severity=data.get('severity', 'HIGH').upper(),
        priority=data.get('priority', 'HIGH').upper(),
        status='OPEN',
        evidence_file=data.get('evidence_file', ''),
        project_id=project_id,
        reporter_id=reporter_id,
        assigned_developer_id=assigned_developer_id
    )

    db.session.add(new_bug)

    log = AuditLog(
        action='BUG_REPORTED',
        details=f"Bug '{new_bug.title}' ({new_bug.bug_id}) logged by {auth_user.email if auth_user else 'QA'}",
        user_email=auth_user.email if auth_user else 'qa@aureon.com',
        role_name=auth_user.role_name if auth_user else 'ROLE_QA',
        status='SUCCESS'
    )
    db.session.add(log)
    db.session.commit()

    bug_dict = new_bug.to_dict()
    return jsonify({
        'success': True,
        'message': 'Bug successfully reported.',
        'bug': bug_dict,
        'data': bug_dict
    }), 201

@bug_bp.route('/<string:bug_id>/status', methods=['PATCH', 'PUT'])
@bug_bp.route('/<string:bug_id>/status/', methods=['PATCH', 'PUT'])
@jwt_required(optional=True)
def update_bug_status(bug_id):
    bug = Bug.query.get(bug_id)
    if not bug:
        # Try matching bug_id string
        bug = Bug.query.filter_by(bug_id=bug_id).first()
    if not bug:
        return jsonify({'success': False, 'message': 'Bug not found.'}), 404

    data = request.get_json() or {}
    new_status = data.get('status', 'OPEN').upper()
    old_status = bug.status
    bug.status = new_status
    bug.updated_at = datetime.utcnow()

    auth_user = _get_auth_user()
    log = AuditLog(
        action='BUG_STATUS_UPDATED',
        details=f"Bug '{bug.title}' ({bug.bug_id}) status changed from {old_status} to {new_status}",
        user_email=auth_user.email if auth_user else 'qa@aureon.com',
        role_name=auth_user.role_name if auth_user else 'ROLE_QA',
        status='SUCCESS'
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Bug status updated to {new_status}.',
        'bug': bug.to_dict()
    }), 200
