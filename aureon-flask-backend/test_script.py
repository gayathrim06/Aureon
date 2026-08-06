from app import app
from models import User
from flask_jwt_extended import create_access_token

with app.app_context():
    u = User.query.filter_by(email='admin@aureon.com').first()
    if u:
        print("FOUND USER:", u.to_dict())
        print("PASSWORD CHECK:", u.check_password('Aureon@123'))
        tok = create_access_token(identity=str(u.id))
        print("TOKEN:", tok)
    else:
        print("USER NOT FOUND")
