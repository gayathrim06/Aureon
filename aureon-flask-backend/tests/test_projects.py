def test_get_projects_list(client):
    res = client.get('/api/v1/projects/')
    assert res.status_code in [200, 401, 403]

def test_project_model_dictionary(app):
    from models import Project
    with app.app_context():
        proj = Project(name='Aureon Core Platform', description='Engineering Intelligence Platform')
        proj_dict = proj.to_dict()
        assert proj_dict['name'] == 'Aureon Core Platform'
        assert proj_dict['description'] == 'Engineering Intelligence Platform'
