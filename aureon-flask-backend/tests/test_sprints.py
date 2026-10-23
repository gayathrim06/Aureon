from datetime import date, timedelta
from models import Project, Team, TeamMember, Sprint, Task, User, Role
from extensions import db

def test_get_sprints_list(client):
    res = client.get('/api/v1/sprints/')
    assert res.status_code in [200, 401, 403]

def test_sprint_model_dictionary(app):
    with app.app_context():
        sprint = Sprint(name='Sprint 1 - Initial Release', goal='Deliver Auth & Security MVP', status='ACTIVE')
        sprint_dict = sprint.to_dict()
        assert sprint_dict['name'] == 'Sprint 1 - Initial Release'
        assert sprint_dict['goal'] == 'Deliver Auth & Security MVP'
        assert sprint_dict['status'] == 'ACTIVE'
        assert 'total_tasks' in sprint_dict
        assert 'completion_percentage' in sprint_dict
        assert 'developer_distribution' in sprint_dict

def test_sprint_date_validation(client, app):
    with app.app_context():
        proj = Project.query.filter_by(is_active=True).first()
        team = Team.query.filter_by(is_deleted=False).first()
        if not proj or not team:
            return

        today = date.today()
        # Invalid date: end_date before start_date
        payload = {
            'name': 'Invalid Date Sprint',
            'project_id': str(proj.id),
            'team_id': str(team.id),
            'start_date': today.isoformat(),
            'end_date': (today - timedelta(days=5)).isoformat()
        }
        res = client.post('/api/v1/sprints/', json=payload)
        assert res.status_code == 400
        data = res.get_json()
        assert 'cannot be before start date' in data.get('message', '').lower()

def test_sprint_backlog_and_completion_carryforward(client, app):
    with app.app_context():
        proj = Project.query.filter_by(is_active=True).first()
        team = Team.query.filter_by(project_id=proj.id, is_deleted=False).first()
        if not team:
            team = Team.query.filter_by(is_deleted=False).first()
            team.project_id = proj.id
            db.session.commit()

        today = date.today()
        # Create a valid Sprint
        sprint = Sprint(
            name='Test Sprint E2E',
            goal='Test completion workflow',
            status='ACTIVE',
            start_date=today - timedelta(days=7),
            end_date=today + timedelta(days=7),
            project_id=proj.id,
            team_id=team.id
        )
        db.session.add(sprint)
        db.session.flush()

        # Create 2 tasks in this sprint: 1 completed, 1 incomplete
        t1 = Task(
            title='Completed Task 1',
            status='DONE',
            project_id=proj.id,
            team_id=team.id,
            sprint_id=sprint.id,
            due_date=today + timedelta(days=2)
        )
        t2 = Task(
            title='Incomplete Task 2',
            status='IN_PROGRESS',
            project_id=proj.id,
            team_id=team.id,
            sprint_id=sprint.id,
            due_date=today + timedelta(days=2)
        )
        db.session.add_all([t1, t2])
        db.session.commit()

        from flask_jwt_extended import create_access_token
        admin = User.query.filter_by(email='admin@aureon.com').first()
        admin_token = create_access_token(identity=str(admin.id))
        admin_headers = {'Authorization': f'Bearer {admin_token}'}

        # Check sprint tasks endpoint
        res = client.get(f'/api/v1/sprints/{sprint.id}/tasks', headers=admin_headers)
        assert res.status_code == 200
        tasks_data = res.get_json()
        assert tasks_data['count'] >= 2

        # Check dynamic sprint calculation
        s_dict = sprint.to_dict()
        assert s_dict['total_tasks'] == 2
        assert s_dict['completed_tasks'] == 1
        assert s_dict['completion_percentage'] == 50.0

        # Complete sprint: incomplete task t2 should be carried forward to product backlog
        comp_res = client.post(f'/api/v1/sprints/{sprint.id}/complete', json={'completion_notes': 'End of sprint cycle.'}, headers=admin_headers)
        assert comp_res.status_code == 200
        comp_data = comp_res.get_json()
        assert comp_data['carry_forward_tasks_count'] == 1

        db.session.refresh(t1)
        db.session.refresh(t2)
        db.session.refresh(sprint)

        assert sprint.status == 'COMPLETED'
        assert t1.status == 'DONE'
        assert str(t1.sprint_id) == str(sprint.id)
        # t2 carried forward to product backlog
        assert t2.sprint_id is None

        # Check sprint review endpoint
        rev_res = client.get(f'/api/v1/sprints/{sprint.id}/review', headers=admin_headers)
        assert rev_res.status_code == 200
        rev_data = rev_res.get_json()['review']
        assert rev_data['completed_tasks_count'] == 1
        assert rev_data['incomplete_tasks_count'] == 1


def test_sprint_story_points_calculation_and_capacity(client, app):
    """Verifies that planned, completed, and remaining story points calculate from actual tasks,
    and sprint capacity remains distinct without default hardcoded values."""
    with app.app_context():
        proj = Project.query.filter_by(is_active=True).first()
        team = Team.query.filter_by(is_deleted=False).first()
        today = date.today()

        # Sprint with configured capacity of 30 SP
        sprint = Sprint(
            name='Capacity & Points Test Sprint',
            goal='Test dynamic story points calculation',
            status='ACTIVE',
            start_date=today,
            end_date=today + timedelta(days=14),
            project_id=proj.id,
            team_id=team.id,
            velocity=30
        )
        db.session.add(sprint)
        db.session.flush()

        # Task 1: 8 hours (2 SP), DONE
        t1 = Task(
            title='Auth Handshake',
            status='DONE',
            estimated_hours=8.0,
            project_id=proj.id,
            team_id=team.id,
            sprint_id=sprint.id,
            due_date=today + timedelta(days=3)
        )
        # Task 2: 16 hours (4 SP), IN_PROGRESS
        t2 = Task(
            title='Data Pipeline',
            status='IN_PROGRESS',
            estimated_hours=16.0,
            project_id=proj.id,
            team_id=team.id,
            sprint_id=sprint.id,
            due_date=today + timedelta(days=5)
        )
        # Task 3: 6 hours (1.5 SP), TODO
        t3 = Task(
            title='Unit Tests',
            status='TODO',
            estimated_hours=6.0,
            project_id=proj.id,
            team_id=team.id,
            sprint_id=sprint.id,
            due_date=today + timedelta(days=7)
        )
        db.session.add_all([t1, t2, t3])
        db.session.commit()

        s_dict = sprint.to_dict()
        # Planned: 2 + 4 + 1.5 = 7.5 SP
        assert s_dict['planned_story_points'] == 7.5
        # Completed: 2 SP
        assert s_dict['completed_story_points'] == 2
        # Remaining: 5.5 SP
        assert s_dict['remaining_story_points'] == 5.5
        # Configured Capacity: 30 SP
        assert s_dict['capacity'] == 30
        assert s_dict['capacity_display'] == '30 SP'
        # Crucially: planned_story_points != capacity
        assert s_dict['planned_story_points'] != s_dict['capacity']


def test_empty_sprint_story_points_and_not_configured_capacity(app):
    """Verifies that an empty sprint with no tasks reports 0 story points and 'Not configured' capacity."""
    with app.app_context():
        proj = Project.query.filter_by(is_active=True).first()
        today = date.today()

        empty_sprint = Sprint(
            name='Empty Backlog Sprint',
            goal='No tasks allocated yet',
            status='PLANNED',
            start_date=today,
            end_date=today + timedelta(days=14),
            project_id=proj.id,
            velocity=None  # Not configured
        )
        db.session.add(empty_sprint)
        db.session.commit()

        s_dict = empty_sprint.to_dict()
        assert s_dict['total_tasks'] == 0
        assert s_dict['planned_story_points'] == 0
        assert s_dict['completed_story_points'] == 0
        assert s_dict['remaining_story_points'] == 0
        assert s_dict['capacity'] is None
        assert s_dict['capacity_display'] == 'Not configured'


def test_project_isolation_story_points(app):
    """Verifies that tasks belonging to Project A do not leak into Project B's sprint."""
    with app.app_context():
        projects = Project.query.filter_by(is_active=True).limit(2).all()
        if len(projects) < 2:
            return
        p1, p2 = projects[0], projects[1]
        today = date.today()

        sprint1 = Sprint(name='P1 Sprint', project_id=p1.id, start_date=today, end_date=today + timedelta(days=7))
        sprint2 = Sprint(name='P2 Sprint', project_id=p2.id, start_date=today, end_date=today + timedelta(days=7))
        db.session.add_all([sprint1, sprint2])
        db.session.flush()

        t_p1 = Task(title='P1 Task', estimated_hours=12.0, project_id=p1.id, sprint_id=sprint1.id, status='DONE')
        t_p2 = Task(title='P2 Task', estimated_hours=20.0, project_id=p2.id, sprint_id=sprint2.id, status='TODO')
        db.session.add_all([t_p1, t_p2])
        db.session.commit()

        d1 = sprint1.to_dict()
        d2 = sprint2.to_dict()

        # Sprint 1 has 12h = 3 SP (100% completed)
        assert d1['planned_story_points'] == 3
        assert d1['completed_story_points'] == 3
        assert d1['remaining_story_points'] == 0

        # Sprint 2 has 20h = 5 SP (0 completed)
        assert d2['planned_story_points'] == 5
        assert d2['completed_story_points'] == 0
        assert d2['remaining_story_points'] == 5

        # Strict isolation: points are non-identical and strictly isolated
        assert d1['planned_story_points'] != d2['planned_story_points']
