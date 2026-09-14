from datetime import date, timedelta
from models import Task, Project, Team, TeamMember, Sprint, User, Notification, TaskStatusHistory, Role
from extensions import db

def test_get_tasks_list(client):
    res = client.get('/api/v1/tasks/')
    assert res.status_code in [200, 401, 403]

def test_task_model_dictionary(app):
    with app.app_context():
        task = Task(title='Implement OAuth SSO', status='TODO', priority='HIGH', due_date=date.today() + timedelta(days=3))
        task_dict = task.to_dict()
        assert task_dict['title'] == 'Implement OAuth SSO'
        assert task_dict['status'] == 'TODO'
        assert task_dict['priority'] == 'HIGH'
        assert 'is_overdue' in task_dict
        assert 'days_overdue' in task_dict
        assert 'delay_remark' in task_dict
        assert 'team_leader_review' in task_dict

def test_cross_team_assignment_rejected(client, app):
    with app.app_context():
        proj = Project.query.filter_by(is_active=True).first()
        t1 = Team.query.filter_by(name='Frontend UI Squad').first()
        t2 = Team.query.filter_by(name='Backend Data Engine').first()
        if not t1 or not t2:
            return

        # Developer belonging ONLY to t2 (e.g. Jiya)
        dev_jiya = User.query.filter_by(username='jiya').first()
        if not dev_jiya:
            return

        # Attempt to create a task in t1 assigned to dev_jiya
        payload = {
            'title': 'Test Cross Team Assignment',
            'project_id': str(proj.id) if proj else None,
            'team_id': str(t1.id),
            'assigned_to': str(dev_jiya.id),
            'due_date': (date.today() + timedelta(days=2)).isoformat()
        }
        res = client.post('/api/v1/tasks/', json=payload)
        assert res.status_code == 400
        data = res.get_json()
        assert 'cross-team' in data.get('message', '').lower()

def test_overdue_detection_and_notification(client, app):
    with app.app_context():
        proj = Project.query.filter_by(is_active=True).first()
        team = Team.query.filter_by(name='Frontend UI Squad').first()
        lead = User.query.filter_by(username='krish').first()
        dev = User.query.filter_by(username='sainu').first()
        if not team or not dev:
            return

        # Create an already overdue task (due 3 days ago)
        past_date = date.today() - timedelta(days=3)
        task = Task(
            title='Overdue API Bugfix',
            status='IN_PROGRESS',
            due_date=past_date,
            original_due_date=past_date,
            project_id=proj.id if proj else None,
            team_id=team.id,
            assigned_to_id=dev.id
        )
        db.session.add(task)
        db.session.commit()

        # Call GET /api/v1/tasks/ to trigger automatic overdue detection engine
        res = client.get('/api/v1/tasks/')
        assert res.status_code == 200

        db.session.refresh(task)
        assert task.is_overdue is True
        assert task.days_overdue >= 3
        assert task.overdue_notified_lead is True

        # Check notification was created for Team Lead
        if lead:
            notif = Notification.query.filter_by(recipient_id=lead.id, notification_type='TASK_OVERDUE').first()
            assert notif is not None
            assert 'Overdue' in notif.title

        # Check deduplication: calling tasks again should NOT recreate duplicate notification
        initial_notif_count = Notification.query.filter_by(recipient_id=lead.id, notification_type='TASK_OVERDUE').count() if lead else 0
        client.get('/api/v1/tasks/')
        new_notif_count = Notification.query.filter_by(recipient_id=lead.id, notification_type='TASK_OVERDUE').count() if lead else 0
        assert initial_notif_count == new_notif_count

def test_developer_delay_remark_and_tl_actions(client, app):
    with app.app_context():
        dev = User.query.filter_by(username='sainu').first()
        lead = User.query.filter_by(username='krish').first()
        team = Team.query.filter_by(name='Frontend UI Squad').first()
        if not dev or not team:
            return

        task = Task(
            title='Delay Remark Test Task',
            status='IN_PROGRESS',
            due_date=date.today() - timedelta(days=1),
            assigned_to_id=dev.id,
            team_id=team.id
        )
        db.session.add(task)
        db.session.commit()

        # 1. Developer submits delay remark
        remark_payload = {
            'reason': 'Technical issue',
            'remark': 'Awaiting third-party payment gateway mock server availability.'
        }
        res_rem = client.post(f'/api/v1/tasks/{task.id}/delay-remark', json=remark_payload)
        assert res_rem.status_code == 200
        db.session.refresh(task)
        assert task.delay_reason == 'Technical issue'
        assert 'payment gateway' in task.delay_remark

        # 2. Team Leader reviews the delay
        review_payload = {
            'review': 'Mock server scheduled for deploy tomorrow morning. Extension approved.'
        }
        res_rev = client.post(f'/api/v1/tasks/{task.id}/tl-review', json=review_payload)
        assert res_rev.status_code == 200
        db.session.refresh(task)
        assert 'Extension approved' in task.team_leader_review

        # 3. Team Leader extends due date with required justification
        new_due = date.today() + timedelta(days=3)
        due_payload = {
            'new_due_date': new_due.isoformat(),
            'reason': 'Approved 3-day extension due to external mock dependency.'
        }
        res_due = client.post(f'/api/v1/tasks/{task.id}/change-due-date', json=due_payload)
        assert res_due.status_code == 200
        db.session.refresh(task)
        assert task.due_date == new_due
        assert task.original_due_date == date.today() - timedelta(days=1)
        assert 'Approved 3-day extension' in task.due_date_change_reason

        # 4. Check audit history exists
        hist_res = client.get(f'/api/v1/tasks/{task.id}/history')
        assert hist_res.status_code == 200
        history_items = hist_res.get_json()['history']
        action_types = [h['action_type'] for h in history_items]
        assert 'DELAY_REMARK_ADDED' in action_types
        assert 'TL_REVIEW_ADDED' in action_types
        assert 'DUE_DATE_CHANGED' in action_types
