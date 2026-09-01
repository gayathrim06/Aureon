from extensions import db
from models import Role, User, Project, Team
from werkzeug.security import generate_password_hash
import uuid

def seed_database():
    db.create_all()

    # 1. Seed System Roles
    roles = {
        'ROLE_ADMIN': 'System Admin',
        'ROLE_PM': 'Project Manager',
        'ROLE_LEAD': 'Team Lead',
        'ROLE_DEV': 'Developer',
        'ROLE_QA': 'QA Auditor'
    }

    role_objs = {}
    for code, name in roles.items():
        r = Role.query.filter_by(code=code).first()
        if not r:
            r = Role(code=code, name=name, description=f"System Role: {name}")
            db.session.add(r)
            db.session.commit()
        role_objs[code] = r

    # 2. Seed Baseline Users
    default_users = [
        { 'email': 'admin@aureon.com', 'username': 'admin_gayathri', 'full_name': 'Gayathri M', 'role': 'ROLE_ADMIN', 'department': 'Engineering', 'designation': 'System Administrator' },
        { 'email': 'manager@aureon.com', 'username': 'sarah_pm', 'full_name': 'Sarah Jenkins', 'role': 'ROLE_PM', 'department': 'Product Management', 'designation': 'Senior Project Manager' },
        { 'email': 'lead@aureon.com', 'username': 'david_lead', 'full_name': 'David Chen', 'role': 'ROLE_LEAD', 'department': 'Backend Architecture', 'designation': 'Tech Lead' },
        { 'email': 'ram.dev@aureon.com', 'username': 'ram_dev', 'full_name': 'Ram Kumar', 'role': 'ROLE_DEV', 'department': 'Frontend UI', 'designation': 'Senior Developer' },
        { 'email': 'venu.qa@aureon.com', 'username': 'venu_qa', 'full_name': 'Venu QA', 'role': 'ROLE_QA', 'department': 'Quality Assurance', 'designation': 'QA Engineer' },
        { 'email': 'elena.r@aureon.com', 'username': 'elena_dev', 'full_name': 'Elena Rostova', 'role': 'ROLE_DEV', 'department': 'DevOps & CI/CD', 'designation': 'DevOps Engineer' },
        { 'email': 'michael.b@aureon.com', 'username': 'michael_dev', 'full_name': 'Michael Brown', 'role': 'ROLE_DEV', 'department': 'Security & Auth', 'designation': 'Security Specialist' }
    ]

    for u_data in default_users:
        if not User.query.filter_by(email=u_data['email']).first():
            u = User(
                email=u_data['email'],
                username=u_data['username'],
                full_name=u_data['full_name'],
                password=generate_password_hash('Aureon@123'),
                department=u_data['department'],
                designation=u_data['designation'],
                role_id=role_objs[u_data['role']].id,
                account_status='ACTIVE',
                is_active=True
            )
            db.session.add(u)

    # 3. Seed Baseline Projects
    default_projects = [
        { 'code': 'PROJ-101', 'name': 'Aureon Core API Gateway', 'status': 'IN_PROGRESS', 'priority': 'HIGH', 'health_score': 96 },
        { 'code': 'PROJ-102', 'name': 'Cloud Telemetry Mesh', 'status': 'IN_PROGRESS', 'priority': 'HIGH', 'health_score': 89 },
        { 'code': 'PROJ-103', 'name': 'Enterprise Auth & OAuth2', 'status': 'COMPLETED', 'priority': 'MEDIUM', 'health_score': 98 },
        { 'code': 'PROJ-104', 'name': 'SonarQube Vulnerability Scanner', 'status': 'IN_PROGRESS', 'priority': 'HIGH', 'health_score': 94 },
        { 'code': 'PROJ-105', 'name': 'Executive PDF/CSV Reports Engine', 'status': 'COMPLETED', 'priority': 'LOW', 'health_score': 95 }
    ]

    for p_data in default_projects:
        if not Project.query.filter_by(code=p_data['code']).first():
            p = Project(
                code=p_data['code'],
                name=p_data['name'],
                status=p_data['status'],
                priority=p_data['priority'],
                health_score=p_data['health_score'],
                is_active=True
            )
            db.session.add(p)

    # 4. Seed Baseline Teams
    default_teams = [
        { 'name': 'Core Infrastructure Guild', 'department': 'Engineering' },
        { 'name': 'Frontend UI Squad', 'department': 'User Experience' },
        { 'name': 'Backend Data Engine', 'department': 'Database & Analytics' },
        { 'name': 'QA & Compliance Automation', 'department': 'Quality Assurance' }
    ]

    for t_data in default_teams:
        if not Team.query.filter_by(name=t_data['name']).first():
            t = Team(
                name=t_data['name'],
                department=t_data['department'],
                availability_status='AVAILABLE'
            )
            db.session.add(t)

    db.session.commit()
    print("[DATABASE SEED] Seeded 7 baseline users, 5 projects, 4 teams into Aureon database.")
