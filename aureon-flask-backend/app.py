from flask import Flask, jsonify
from config import Config
from extensions import db, jwt, cors
from seed import seed_database

# Import Blueprints
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.project_routes import project_bp
from routes.team_routes import team_bp
from routes.task_routes import task_bp
from routes.repository_routes import repository_bp
from routes.code_analysis_routes import code_analysis_bp
from routes.risk_routes import risk_bp
from routes.dashboard_routes import dashboard_bp
from routes.report_routes import report_bp
from routes.audit_routes import audit_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    jwt.init_app(app)

    # Attempt PostgreSQL database connection; fallback to local SQLite if PostgreSQL server is offline
    try:
        app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
        db.init_app(app)
        with app.app_context():
            db.engine.connect()
            print(f"Connected to Primary Database: {Config.SQLALCHEMY_DATABASE_URI.split('@')[-1] if '@' in Config.SQLALCHEMY_DATABASE_URI else Config.SQLALCHEMY_DATABASE_URI}")
    except Exception as e:
        print(f"PostgreSQL connection offline ({str(e)}). Using local SQLite fallback database...")
        app.config['SQLALCHEMY_DATABASE_URI'] = Config.FALLBACK_SQLITE_URI
        db.init_app(app)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(team_bp)
    app.register_blueprint(task_bp)
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
            'engine': 'Python Flask + SQLAlchemy ORM (Non-AI Rule Engine)'
        })

    # Seed Database on startup
    with app.app_context():
        seed_database()

    return app

app = create_app()

if __name__ == '__main__':
    print("[AUREON BACKEND] Starting Aureon Flask REST API Backend on http://127.0.0.1:8000 ...")
    app.run(host='0.0.0.0', port=8000, debug=True)
