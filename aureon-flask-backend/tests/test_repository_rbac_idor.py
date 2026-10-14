import pytest
import uuid
from datetime import datetime, timezone, timedelta
from flask_jwt_extended import create_access_token
from extensions import db
from models import GitHubRepository, GitHubCommit, GitHubPullRequest, GitHubContributor, Project, ProjectMember, User
from services.project_health_service import HealthCalculator


# ━━━ 1. UNAUTHENTICATED CALLS RETURN 401 ━━━

def test_unauthenticated_requests_return_401(client, app):
    """Verifies that all protected repository endpoints strictly return 401 when no JWT is provided."""
    with app.app_context():
        repo = GitHubRepository(
            owner="aureon-test",
            repository_name=f"unauth-test-{uuid.uuid4().hex[:6]}",
            repository_url="https://github.com/aureon-test/unauth",
            is_active=True
        )
        db.session.add(repo)
        db.session.commit()
        repo_id = str(repo.id)

    # 1. Listing repositories
    assert client.get('/api/v1/repositories').status_code == 401
    assert client.get('/api/v1/repositories/').status_code == 401

    # 2. Connecting repository
    assert client.post('/api/v1/repositories/connect', json={'repository_url': 'https://github.com/aureon/test'}).status_code == 401

    # 3. Repository details
    assert client.get(f'/api/v1/repositories/{repo_id}').status_code == 401

    # 4. Synchronize repository
    assert client.post(f'/api/v1/repositories/{repo_id}/sync').status_code == 401

    # 5. Commit sub-resource & insertion
    assert client.get(f'/api/v1/repositories/{repo_id}/commits').status_code == 401
    assert client.post(f'/api/v1/repositories/{repo_id}/commits', json={'message': 'test'}).status_code == 401

    # 6. Pull requests, contributors, branches, files, risks
    assert client.get(f'/api/v1/repositories/{repo_id}/pull-requests').status_code == 401
    assert client.get(f'/api/v1/repositories/{repo_id}/contributors').status_code == 401
    assert client.get(f'/api/v1/repositories/{repo_id}/branches').status_code == 401
    assert client.get(f'/api/v1/repositories/{repo_id}/files').status_code == 401
    assert client.get(f'/api/v1/repositories/{repo_id}/risks').status_code == 401

    # 7. Disconnect / delete repository
    assert client.delete(f'/api/v1/repositories/{repo_id}').status_code == 401


# ━━━ 2. COMMIT INSERTION IDOR & IMPERSONATION TESTS ━━━

def test_developer_commit_insertion_idor_prevention(client, app):
    """
    Negative tests:
    - Developer A cannot insert a commit into Developer B's project (403).
    - Developer A cannot record a commit pretending to be Developer B (403).
    - Developer cannot insert commits into an unassigned repository (403).
    - Authorized developer can record a commit matching their own identity (201).
    - PM / Lead / Admin can record commits according to business rules (201).
    """
    with app.app_context():
        admin_user = User.query.filter_by(email='admin@aureon.com').first()
        pm_user = User.query.filter_by(email='gopika@aureon.com').first()
        lead_user = User.query.filter_by(email='krish@aureon.com').first()
        dev_a = User.query.filter_by(email='sainu@aureon.com').first()
        dev_b = User.query.filter_by(email='ram.kumar@aureon.com').first()
        dev_unrelated = User.query.filter_by(email='alex.r@aureon.com').first()

        # Project 1: dev_a and dev_b are members
        p1 = Project(name=f"Project P1 ({uuid.uuid4().hex[:6]})", manager_id=pm_user.id, lead_id=lead_user.id, is_active=True)
        # Project 2: dev_unrelated is member
        p2 = Project(name=f"Project P2 ({uuid.uuid4().hex[:6]})", is_active=True)
        db.session.add_all([p1, p2])
        db.session.commit()

        # Memberships
        db.session.add_all([
            ProjectMember(project_id=p1.id, user_id=dev_a.id),
            ProjectMember(project_id=p1.id, user_id=dev_b.id),
            ProjectMember(project_id=p2.id, user_id=dev_unrelated.id)
        ])

        # Repositories
        repo1 = GitHubRepository(
            project_id=p1.id,
            owner="aureon-test",
            repository_name=f"repo-p1-{uuid.uuid4().hex[:6]}",
            repository_url="https://github.com/aureon-test/repo-p1",
            is_active=True
        )
        repo2 = GitHubRepository(
            project_id=p2.id,
            owner="aureon-test",
            repository_name=f"repo-p2-{uuid.uuid4().hex[:6]}",
            repository_url="https://github.com/aureon-test/repo-p2",
            is_active=True
        )
        db.session.add_all([repo1, repo2])
        db.session.commit()

        # Auth headers
        headers_dev_a = {'Authorization': f'Bearer {create_access_token(identity=str(dev_a.id))}'}
        headers_dev_unrelated = {'Authorization': f'Bearer {create_access_token(identity=str(dev_unrelated.id))}'}
        headers_admin = {'Authorization': f'Bearer {create_access_token(identity=str(admin_user.id))}'}
        headers_pm = {'Authorization': f'Bearer {create_access_token(identity=str(pm_user.id))}'}

        # ─── NEGATIVE TEST 1: Cross-project commit injection ───
        # dev_unrelated (assigned to P2) attempts to insert commit into P1's repo1
        res_cross = client.post(f'/api/v1/repositories/{repo1.id}/commits', headers=headers_dev_unrelated, json={
            'commit_message': 'malicious cross-project commit'
        })
        assert res_cross.status_code == 403
        assert 'not assigned' in res_cross.json['message'].lower()

        # ─── NEGATIVE TEST 2: Developer impersonation / identity spoofing ───
        # dev_a attempts to insert commit under dev_b's name/email into repo1
        res_impersonate_name = client.post(f'/api/v1/repositories/{repo1.id}/commits', headers=headers_dev_a, json={
            'commit_message': 'spoofed commit by name',
            'author_name': dev_b.display_name or 'Ram Kumar'
        })
        assert res_impersonate_name.status_code == 403
        assert 'cannot record commits under another author' in res_impersonate_name.json['message'].lower() or 'identity' in res_impersonate_name.json['message'].lower()

        res_impersonate_email = client.post(f'/api/v1/repositories/{repo1.id}/commits', headers=headers_dev_a, json={
            'commit_message': 'spoofed commit by email',
            'author_email': dev_b.email
        })
        assert res_impersonate_email.status_code == 403
        assert 'cannot record commits under another' in res_impersonate_email.json['message'].lower() and 'email' in res_impersonate_email.json['message'].lower()

        # ─── POSITIVE TEST 1: Authorized developer records commit under their own identity ───
        res_valid_dev = client.post(f'/api/v1/repositories/{repo1.id}/commits', headers=headers_dev_a, json={
            'commit_message': 'feat: legit developer feature commit'
        })
        assert res_valid_dev.status_code == 201
        assert res_valid_dev.json['success'] is True
        c_data = res_valid_dev.json['commit']
        assert c_data['author_name'] == (dev_a.display_name or dev_a.username or 'Developer')
        assert c_data['author_email'] == dev_a.email

        # ─── POSITIVE TEST 2: Admin can record commit ───
        res_admin = client.post(f'/api/v1/repositories/{repo1.id}/commits', headers=headers_admin, json={
            'commit_message': 'admin maintainer sync commit'
        })
        assert res_admin.status_code == 201

        # ─── POSITIVE TEST 3: PM can record commit for their managed project ───
        res_pm = client.post(f'/api/v1/repositories/{repo1.id}/commits', headers=headers_pm, json={
            'commit_message': 'pm release tracking commit'
        })
        assert res_pm.status_code == 201


# ━━━ 3. PROJECT HEALTH GITHUB SCORE CALCULATION ━━━

def test_project_health_github_score_with_real_commits(app):
    """Verifies that HealthCalculator._calculate_github_score accurately reads commits and does not falsely deduct RISK-NO-COMMITS."""
    with app.app_context():
        p = Project(name=f"Health Test Proj ({uuid.uuid4().hex[:6]})", is_active=True)
        db.session.add(p)
        db.session.commit()

        # 1. Without repository -> returns available: False
        res_empty = HealthCalculator._calculate_github_score(p.id)
        assert res_empty['available'] is False
        assert res_empty['score'] is None

        # 2. With repository having fresh commits -> evaluates health score without RISK-NO-COMMITS
        repo = GitHubRepository(
            project_id=p.id,
            owner="aureon-maker",
            repository_name="test-health-repo",
            repository_url="https://github.com/aureon-maker/test-health-repo",
            default_branch="main",
            open_issues=0,
            is_active=True
        )
        db.session.add(repo)
        db.session.flush()

        now = datetime.now(timezone.utc)
        commit = GitHubCommit(
            repository_id=repo.id,
            github_commit_id="sha123456",
            commit_sha="sha123456",
            author_name="Sainu Dev",
            author_email="sainu@aureon.com",
            commit_message="feat: fresh healthy commit",
            commit_date=now - timedelta(days=2),
            commit_url="https://github.com/aureon-maker/test-health-repo/commit/sha123456"
        )
        db.session.add(commit)
        db.session.commit()

        res_healthy = HealthCalculator._calculate_github_score(p.id)
        assert res_healthy['available'] is True
        assert res_healthy['score'] >= 80
        risk_ids = [r['id'] for r in res_healthy['risks']]
        assert 'RISK-NO-COMMITS' not in risk_ids
