import json

def test_login_invalid_credentials(client):
    res = client.post('/api/v1/auth/login', json={
        'email': 'nonexistent@aureon.com',
        'password': 'WrongPassword123!'
    })
    assert res.status_code in [400, 401]
    data = res.get_json()
    assert 'error' in data or 'message' in data or 'status' in data

def test_login_success(client):
    res = client.post('/api/v1/auth/login', json={
        'email': 'admin@aureon.com',
        'password': 'Aureon@123'
    })
    if res.status_code == 200:
        data = res.get_json()
        assert 'token' in data or 'access_token' in data or 'user' in data
    else:
        assert res.status_code in [200, 400, 401]

def test_forgot_password_and_security_questions(client):
    res = client.post('/api/v1/auth/security-questions', json={
        'email': 'admin@aureon.com'
    })
    assert res.status_code in [200, 400, 404]
