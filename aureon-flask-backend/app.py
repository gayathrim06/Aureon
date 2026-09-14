from flask import Flask, jsonify, request
from config import Config
from extensions import db, jwt, cors
from seed import seed_database
from flask_cors import CORS

# Import Blueprints
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.project_routes import project_bp, pm_bp
from routes.team_routes import team_bp, team_lead_bp
from routes.task_routes import task_bp, developer_bp
from routes.repository_routes import repository_bp
from routes.code_analysis_routes import code_analysis_bp
from routes.risk_routes import risk_bp
from routes.dashboard_routes import dashboard_bp
from routes.report_routes import report_bp
from routes.audit_routes import audit_bp
from routes.sprint_routes import sprint_bp
from routes.notification_routes import notification_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable global CORS for all origins and routes
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    jwt.init_app(app)

    # Attempt PostgreSQL database connection; fallback to local SQLite if PostgreSQL server is offline
    try:
        app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
        db.init_app(app)
        with app.app_context():
            db.engine.connect()
            print(f"Connected to Primary Database: {Config.SQLALCHEMY_DATABASE_URI.split('@')[-1] if '@' in Config.SQLALCHEMY_DATABASE_URI else Config.SQLALCHEMY_DATABASE_URI}")
    except Exception as e:
        db.init_app(app)

    # Automatically synchronize schema across PostgreSQL and SQLite
    from services.schema_sync import sync_db_schema
    with app.app_context():
        sync_db_schema()

    # Sanitize invalid/mock Authorization headers before Flask-JWT processing
    @app.before_request
    def sanitize_auth_header():
        auth = request.headers.get('Authorization')
        if auth and auth.startswith('Bearer '):
            token = auth.split(' ', 1)[1].strip()
            parts = token.split('.')
            if len(parts) != 3 or not token.startswith('ey'):
                if 'HTTP_AUTHORIZATION' in request.environ:
                    del request.environ['HTTP_AUTHORIZATION']

    # Ensure CORS headers on every response and preflight OPTIONS request
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
        return response

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(pm_bp)
    app.register_blueprint(team_bp)
    app.register_blueprint(team_lead_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(developer_bp)
    app.register_blueprint(sprint_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(repository_bp)
    app.register_blueprint(code_analysis_bp)
    app.register_blueprint(risk_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(audit_bp)

    @app.route('/')
    def root():
        return jsonify({
            'status': 'ONLINE',
            'platform': 'Aureon - Software Engineering Intelligence Platform Backend',
            'api_version': 'v1',
            'engine': 'Python Flask + SQLAlchemy ORM'
        })

    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        seed_database()
    print("[AUREON BACKEND] Starting Aureon Flask REST API Backend on http://127.0.0.1:8000 ...")
    app.run(host='0.0.0.0', port=8000, debug=True)
