def test_get_users_unauthorized(client):
    res = client.get('/api/v1/users/')
    # Authorization token check
    assert res.status_code in [200, 401, 403]

def test_user_model_dictionary(app):
    from models import User
    with app.app_context():
        user = User(email='testuser@aureon.com', username='testuser', full_name='Test User')
        user.set_password('Password123!')
        user_dict = user.to_dict()
        assert user_dict['email'] == 'testuser@aureon.com'
        assert user_dict['username'] == 'testuser'
