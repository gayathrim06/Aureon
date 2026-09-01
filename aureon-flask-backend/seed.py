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

    # 2. Seed Real PostgreSQL Database Users (matching pgAdmin tbl_user table)
    real_postgres_users = [
        { 'email': 'admin@aureon.com', 'username': 'admin', 'full_name': 'GAYATHRI M', 'employee_id': 'EMP-001', 'role': 'ROLE_ADMIN', 'department': 'Executive Management', 'designation': 'CTO' },
        { 'email': 'krish@aureon.com', 'username': 'krish', 'full_name': 'Krishna Deepesh', 'employee_id': 'EMP-002', 'role': 'ROLE_LEAD', 'department': 'Quality Assurance', 'designation': 'Tech Lead' },
        { 'email': 'sainu@aureon.com', 'username': 'sainu', 'full_name': 'Sainu Anna Sajan', 'employee_id': 'EMP-003', 'role': 'ROLE_DEV', 'department': 'Engineering', 'designation': 'Frontend Developer' },
        { 'email': 'jiya@aureon.com', 'username': 'jiya', 'full_name': 'Jiya Thomas', 'employee_id': 'EMP-004', 'role': 'ROLE_DEV', 'department': 'Engineering', 'designation': 'Software Developer' },
        { 'email': 'eli@aureon.com', 'username': 'eli', 'full_name': 'Elizabeth Mathew', 'employee_id': 'EMP5856', 'role': 'ROLE_PM', 'department': 'Engineering', 'designation': 'Senior Technical Program Manager' },
        { 'email': 'rinta@aureon.com', 'username': 'rinta', 'full_name': 'Rinta Thomas', 'employee_id': 'EMP-006', 'role': 'ROLE_DEV', 'department': 'Engineering', 'designation': 'Full Stack Developer' },
        { 'email': 'elena_test_prov@aureon.com', 'username': 'elena_test_prov', 'full_name': 'Elena Rostova Provision Test', 'employee_id': 'EMP1246', 'role': 'ROLE_DEV', 'department': 'Engineering', 'designation': 'Full Stack Developer' },
        { 'email': 'feba@aureon.com', 'username': 'feba', 'full_name': 'Feba Biju', 'employee_id': 'EMP6268', 'role': 'ROLE_QA', 'department': 'Executive Office', 'designation': 'Executive Officer' },
        { 'email': 'bugcheck_user@aureon.com', 'username': 'bugcheck_user', 'full_name': 'Test User BugCheck', 'employee_id': 'EMP3180', 'role': 'ROLE_DEV', 'department': 'Engineering', 'designation': 'QA Tester' }
    ]

    for u_data in real_postgres_users:
        existing_user = User.query.filter((User.email == u_data['email']) | (User.username == u_data['username'])).first()
        if not existing_user:
            u = User(
                email=u_data['email'],
                username=u_data['username'],
                full_name=u_data['full_name'],
                employee_id=u_data['employee_id'],
                password=generate_password_hash('Aureon@123'),
                department=u_data['department'],
                designation=u_data['designation'],
                role_id=role_objs[u_data['role']].id,
                account_status='ACTIVE',
                is_active=True
            )
            db.session.add(u)
        else:
            # Update fields if user exists
            existing_user.full_name = u_data['full_name']
            existing_user.employee_id = u_data['employee_id']
            existing_user.department = u_data['department']
            existing_user.designation = u_data['designation']

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
    print("[DATABASE SEED] Successfully seeded 9 real PostgreSQL users, 5 projects, 4 teams into Aureon database tables.")
