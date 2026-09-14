import pytest
import uuid
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta
from services.github_service import (
    GitHubService, GitHubResourceNotFound, GitHubAuthenticationError,
    GitHubRateLimitExceeded
)
from services.github_risk_service import GitHubRiskService
from models import GitHubRepository, GitHubCommit, GitHubPullRequest, GitHubContributor, Project, ProjectMember, User
from extensions import db
from flask_jwt_extended import create_access_token


# ━━━ 1. URL PARSER TESTS ━━━

def test_parse_github_url_valid_formats():
    test_cases = [
        ("https://github.com/facebook/react", ("facebook", "react")),
        ("https://github.com/facebook/react.git", ("facebook", "react")),
        ("http://github.com/facebook/react/", ("facebook", "react")),
        ("facebook/react", ("facebook", "react")),
        ("https://www.github.com/gayathrim06/Aureon", ("gayathrim06", "Aureon")),
        ("git@github.com:pallets/flask.git", ("pallets", "flask"))
    ]
    for url, expected in test_cases:
        owner, repo = GitHubService.parse_github_url(url)
        assert (owner, repo) == expected, f"Failed parsing: {url}"


def test_parse_github_url_invalid_formats():
    invalid_cases = [
        "",
        None,
        "not-a-url",
        "https://gitlab.com/owner/repo",
        "https://github.com/",
        "https://github.com/only-owner"
    ]
    for invalid in invalid_cases:
        with pytest.raises(ValueError):
            GitHubService.parse_github_url(invalid)


# ━━━ 2. RULE-BASED RISK ENGINE TESTS ━━━

def test_github_risk_service_healthy_repo():
    now = datetime.now(timezone.utc)
    recent_commit = {
        'commit_sha': 'abc1234',
        'commit_date': (now - timedelta(days=2)).isoformat()
    }
    commits = [recent_commit]
    pull_requests = [
        {'state': 'open', 'created_at': (now - timedelta(days=2)).isoformat(), 'pr_number': 101, 'title': 'Add feature'}
    ]
    contributors = [
        {'username': 'dev1', 'contributions': 30},
        {'username': 'dev2', 'contributions': 25},
        {'username': 'dev3', 'contributions': 20}
    ]
    repo_dict = {'open_issues': 4}

    result = GitHubRiskService.evaluate_repository_risks(repo_dict, commits, pull_requests, contributors)
    assert result['health_score'] >= 80
    assert result['health_status'] == 'HEALTHY'
    assert result['risks_count'] == 0


def test_github_risk_service_inactivity_and_stale_pr():
    now = datetime.now(timezone.utc)
    # Commit is 35 days old -> Inactivity risk
    old_commit = {
        'commit_sha': 'deadbeef',
        'commit_date': (now - timedelta(days=35)).isoformat()
    }
    # PR is 15 days old and open -> Stale PR risk
    stale_pr = {
        'state': 'open',
        'created_at': (now - timedelta(days=15)).isoformat(),
        'pr_number': 42,
        'title': 'Fix login bug'
    }
    # Single contributor -> Bus factor
    contributors = [{'username': 'lone_coder', 'contributions': 50}]
    repo_dict = {'open_issues': 35}  # High issue backlog

    result = GitHubRiskService.evaluate_repository_risks(repo_dict, [old_commit], [stale_pr], contributors)
    assert result['health_score'] < 60
    assert result['health_status'] == 'AT_RISK'
    risk_types = [r['type'] for r in result['risks']]
    assert 'DORMANT_REPOSITORY' in risk_types
    assert 'STALE_PULL_REQUEST' in risk_types
    assert 'SINGLE_CONTRIBUTOR_RISK' in risk_types
    assert 'HIGH_ISSUE_BACKLOG' in risk_types


# ━━━ 3. TREE SCANNER & LANGUAGE BREAKDOWN ━━━

def test_tree_source_code_language_filtering():
    sample_tree_response = {
        'tree': [
            {'type': 'blob', 'path': 'src/app.py', 'size': 1200, 'sha': 's1'},
            {'type': 'blob', 'path': 'src/components/Button.jsx', 'size': 800, 'sha': 's2'},
            {'type': 'blob', 'path': 'src/utils.ts', 'size': 500, 'sha': 's3'},
            {'type': 'blob', 'path': 'node_modules/pkg/index.js', 'size': 9999, 'sha': 's4'},  # Should be ignored
            {'type': 'blob', 'path': '.git/config', 'size': 100, 'sha': 's5'},                 # Should be ignored
            {'type': 'blob', 'path': '__pycache__/app.cpython-310.pyc', 'size': 500, 'sha': 's6'}, # Should be ignored
            {'type': 'blob', 'path': 'package-lock.json', 'size': 50000, 'sha': 's7'},        # Should be ignored
            {'type': 'blob', 'path': 'main.go', 'size': 1500, 'sha': 's8'}
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = sample_tree_response

    with patch('requests.get', return_value=mock_resp):
        result = GitHubService.get_repository_tree('fakeowner', 'fakerepo')
        assert result['source_code_files_count'] == 4
        langs = result['language_breakdown']
        assert 'Python' in langs
        assert 'JavaScript (React)' in langs
        assert 'TypeScript' in langs
        assert 'Go' in langs


# ━━━ 4. ENDPOINT INTEGRATION TESTS ━━━

def test_connect_repository_validation_failures(client):
    # Missing URL
    resp = client.post('/api/v1/repositories/connect', json={})
    assert resp.status_code == 400
    assert 'required' in resp.json['message'].lower()

    # Invalid URL
    resp = client.post('/api/v1/repositories/connect', json={'repository_url': 'ftp://invalid'})
    assert resp.status_code == 400


@patch('services.github_service.GitHubService.get_repository')
@patch('services.github_service.GitHubService.get_commits')
@patch('services.github_service.GitHubService.get_pull_requests')
@patch('services.github_service.GitHubService.get_contributors')
@patch('services.github_service.GitHubService.get_repository_tree')
def test_connect_and_sync_repository_success(mock_tree, mock_contribs, mock_prs, mock_commits, mock_repo, client, app):
    # Mock GitHub API returns
    unique_name = f"test-repo-{uuid.uuid4().hex[:6]}"
    mock_repo.return_value = {
        'github_repository_id': 1234567,
        'owner': 'aureon-test',
        'repository_name': unique_name,
        'full_name': f"aureon-test/{unique_name}",
        'repository_url': f"https://github.com/aureon-test/{unique_name}",
        'default_branch': 'main',
        'description': 'Automated test repository',
        'visibility': 'public',
        'language': 'Python',
        'stars': 142,
        'forks': 28,
        'open_issues': 3
    }
    now_iso = datetime.now(timezone.utc).isoformat()
    mock_commits.return_value = [
        {
            'commit_sha': '1a2b3c4d5e6f',
            'author_name': 'Test Engineer',
            'author_email': 'test@aureon.com',
            'commit_message': 'feat: initial test commit',
            'commit_date': now_iso,
            'commit_url': f"https://github.com/aureon-test/{unique_name}/commit/1a2b3c4d5e6f"
        }
    ]
    mock_prs.return_value = [
        {
            'github_pr_id': 9876,
            'pr_number': 1,
            'title': 'Test PR',
            'author': 'reviewer_dev',
            'state': 'open',
            'source_branch': 'feat/test',
            'target_branch': 'main',
            'created_at': now_iso,
            'review_status': 'PENDING'
        }
    ]
    mock_contribs.return_value = [
        {
            'github_user_id': '555',
            'username': 'lead_dev',
            'display_name': 'Lead Developer',
            'contributions': 42,
            'profile_url': 'https://github.com/lead_dev',
            'avatar_url': 'https://github.com/avatars/lead_dev.png'
        }
    ]
    mock_tree.return_value = {
        'total_files_scanned': 15,
        'source_code_files_count': 8,
        'language_breakdown': {'Python': {'files': 8, 'percentage': 100.0}},
        'source_files': [{'path': 'app.py', 'size': 120, 'language': 'Python'}]
    }

    # 1. Connect Repository
    res = client.post('/api/v1/repositories/connect', json={
        'repository_url': f"https://github.com/aureon-test/{unique_name}"
    })
    assert res.status_code == 201
    data = res.json
    assert data['success'] is True
    assert data['repository']['repository_name'] == unique_name
    assert data['sync_summary']['commits_count'] == 1
    assert data['sync_summary']['pull_requests_count'] == 1
    assert data['sync_summary']['contributors_count'] == 1
    repo_id = data['repository']['id']

    # 2. Test Duplicate Rejection
    res_dup = client.post('/api/v1/repositories/connect', json={
        'repository_url': f"https://github.com/aureon-test/{unique_name}"
    })
    assert res_dup.status_code == 409
    assert 'already connected' in res_dup.json['message'].lower()

    # 3. List Repositories
    res_list = client.get('/api/v1/repositories')
    assert res_list.status_code == 200
    assert any(r['id'] == repo_id for r in res_list.json['repositories'])

    # 4. Get Repository By ID
    res_get = client.get(f"/api/v1/repositories/{repo_id}")
    assert res_get.status_code == 200
    assert res_get.json['repository']['id'] == repo_id
    assert len(res_get.json['repository']['commits']) == 1

    # 5. Get Commits Sub-resource
    res_commits = client.get(f"/api/v1/repositories/{repo_id}/commits")
    assert res_commits.status_code == 200
    assert res_commits.json['count'] == 1
    assert res_commits.json['commits'][0]['commit_sha'] == '1a2b3c4d5e6f'

    # 6. Get Pull Requests Sub-resource
    res_prs = client.get(f"/api/v1/repositories/{repo_id}/pull-requests")
    assert res_prs.status_code == 200
    assert res_prs.json['count'] == 1
    assert res_prs.json['pull_requests'][0]['pr_number'] == 1

    # 7. Get Contributors Sub-resource
    res_contribs = client.get(f"/api/v1/repositories/{repo_id}/contributors")
    assert res_contribs.status_code == 200
    assert res_contribs.json['count'] == 1
    assert res_contribs.json['contributors'][0]['username'] == 'lead_dev'

    # 8. Re-sync Repository
    mock_commits.return_value.append({
        'commit_sha': '2b3c4d5e6f7g',
        'author_name': 'Test Engineer',
        'author_email': 'test@aureon.com',
        'commit_message': 'feat: second commit',
        'commit_date': now_iso,
        'commit_url': f"https://github.com/aureon-test/{unique_name}/commit/2b3c4d5e6f7g"
    })
    res_sync = client.post(f"/api/v1/repositories/{repo_id}/sync")
    assert res_sync.status_code == 200
    assert res_sync.json['new_commits_added'] == 1

    # 9. Disconnect Repository
    res_del = client.delete(f"/api/v1/repositories/{repo_id}")
    assert res_del.status_code == 200
    assert res_del.json['success'] is True


# ━━━ 5. RBAC REPOSITORY HIERARCHY VERIFICATION TESTS ━━━

def test_rbac_repository_access_hierarchy(client, app):
    """
    Verifies Aureon Role-Based Repository Access:
    ADMIN: Full repository access
    PROJECT_MANAGER: Only repositories belonging to their projects
    TEAM_LEADER: Only repositories related to their assigned project/team
    DEVELOPER: Only permitted repository/project info (Read-only; cannot connect, sync, or delete)
    """
    with app.app_context():
        admin_user = User.query.filter_by(email='admin@aureon.com').first()
        pm_user = User.query.filter_by(email='eli@aureon.com').first()
        lead_user = User.query.filter_by(email='krish@aureon.com').first()
        dev_user = User.query.filter_by(email='sainu@aureon.com').first()

        # Create two distinct test projects
        p1 = Project(name=f"Project 1 ({uuid.uuid4().hex[:6]})", manager_id=pm_user.id, lead_id=lead_user.id, is_active=True)
        p2 = Project(name=f"Project 2 ({uuid.uuid4().hex[:6]})", is_active=True)
        db.session.add_all([p1, p2])
        db.session.commit()

        # Add Developer to Project 1
        pm_member = ProjectMember(project_id=p1.id, user_id=dev_user.id)
        db.session.add(pm_member)

        # Create two repositories: repo1 under Project 1, repo2 under Project 2
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

        # Generate JWT Bearer tokens for each role
        admin_headers = {'Authorization': f'Bearer {create_access_token(identity=str(admin_user.id))}'}
        pm_headers = {'Authorization': f'Bearer {create_access_token(identity=str(pm_user.id))}'}
        lead_headers = {'Authorization': f'Bearer {create_access_token(identity=str(lead_user.id))}'}
        dev_headers = {'Authorization': f'Bearer {create_access_token(identity=str(dev_user.id))}'}

        # ─── 1. ADMIN: FULL REPOSITORY ACCESS ───
        res_admin_list = client.get('/api/v1/repositories', headers=admin_headers)
        assert res_admin_list.status_code == 200
        admin_repo_ids = {r['id'] for r in res_admin_list.json['repositories']}
        assert str(repo1.id) in admin_repo_ids
        assert str(repo2.id) in admin_repo_ids
        # Admin can view both repos
        assert client.get(f'/api/v1/repositories/{repo1.id}', headers=admin_headers).status_code == 200
        assert client.get(f'/api/v1/repositories/{repo2.id}', headers=admin_headers).status_code == 200

        # ─── 2. PROJECT_MANAGER: ONLY THEIR PROJECTS ───
        res_pm_list = client.get('/api/v1/repositories', headers=pm_headers)
        assert res_pm_list.status_code == 200
        pm_repo_ids = {r['id'] for r in res_pm_list.json['repositories']}
        assert str(repo1.id) in pm_repo_ids
        assert str(repo2.id) not in pm_repo_ids  # Cannot see other manager's repository!

        # PM can view repo1 but gets 403 Forbidden for repo2
        assert client.get(f'/api/v1/repositories/{repo1.id}', headers=pm_headers).status_code == 200
        assert client.get(f'/api/v1/repositories/{repo2.id}', headers=pm_headers).status_code == 403

        # PM cannot connect repository to a project they do not manage
        res_pm_invalid_connect = client.post('/api/v1/repositories/connect', headers=pm_headers, json={
            'repository_url': 'https://github.com/aureon-test/unauthorized-repo',
            'project_id': str(p2.id)
        })
        assert res_pm_invalid_connect.status_code == 403

        # ─── 3. TEAM_LEADER: ONLY ASSIGNED PROJECT/TEAM ───
        res_lead_list = client.get('/api/v1/repositories', headers=lead_headers)
        assert res_lead_list.status_code == 200
        lead_repo_ids = {r['id'] for r in res_lead_list.json['repositories']}
        assert str(repo1.id) in lead_repo_ids
        assert str(repo2.id) not in lead_repo_ids  # Cannot see unassigned project repository!

        # Team leader can view repo1, cannot view repo2 (403)
        assert client.get(f'/api/v1/repositories/{repo1.id}', headers=lead_headers).status_code == 200
        assert client.get(f'/api/v1/repositories/{repo2.id}', headers=lead_headers).status_code == 403

        # Team leader cannot delete/disconnect repository (403)
        assert client.delete(f'/api/v1/repositories/{repo1.id}', headers=lead_headers).status_code == 403

        # ─── 4. DEVELOPER: ONLY PERMITTED INFO (READ-ONLY) ───
        res_dev_list = client.get('/api/v1/repositories', headers=dev_headers)
        assert res_dev_list.status_code == 200
        dev_repo_ids = {r['id'] for r in res_dev_list.json['repositories']}
        assert str(repo1.id) in dev_repo_ids
        assert str(repo2.id) not in dev_repo_ids  # Only permitted repo visible!

        # Developer can view permitted repo1, but not unassigned repo2
        assert client.get(f'/api/v1/repositories/{repo1.id}', headers=dev_headers).status_code == 200
        assert client.get(f'/api/v1/repositories/{repo2.id}', headers=dev_headers).status_code == 403

        # Developer cannot connect new repository (403)
        res_dev_conn = client.post('/api/v1/repositories/connect', headers=dev_headers, json={
            'repository_url': 'https://github.com/aureon-test/dev-denied',
            'project_id': str(p1.id)
        })
        assert res_dev_conn.status_code == 403

        # Developer cannot sync repository (403)
        res_dev_sync = client.post(f'/api/v1/repositories/{repo1.id}/sync', headers=dev_headers)
        assert res_dev_sync.status_code == 403

        # Developer cannot delete repository (403)
        res_dev_del = client.delete(f'/api/v1/repositories/{repo1.id}', headers=dev_headers)
        assert res_dev_del.status_code == 403


# ━━━ 6. PRIVATE REPO, TOKEN LEAK, DEDUPLICATION & SEPARATION TESTS ━━━

def test_private_repository_permission_handling():
    """Verifies that private repositories without permissions return 404/ResourceNotFound, and with permission succeed."""
    mock_resp_404 = MagicMock()
    mock_resp_404.status_code = 404
    mock_resp_404.json.return_value = {'message': 'Not Found'}

    with patch('requests.get', return_value=mock_resp_404):
        with pytest.raises(GitHubResourceNotFound):
            GitHubService.get_repository('private-org', 'private-secret-repo')

    mock_resp_200 = MagicMock()
    mock_resp_200.status_code = 200
    mock_resp_200.json.return_value = {
        'id': 99999,
        'name': 'private-secret-repo',
        'full_name': 'private-org/private-secret-repo',
        'private': True,
        'html_url': 'https://github.com/private-org/private-secret-repo',
        'default_branch': 'main',
        'owner': {'login': 'private-org'}
    }
    with patch('requests.get', return_value=mock_resp_200):
        repo_data = GitHubService.get_repository('private-org', 'private-secret-repo')
        assert repo_data['visibility'] == 'private'
        assert repo_data['repository_name'] == 'private-secret-repo'


def test_token_never_exposed_in_api(client, app):
    """Verifies that GITHUB_TOKEN is never exposed in any API response payload."""
    secret_token = 'ghp_super_secret_test_token_never_expose_9876543210'
    with patch.object(app.config, 'get', side_effect=lambda k, default=None: secret_token if k == 'GITHUB_TOKEN' else default):
        # 1. Test repository listing
        res = client.get('/api/v1/repositories')
        assert secret_token not in res.data.decode('utf-8')

        # 2. Test repository error responses
        res_err = client.post('/api/v1/repositories/connect', json={'repository_url': 'invalid'})
        assert secret_token not in res_err.data.decode('utf-8')


@patch('services.github_service.GitHubService.get_commits')
@patch('services.github_service.GitHubService.get_pull_requests')
@patch('services.github_service.GitHubService.get_contributors')
def test_commit_pr_contributor_deduplication(mock_contribs, mock_prs, mock_commits, client, app):
    """Verifies that synchronizing identical commits, PRs, and contributors does not create duplicate database records."""
    with app.app_context():
        u_name = f"dedup-test-{uuid.uuid4().hex[:6]}"
        repo = GitHubRepository(
            owner="aureon-test",
            repository_name=u_name,
            repository_url=f"https://github.com/aureon-test/{u_name}",
            is_active=True
        )
        db.session.add(repo)
        db.session.commit()

        # Mock API returning the exact same commit, PR, and contributor
        mock_commits.return_value = [
            {'commit_sha': 'sha_dedup_001', 'author_name': 'Author A', 'commit_message': 'first commit', 'commit_date': datetime.now(timezone.utc).isoformat()}
        ]
        mock_prs.return_value = [
            {'github_pr_id': 1001, 'pr_number': 10, 'title': 'PR 10', 'author': 'Author B', 'state': 'open'}
        ]
        mock_contribs.return_value = [
            {'github_user_id': '888', 'username': 'dev_dedup', 'contributions': 5}
        ]

        # First sync
        res1 = client.post(f'/api/v1/repositories/{repo.id}/sync')
        assert res1.status_code == 200
        assert res1.json['new_commits_added'] == 1

        commits_c1 = GitHubCommit.query.filter_by(repository_id=repo.id).count()
        prs_c1 = GitHubPullRequest.query.filter_by(repository_id=repo.id).count()
        contribs_c1 = GitHubContributor.query.filter_by(repository_id=repo.id).count()

        # Second sync with identical data
        res2 = client.post(f'/api/v1/repositories/{repo.id}/sync')
        assert res2.status_code == 200
        assert res2.json['new_commits_added'] == 0  # No new commits added!

        commits_c2 = GitHubCommit.query.filter_by(repository_id=repo.id).count()
        prs_c2 = GitHubPullRequest.query.filter_by(repository_id=repo.id).count()
        contribs_c2 = GitHubContributor.query.filter_by(repository_id=repo.id).count()

        # Verify exact counts without duplicate records
        assert commits_c1 == commits_c2 == 1
        assert prs_c1 == prs_c2 == 1
        assert contribs_c1 == contribs_c2 == 1


def test_github_health_separate_from_project_health(app):
    """Verifies that repository health score from GitHubRiskService is strictly decoupled from Project.health_score."""
    with app.app_context():
        # 1. Project has its own health score
        proj = Project(name=f"Decoupled Test Project ({uuid.uuid4().hex[:6]})", health_score=95, is_active=True)
        db.session.add(proj)
        db.session.commit()

        # 2. Repository has a dormant commit history (35 days inactive)
        old_commit = {
            'commit_sha': 'dormant_sha_123',
            'commit_date': (datetime.now(timezone.utc) - timedelta(days=35)).isoformat()
        }
        repo_data = {'open_issues': 2, 'stars': 10}
        repo_eval = GitHubRiskService.evaluate_repository_risks(repo_data, [old_commit], [], [])

        # Repository health score takes inactivity deduction
        assert repo_eval['health_score'] <= 75
        assert repo_eval['health_status'] in ('WARNING', 'AT_RISK')

        # Project health score remains intact and separate at 95
        db_proj = Project.query.get(proj.id)
        assert db_proj.health_score == 95


