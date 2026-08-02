import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'aureon_enterprise_secret_key_super_secure_32bytes_2026_prod')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'aureon_jwt_secret_key_super_secure_32bytes_2026_prod')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # Database Configuration: PostgreSQL default with SQLite fallback for instant local dev
    POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'postgres')
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
    POSTGRES_DB = os.getenv('POSTGRES_DB', 'aureon_db')

    # Construct PostgreSQL URI
    POSTGRES_URI = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    
    # Use PostgreSQL if DATABASE_URL or POSTGRES_ENABLED set, else use SQLite fallback for zero-dependency local run
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', POSTGRES_URI)
    
    # Enable fallback to SQLite if PostgreSQL connection fails during init
    FALLBACK_SQLITE_URI = 'sqlite:///aureon_flask.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
