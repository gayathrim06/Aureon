import os
from datetime import timedelta

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def _resolve_database_uri():
    raw_url = os.getenv('DATABASE_URL')
    if raw_url:
        # SQLAlchemy 1.4+ / 2.0+ requires postgresql:// instead of deprecated postgres://
        if raw_url.startswith('postgres://'):
            return raw_url.replace('postgres://', 'postgresql://', 1)
        return raw_url

    # Fall back to constructed local PostgreSQL URI
    user = os.getenv('POSTGRES_USER', 'postgres')
    password = os.getenv('POSTGRES_PASSWORD', 'postgres')
    host = os.getenv('POSTGRES_HOST', 'localhost')
    port = os.getenv('POSTGRES_PORT', '5432')
    db = os.getenv('POSTGRES_DB', 'aureon_db')
    return f"postgresql://{user}:{password}@{host}:{port}/{db}"

class Config:
    # Environment Detection
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    IS_PRODUCTION = os.getenv('ENVIRONMENT', FLASK_ENV).lower() in ('production', 'prod', 'staging')

    # Security Keys
    SECRET_KEY = os.getenv('SECRET_KEY', 'aureon_enterprise_secret_key_super_secure_32bytes_2026_prod')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'aureon_jwt_secret_key_super_secure_32bytes_2026_prod')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # GitHub REST API Integration Configuration
    GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '').strip()
    GITHUB_API_URL = os.getenv('GITHUB_API_URL', 'https://api.github.com').rstrip('/')

    # Database Configuration: PostgreSQL default with SQLite fallback for instant local dev
    POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'postgres')
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
    POSTGRES_DB = os.getenv('POSTGRES_DB', 'aureon_db')

    # Construct PostgreSQL URI
    POSTGRES_URI = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    
    # Normalized Database URI (supports postgresql://, sqlite:///, and postgres:// normalization)
    SQLALCHEMY_DATABASE_URI = _resolve_database_uri()
    
    # Connection Pool Settings: Pre-ping prevents stale connection errors on serverless databases (Neon)
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    if not str(SQLALCHEMY_DATABASE_URI).startswith('sqlite:'):
        SQLALCHEMY_ENGINE_OPTIONS['pool_size'] = int(os.getenv('DB_POOL_SIZE', '5'))
        SQLALCHEMY_ENGINE_OPTIONS['max_overflow'] = int(os.getenv('DB_MAX_OVERFLOW', '2'))
        SQLALCHEMY_ENGINE_OPTIONS['pool_timeout'] = 30

    # Fallback URI for offline local development
    FALLBACK_SQLITE_URI = 'sqlite:///aureon_flask.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Allowed CORS Origins (comma-separated string from environment, with local dev fallbacks)
    _default_origins = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174'
    CORS_ALLOWED_ORIGINS = [
        origin.strip() for origin in os.getenv('CORS_ALLOWED_ORIGINS', _default_origins).split(',') if origin.strip()
    ]
