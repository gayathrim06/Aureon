import os
import sys
import pytest

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from extensions import db

@pytest.fixture(scope='session')
def app():
    app = create_app()
    app.config['TESTING'] = True
    yield app

@pytest.fixture(scope='session')
def client(app):
    return app.test_client()

@pytest.fixture(scope='session')
def db_session(app):
    with app.app_context():
        yield db
