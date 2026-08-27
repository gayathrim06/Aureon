def test_get_teams_list(client):
    res = client.get('/api/v1/teams/')
    assert res.status_code in [200, 401, 403]

def test_team_model_dictionary(app):
    from models import Team
    with app.app_context():
        team = Team(name='Backend Core Engineering', team_code='TEAM-BE-01')
        team_dict = team.to_dict()
        assert team_dict['name'] == 'Backend Core Engineering'
        assert team_dict['team_code'] == 'TEAM-BE-01'
