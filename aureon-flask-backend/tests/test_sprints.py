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

        # Check sprint tasks endpoint
        res = client.get(f'/api/v1/sprints/{sprint.id}/tasks')
        assert res.status_code == 200
        tasks_data = res.get_json()
        assert tasks_data['count'] >= 2

        # Check dynamic sprint calculation
        s_dict = sprint.to_dict()
        assert s_dict['total_tasks'] == 2
        assert s_dict['completed_tasks'] == 1
        assert s_dict['completion_percentage'] == 50.0

        # Complete sprint: incomplete task t2 should be carried forward to product backlog
        comp_res = client.post(f'/api/v1/sprints/{sprint.id}/complete', json={'completion_notes': 'End of sprint cycle.'})
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
        rev_res = client.get(f'/api/v1/sprints/{sprint.id}/review')
        assert rev_res.status_code == 200
        rev_data = rev_res.get_json()['review']
        assert rev_data['completed_tasks_count'] == 1
        assert rev_data['incomplete_tasks_count'] == 1
