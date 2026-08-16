from flask import Blueprint, request, jsonify
from extensions import db
from models import Repository, Commit, AuditLog

repository_bp = Blueprint('repositories', __name__, url_prefix='/api/v1/repositories')

@repository_bp.route('/', methods=['GET', 'POST'])
@repository_bp.route('', methods=['GET', 'POST'])
def manage_repositories():
    if request.method == 'GET':
        repos = Repository.query.all()
        return jsonify({'success': True, 'count': len(repos), 'repositories': [r.to_dict() for r in repos]}), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name')
        url = data.get('url', f"https://github.com/aureon-org/{name}")
        project_id = data.get('project_id', 1)

        repo = Repository(
            name=name,
            url=url,
            project_id=project_id,
            connection_status='CONNECTED'
        )
        db.session.add(repo)
        db.session.flush()

        log = AuditLog(
            action='REPOSITORY_CONNECTED',
            entity='Repository',
            entity_id=str(repo.id),
            details=f"Connected GitHub repo {name}"
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Repository connected.', 'repository': repo.to_dict()}), 201

@repository_bp.route('/<int:repo_id>/commits', methods=['GET'])
def list_commits(repo_id):
    commits = Commit.query.filter_by(repository_id=repo_id).order_by(Commit.timestamp.desc()).all()
    return jsonify({'success': True, 'count': len(commits), 'commits': [c.to_dict() for c in commits]}), 200
