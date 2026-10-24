from flask_jwt_extended import create_access_token
from models import Project, User, Notification, ProjectMember

def test_get_projects_list(client):
    res = client.get('/api/v1/projects/')
    assert res.status_code in [200, 401, 403]

def test_project_model_dictionary(app):
    with app.app_context():
        proj = Project(name='Aureon Core Platform', description='Engineering Intelligence Platform')
        proj_dict = proj.to_dict()
        assert proj_dict['name'] == 'Aureon Core Platform'
        assert proj_dict['description'] == 'Engineering Intelligence Platform'

def test_create_project_and_notifications_for_lead_and_members(client, app):
    with app.app_context():
        pm = User.query.filter_by(email='gopika@aureon.com').first()
        if not pm:
            pm = User.query.filter(User.role_name == 'ROLE_PM').first()
        lead = User.query.filter_by(email='krish@aureon.com').first()
        if not lead:
            lead = User.query.filter(User.role_name == 'ROLE_LEAD').first()
        dev = User.query.filter_by(email='sainu@aureon.com').first()
        qa = User.query.filter_by(email='venu.qa@aureon.com').first()

        assert pm is not None, "PM user required"
        assert lead is not None, "Lead user required"

        token = create_access_token(identity=str(pm.id))
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

        member_ids = []
        if dev:
            member_ids.append(str(dev.id))
        if qa:
            member_ids.append({'id': str(qa.id), 'name': qa.display_name, 'email': qa.email})

        payload = {
            'name': 'E2E Automated Test Project',
            'description': 'Testing PM creation with full team allocation and notifications',
            'priority': 'HIGH',
            'status': 'IN_PROGRESS',
            'start_date': '2026-10-25',
            'target_deadline': '2026-12-31',
            'lead_id': str(lead.id),
            'member_ids': member_ids
        }

        res = client.post('/api/v1/projects/', json=payload, headers=headers)
        assert res.status_code == 201, f"Failed: {res.get_json()}"
        data = res.get_json()
        assert data['success'] is True
        proj_data = data['project']
        assert proj_data['name'] == 'E2E Automated Test Project'
        assert proj_data['lead_id'] == str(lead.id)

        # Verify Lead notification
        lead_notifs = Notification.query.filter_by(recipient_id=lead.id, notification_type='ASSIGNMENT').all()
        assert any('E2E Automated Test Project' in n.message for n in lead_notifs), "Team Lead notification not found"

        # Verify Team Member notifications
        if dev:
            dev_notifs = Notification.query.filter_by(recipient_id=dev.id, notification_type='ASSIGNMENT').all()
            assert any('E2E Automated Test Project' in n.message for n in dev_notifs), "Developer notification not found"

        if qa:
            qa_notifs = Notification.query.filter_by(recipient_id=qa.id, notification_type='ASSIGNMENT').all()
            assert any('E2E Automated Test Project' in n.message for n in qa_notifs), "QA notification not found"

        # Verify PM notification
        pm_notifs = Notification.query.filter_by(recipient_id=pm.id, notification_type='SYSTEM').all()
        assert any('E2E Automated Test Project' in n.message for n in pm_notifs), "PM confirmation notification not found"
