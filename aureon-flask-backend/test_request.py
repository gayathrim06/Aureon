from app import app

with app.test_client() as client:
    res = client.post('/api/v1/auth/login', json={'email': 'admin@aureon.com', 'password': 'Aureon@123'})
    print("STATUS:", res.status_code)
    print("DATA:", res.get_data(as_text=True))
