from extensions import db
from models import Role, User, Project, Team, TeamMember
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

    # 2. Seed 20 Real Database Users (matching pgAdmin tbl_user table)
    twenty_postgres_users = [
        { 'email': 'admin@aureon.com', 'username': 'admin', 'full_name': 'GAYATHRI M', 'employee_id': 'EMP-001', 'role': 'ROLE_ADMIN', 'department': 'Executive Management', 'designation': 'CTO' },
        { 'email': 'krish@aureon.com', 'username': 'krish', 'full_name': 'Krishna Deepesh', 'employee_id': 'EMP-002', 'role': 'ROLE_LEAD', 'department': 'Quality Assurance', 'designation': 'Tech Lead' },
        { 'email': 'sainu@aureon.com', 'username': 'sainu', 'full_name': 'Sainu Anna Sajan', 'employee_id': 'EMP-003', 'role': 'ROLE_DEV', 'department': 'Engineering', 'designation': 'Frontend Developer' },
        { 'email': 'jiya@aureon.com', 'username': 'jiya', 'full_name': 'Jiya Thomas', 'employee_id': 'EMP-004', 'role': 'ROLE_DEV', 'department': 'Engineering', 'designation': 'Software Developer' },
        { 'email': 'eli@aureon.com', 'username': 'eli', 'full_name': 'Elizabeth Mathew', 'employee_id': 'EMP5856', 'role': 'ROLE_PM', 'department': 'Engineering', 'designation': 'Senior Technical Program Manager' },
        { 'email': 'rinta@aureon.com', 'username': 'rinta', 'full_name': 'Rinta Thomas', 'employee_id': 'EMP-006', 'role': 'ROLE_DEV', 'department': 'Engineering', 'designation': 'Full Stack Developer' },
        { 'email': 'elena_test_prov@aureon.com', 'username': 'elena_test_prov', 'full_name': 'Elena Rostova Provision Test', 'employee_id': 'EMP1246', 'role': 'ROLE_DEV', 'department': 'Engineering', 'designation': 'Full Stack Developer' },
        { 'email': 'feba@aureon.com', 'username': 'feba', 'full_name': 'Feba Biju', 'employee_id': 'EMP6268', 'role': 'ROLE_QA', 'department': 'Executive Office', 'designation': 'Executive Officer' },
        { 'email': 'bugcheck_user@aureon.com', 'username': 'bugcheck_user', 'full_name': 'Test User BugCheck', 'employee_id': 'EMP3180', 'role': 'ROLE_DEV', 'department': 'Engineering', 'designation': 'QA Tester' },
        { 'email': 'sarah.j@aureon.com', 'username': 'sarah', 'full_name': 'Sarah Jenkins', 'employee_id': 'EMP-010', 'role': 'ROLE_PM', 'department': 'Product Management', 'designation': 'Principal PM' },
        { 'email': 'david.c@aureon.com', 'username': 'david', 'full_name': 'David Chen', 'employee_id': 'EMP-011', 'role': 'ROLE_LEAD', 'department': 'Backend Architecture', 'designation': 'Lead Software Architect' },
        { 'email': 'ram.kumar@aureon.com', 'username': 'ram', 'full_name': 'Ram Kumar', 'employee_id': 'EMP-012', 'role': 'ROLE_DEV', 'department': 'Frontend UI', 'designation': 'Senior React Engineer' },
        { 'email': 'venu.qa@aureon.com', 'username': 'venu', 'full_name': 'Venu QA', 'employee_id': 'EMP-013', 'role': 'ROLE_QA', 'department': 'Quality Assurance', 'designation': 'Lead QA Automation Engineer' },
        { 'email': 'alex.r@aureon.com', 'username': 'alex', 'full_name': 'Alex Rivera', 'employee_id': 'EMP-014', 'role': 'ROLE_DEV', 'department': 'Infrastructure', 'designation': 'DevOps & Cloud Architect' },
        { 'email': 'priya.s@aureon.com', 'username': 'priya', 'full_name': 'Priya Sharma', 'employee_id': 'EMP-015', 'role': 'ROLE_DEV', 'department': 'Database & Analytics', 'designation': 'Data Engineer' },
        { 'email': 'michael.b@aureon.com', 'username': 'michael', 'full_name': 'Michael Brown', 'employee_id': 'EMP-016', 'role': 'ROLE_DEV', 'department': 'Security Engineering', 'designation': 'Cybersecurity Specialist' },
        { 'email': 'ananya.v@aureon.com', 'username': 'ananya', 'full_name': 'Ananya Varma', 'employee_id': 'EMP-017', 'role': 'ROLE_QA', 'department': 'Quality Assurance', 'designation': 'Test Automation Specialist' },
        { 'email': 'vikram.p@aureon.com', 'username': 'vikram', 'full_name': 'Vikram Patel', 'employee_id': 'EMP-018', 'role': 'ROLE_LEAD', 'department': 'Systems Architecture', 'designation': 'Principal Backend Engineer' },
        { 'email': 'deepak.n@aureon.com', 'username': 'deepak', 'full_name': 'Deepak Nair', 'employee_id': 'EMP-019', 'role': 'ROLE_PM', 'department': 'Operations & Agile', 'designation': 'Scrum Master' },
        { 'email': 'sneha.r@aureon.com', 'username': 'sneha', 'full_name': 'Sneha Roy', 'employee_id': 'EMP-020', 'role': 'ROLE_DEV', 'department': 'Mobile Development', 'designation': 'Flutter & iOS Engineer' },
        { 'email': 'gopika@aureon.com', 'username': 'gopika', 'full_name': 'Gopika Manoj', 'employee_id': 'EMP-021', 'role': 'ROLE_PM', 'department': 'Product Management', 'designation': 'Project Manager' }
    ]

    for u_data in twenty_postgres_users:
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
            existing_user.full_name = u_data['full_name']
            existing_user.employee_id = u_data['employee_id']
            existing_user.department = u_data['department']
            existing_user.designation = u_data['designation']
            existing_user.account_status = 'ACTIVE'
            existing_user.is_active = True
            existing_user.failed_login_attempts = 0
            existing_user.password = generate_password_hash('Aureon@123')

    # 3. Seed Baseline Projects (Empty by default)
    default_projects = []

    # 4. Seed Baseline Teams with designated Leads & Members
    krish = User.query.filter_by(email='krish@aureon.com').first()
    david = User.query.filter_by(email='david.c@aureon.com').first()
    vikram = User.query.filter_by(email='vikram.p@aureon.com').first()
    sainu = User.query.filter_by(email='sainu@aureon.com').first()
    ram = User.query.filter_by(email='ram.kumar@aureon.com').first()
    jiya = User.query.filter_by(email='jiya@aureon.com').first()
    priya = User.query.filter_by(email='priya.s@aureon.com').first()
    alex = User.query.filter_by(email='alex.r@aureon.com').first()
    michael = User.query.filter_by(email='michael.b@aureon.com').first()
    venu = User.query.filter_by(email='venu.qa@aureon.com').first()
    feba = User.query.filter_by(email='feba@aureon.com').first()
    ananya = User.query.filter_by(email='ananya.v@aureon.com').first()
    proj = Project.query.filter_by(name='Verona Organic').first()

    default_teams = [
        { 'name': 'Frontend UI Squad', 'description': 'User Experience', 'lead': krish, 'project': proj, 'members': [sainu, ram] },
        { 'name': 'Backend Data Engine', 'description': 'Database & Analytics', 'lead': david, 'project': proj, 'members': [jiya, priya] },
        { 'name': 'Core Infrastructure Guild', 'description': 'Engineering', 'lead': vikram, 'project': None, 'members': [alex, michael] },
        { 'name': 'QA & Compliance Automation', 'description': 'Quality Assurance', 'lead': None, 'project': proj, 'members': [venu, feba, ananya] }
    ]

    for t_data in default_teams:
        team = Team.query.filter_by(name=t_data['name']).first()
        if not team:
            team = Team(
                name=t_data['name'],
                description=t_data['description'],
                availability_status='ASSIGNED' if t_data['project'] else 'AVAILABLE',
                status='ACTIVE'
            )
            db.session.add(team)
            db.session.flush()

        if t_data['lead']:
            team.lead_id = t_data['lead'].id
            team.team_leader_id = t_data['lead'].id
        if t_data['project']:
            team.project_id = t_data['project'].id
            team.availability_status = 'ASSIGNED'

        # Ensure team members exist
        for m in t_data['members']:
            if m:
                existing_member = TeamMember.query.filter_by(team_id=team.id, user_id=m.id).first()
                if not existing_member:
                    db.session.add(TeamMember(team_id=team.id, user_id=m.id))

    db.session.commit()
    print("[DATABASE SEED] Successfully seeded 20 real PostgreSQL users, teams, and member allocations into Aureon database tables.")
