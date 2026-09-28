import pytest
from datetime import date, timedelta
from flask_jwt_extended import create_access_token
from models import User, Role, Project, Team, TeamMember, Sprint, Task
from extensions import db
from services.project_health_service import HealthCalculator

def get_headers_for_user(user):
    token = create_access_token(identity=str(user.id))
    return {'Authorization': f'Bearer {token}'}

def test_admin_full_visibility(client, app):
    with app.app_context():
        admin = User.query.filter_by(email='admin@aureon.com').first()
        if not admin:
            pytest.skip("Admin user not found")
        headers = get_headers_for_user(admin)

        # Admin gets all projects
        res = client.get('/api/v1/projects/', headers=headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data['success'] is True
        assert len(data['projects']) >= 1

        # Admin gets all teams
        res = client.get('/api/v1/teams/', headers=headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data['success'] is True
        assert len(data['teams']) >= 1

def test_developer_restricted_visibility(client, app):
    with app.app_context():
        dev_role = Role.query.filter_by(code='ROLE_DEV').first()
        dev = User.query.filter_by(role_id=dev_role.id).first() if dev_role else None
        if not dev:
            pytest.skip("Developer user not found")
        headers = get_headers_for_user(dev)

        # Developer /users/ sees ONLY self
        res = client.get('/api/v1/users/', headers=headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data['success'] is True
        assert data['count'] == 1
        assert data['users'][0]['id'] == str(dev.id)

        # Developer /tasks/ returns only tasks assigned to self
        res = client.get('/api/v1/tasks/', headers=headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data['success'] is True
        for t in data['tasks']:
            assert t.get('assignee_id') == str(dev.id) or t.get('assigned_to_id') == str(dev.id)

def test_developer_in_review_workflow_and_tl_approval(client, app):
    with app.app_context():
        # Setup: Project, Team, TL, Dev, Sprint, Task
        tl_role = Role.query.filter_by(code='ROLE_LEAD').first()
        dev_role = Role.query.filter_by(code='ROLE_DEV').first()
        
        tl = User.query.filter_by(role_id=tl_role.id).first() if tl_role else None
        dev = User.query.filter_by(role_id=dev_role.id).first() if dev_role else None
        if not tl or not dev:
            pytest.skip("TL or Dev not found")

        proj = Project.query.filter_by(is_active=True).first()
        team = Team.query.filter_by(is_deleted=False).first()
        if not proj or not team:
            pytest.skip("Project or Team not found")

        sprint = Sprint(
            name='Test Review Sprint',
            project_id=proj.id,
            team_id=team.id,
            status='ACTIVE',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=14)
        )
        db.session.add(sprint)
        db.session.flush()

        task = Task(
            title='Test Workflow Deliverable',
            project_id=proj.id,
            team_id=team.id,
            sprint_id=sprint.id,
            assigned_to_id=dev.id,
            status='IN_PROGRESS',
            due_date=date.today() + timedelta(days=5)
        )
        db.session.add(task)
        db.session.commit()

        dev_headers = get_headers_for_user(dev)
        tl_headers = get_headers_for_user(tl)

        # 1. Dev attempts to mark COMPLETED -> Auto-transitions to IN_REVIEW
        res = client.patch(f'/api/v1/tasks/{task.id}/status', json={'status': 'COMPLETED'}, headers=dev_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data['task']['status'] == 'IN_REVIEW'

        # 2. Team Lead approves deliverable -> Transitions to COMPLETED
        res = client.post(f'/api/v1/tasks/{task.id}/approve', json={'approval_notes': 'Verified test output'}, headers=tl_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data['task']['status'] == 'COMPLETED'
        assert 'approved' in (data['task'].get('team_leader_review') or '').lower()

        # Cleanup
        from models import TaskStatusHistory
        TaskStatusHistory.query.filter_by(task_id=task.id).delete()
        db.session.delete(task)
        db.session.delete(sprint)
        db.session.commit()

def test_developer_availability_endpoint(client, app):
    with app.app_context():
        team = Team.query.filter_by(is_deleted=False).first()
        if not team:
            pytest.skip("No team found")

        admin = User.query.filter_by(email='admin@aureon.com').first()
        headers = get_headers_for_user(admin)

        res = client.get(f'/api/v1/teams/{team.id}/developer-availability', headers=headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data['success'] is True
        assert 'developers' in data
        for d in data['developers']:
            assert 'active_tasks_count' in d
            assert 'ready_for_next_task' in d
            assert 'status' in d
            if d['active_tasks_count'] == 0:
                assert d['status'] == 'Available'
                assert d['ready_for_next_task'] is True
            else:
                assert 'Busy' in d['status']
                assert d['ready_for_next_task'] is False

def test_project_health_incorporates_sprint_scores(app):
    with app.app_context():
        proj = Project.query.filter_by(is_active=True).first()
        if not proj:
            pytest.skip("No active project found")

        sprint = Sprint.query.filter_by(project_id=proj.id).first()
        created_sprint = False
        if not sprint:
            sprint = Sprint(name='Health Test Sprint', project_id=proj.id, status='ACTIVE')
            db.session.add(sprint)
            db.session.flush()
            task = Task(title='Health Test Task', project_id=proj.id, sprint_id=sprint.id, status='COMPLETED')
            db.session.add(task)
            db.session.commit()
            created_sprint = True

        health = HealthCalculator.calculate_health_score(proj.id, explicit_request=False)
        assert 'overall_score' in health
        assert 'components' in health
        sprint_comp = health['components']['sprint_task']
        assert sprint_comp['available'] is True
        assert 'avg_sprint_score' in sprint_comp
        assert 'task_completion_rate' in sprint_comp

        if created_sprint:
            Task.query.filter_by(sprint_id=sprint.id).delete()
            db.session.delete(sprint)
            db.session.commit()
