import os
from datetime import datetime, timezone
from flask import Flask, jsonify, request
from sqlalchemy import text
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
from routes.bug_routes import bug_bp
from routes.chat_routes import chat_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize CORS with explicit origin allowlist
    CORS(
        app,
        resources={r"/*": {"origins": Config.CORS_ALLOWED_ORIGINS}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-User-Id", "X-User-Email", "X-User-Role"],
        methods=["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"]
    )
    jwt.init_app(app)

    # Database Initialization & Connection Engine Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    if hasattr(Config, 'SQLALCHEMY_ENGINE_OPTIONS'):
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = Config.SQLALCHEMY_ENGINE_OPTIONS

    db.init_app(app)

    # Validate primary connection in local non-test environments (never printing credentials)
    if not app.config.get('TESTING') and not os.getenv('TESTING'):
        try:
            with app.app_context():
                db.engine.connect()
                if not Config.IS_PRODUCTION:
                    print(f"[AUREON DB] Connected to database: {Config.POSTGRES_DB}")
        except Exception as e:
            if not Config.IS_PRODUCTION:
                print(f"[AUREON DB] Primary database connection warning: {e}. Check PostgreSQL service.")
            else:
                app.logger.error("Primary database connection error on startup: %s", str(e))

    # Synchronize schema in development and testing; strictly disabled in production
    if not Config.IS_PRODUCTION:
        auto_sync = os.getenv('AUTO_SCHEMA_SYNC')
        should_sync = (
            auto_sync.lower() in ('true', '1', 'yes')
            if auto_sync is not None
            else True
        )

        if should_sync:
            from services.schema_sync import sync_db_schema
            with app.app_context():
                sync_db_schema()

    # Enforce strict JWT validation: expired, tampered, or invalid tokens must fail closed with 401
    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({'success': False, 'message': f'401 Unauthorized: Invalid or tampered token ({reason}).'}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'success': False, 'message': '401 Unauthorized: Token has expired. Please log in again.'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return jsonify({'success': False, 'message': f'401 Unauthorized: Authentication required ({reason}).'}), 401

    # Ensure CORS headers on every response and preflight OPTIONS request
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        if origin and (origin in Config.CORS_ALLOWED_ORIGINS or '*' in Config.CORS_ALLOWED_ORIGINS):
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,X-User-Id,X-User-Email,X-User-Role'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS,PATCH'
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
    app.register_blueprint(bug_bp)
    app.register_blueprint(chat_bp)

    @app.route('/')
    def root():
        return jsonify({
            'status': 'ONLINE',
            'platform': 'Aureon - Software Engineering Intelligence Platform Backend',
            'api_version': 'v1',
            'engine': 'Python Flask + SQLAlchemy ORM'
        })

    @app.route('/health', methods=['GET'])
    @app.route('/api/v1/health', methods=['GET'])
    def health():
        """
        Public health and readiness check endpoint.
        Checks process liveness and optionally verifies database connectivity via SELECT 1.
        Never exposes database hostnames, usernames, passwords, or internal stack traces.
        """
        status_data = {
            'status': 'HEALTHY',
            'service': 'aureon-api',
            'version': 'v1',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

        check_db = request.args.get('check_db', 'true').lower() in ('true', '1', 'yes')
        if check_db:
            try:
                db.session.execute(text('SELECT 1'))
                status_data['database'] = 'CONNECTED'
            except Exception as e:
                app.logger.error("Health check database ping failed: %s", str(e))
                status_data['status'] = 'DEGRADED'
                status_data['database'] = 'DISCONNECTED'
                return jsonify(status_data), 503

        return jsonify(status_data), 200

    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        seed_database()
    print("[AUREON BACKEND] Starting Aureon Flask REST API Backend on http://127.0.0.1:8000 ...")
    app.run(host='0.0.0.0', port=8000, debug=True)
