import pytest
from datetime import timedelta
from flask_jwt_extended import create_access_token
from extensions import db
from models import User, Role, Project, Team, Task, TeamMember
from services.rbac_service import get_auth_user

def test_anonymous_access_rejected_on_protected_endpoints(app, client):
    """Anonymous access without JWT must return 401 on protected endpoints."""
    # Repository endpoints require authentication and fail closed with 401
    res_repo = client.get('/api/v1/repositories')
    assert res_repo.status_code == 401
    assert 'Authentication required' in res_repo.get_json().get('message', '')

    res_conn = client.post('/api/v1/repositories/connect', json={'repository_url': 'https://github.com/aureon/test'})
    assert res_conn.status_code == 401

    # In production context (allow_header_fallback=False), get_auth_user fails closed to None
    with app.test_request_context('/api/v1/users/me'):
        assert get_auth_user(allow_header_fallback=False) is None


def test_tampered_jwt_rejected(client):
    """Tampered JWT with bad signature or payload must be rejected with 401 Unauthorized."""
    tampered_headers = {'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature'}
    res = client.get('/api/v1/users/me', headers=tampered_headers)
    assert res.status_code == 401
    data = res.get_json()
    assert data.get('success') is False
    assert 'Invalid or tampered token' in data.get('message', '')

    # Completely malformed Authorization header
    malformed_headers = {'Authorization': 'Bearer not-even-a-jwt'}
    res2 = client.get('/api/v1/users/me', headers=malformed_headers)
    assert res2.status_code == 401


def test_expired_jwt_rejected(app, client):
    """Expired JWT must return 401 token_expired."""
    with app.app_context():
        admin = User.query.filter_by(email='admin@aureon.com').first()
        expired_token = create_access_token(identity=str(admin.id), expires_delta=timedelta(seconds=-10))

    expired_headers = {'Authorization': f'Bearer {expired_token}'}
    res = client.get('/api/v1/users/me', headers=expired_headers)
    assert res.status_code == 401
    data = res.get_json()
    assert data.get('success') is False
    assert 'expired' in data.get('message', '').lower()


def test_role_boundary_developer_cannot_access_admin_dashboard(app, client):
    """Developers cannot access Admin Dashboard (403 Forbidden)."""
    with app.app_context():
        dev = User.query.filter_by(username='sainu').first()
        dev_token = create_access_token(identity=str(dev.id))

    dev_headers = {'Authorization': f'Bearer {dev_token}'}
    res = client.get('/api/v1/dashboards/admin', headers=dev_headers)
    assert res.status_code == 403
    assert 'Admin privileges required' in res.get_json()['message']


def test_role_boundary_developer_cannot_confirm_assignment(app, client):
    """Developers cannot confirm task recommendations (403 Forbidden)."""
    with app.app_context():
        dev = User.query.filter_by(username='sainu').first()
        dev_token = create_access_token(identity=str(dev.id))
        dev_id = str(dev.id)
        task = Task(title='Security Check Task', status='TODO')
        db.session.add(task)
        db.session.commit()
        task_id = str(task.id)

    dev_headers = {'Authorization': f'Bearer {dev_token}'}
    res = client.post(
        f'/api/v1/tasks/{task_id}/confirm-assignment',
        json={'developer_id': dev_id},
        headers=dev_headers
    )
    assert res.status_code == 403
    assert '403 Forbidden' in res.get_json()['message'] or 'Access denied' in res.get_json()['message']


def test_cross_user_developer_cannot_edit_other_developer_skills(app, client):
    """Developer A cannot edit Developer B's skills (IDOR protection)."""
    with app.app_context():
        dev_a = User.query.filter_by(username='sainu').first()
        dev_b = User.query.filter_by(username='jiya').first()
        dev_a_token = create_access_token(identity=str(dev_a.id))
        dev_b_id = str(dev_b.id)

    dev_a_headers = {'Authorization': f'Bearer {dev_a_token}'}
    res = client.put(
        f'/api/v1/users/{dev_b_id}/skills',
        json={'skills': 'Hacked Skills'},
        headers=dev_a_headers
    )
    assert res.status_code == 403
    assert '403 Forbidden' in res.get_json()['message']


def test_header_spoofing_prevented_when_headers_disabled(app, client):
    """When allow_dev_headers is false, passing X-User-Email cannot impersonate Admin."""
    with app.test_request_context('/api/v1/users/me', headers={'X-User-Email': 'admin@aureon.com'}):
        user = get_auth_user(allow_header_fallback=False)
        assert user is None
