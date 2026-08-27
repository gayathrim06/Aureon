def test_get_sprints_list(client):
    res = client.get('/api/v1/sprints/')
    assert res.status_code in [200, 401, 403]

def test_sprint_model_dictionary(app):
    from models import Sprint
    with app.app_context():
        sprint = Sprint(name='Sprint 1 - Initial Release', goal='Deliver Auth & Security MVP', status='ACTIVE')
        sprint_dict = sprint.to_dict()
        assert sprint_dict['name'] == 'Sprint 1 - Initial Release'
        assert sprint_dict['goal'] == 'Deliver Auth & Security MVP'
        assert sprint_dict['status'] == 'ACTIVE'
