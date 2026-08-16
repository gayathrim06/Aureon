from datetime import datetime, date, timedelta
from extensions import db
from models import (
    Role, Permission, RolePermission, User, Project, ProjectMember,
    Team, TeamMember, Task, TaskStatusHistory, Repository, RepositoryBranch,
    Commit, CodeAnalysis, CodeAnalysisIssue, CodeMetrics, RiskRule, Risk,
    Report, Notification, AuditLog
)

def seed_database():
    """Seed initial PostgreSQL/SQLite database tables with normalized records."""
    db.create_all()

    # 1. Seed Roles
    roles = ['ROLE_ADMIN', 'ROLE_PM', 'ROLE_LEAD', 'ROLE_DEV', 'ROLE_QA']
    for r_name in roles:
        if not Role.query.filter_by(name=r_name).first():
            db.session.add(Role(name=r_name, description=f"System Role: {r_name}"))
    db.session.commit()

    # 2. Seed Users
    seed_users_data = [
        {
            'email': 'admin@aureon.com',
            'full_name': 'Gayathri',
            'role_name': 'ROLE_ADMIN',
            'designation': 'System Administrator & CTO',
            'department': 'Executive Office'
        },
        {
            'email': 'manager@aureon.com',
            'full_name': 'Sarah Jenkins',
            'role_name': 'ROLE_PM',
            'designation': 'Senior Product Manager',
            'department': 'Product Delivery'
        },
        {
            'email': 'lead@aureon.com',
            'full_name': 'David Chen',
            'role_name': 'ROLE_LEAD',
            'designation': 'Tech Lead - Core Backend',
            'department': 'Engineering'
        },
        {
            'email': 'ram.dev@aureon.com',
            'full_name': 'Ram Kumar',
            'role_name': 'ROLE_DEV',
            'designation': 'Full Stack Developer',
            'department': 'Engineering'
        },
        {
            'email': 'venu.qa@aureon.com',
            'full_name': 'Venu QA',
            'role_name': 'ROLE_QA',
            'designation': 'Senior QA Automation Engineer',
            'department': 'Quality Assurance'
        }
    ]

    for u_data in seed_users_data:
        if not User.query.filter_by(email=u_data['email']).first():
            user = User(
                email=u_data['email'],
                full_name=u_data['full_name'],
                role_name=u_data['role_name'],
                designation=u_data['designation'],
                department=u_data['department'],
                status='ACTIVE'
            )
            user.set_password('Aureon@123')
            db.session.add(user)
    db.session.commit()

    # 3. Seed Projects
    admin_user = User.query.filter_by(email='admin@aureon.com').first()
    pm_user = User.query.filter_by(email='manager@aureon.com').first()
    lead_user = User.query.filter_by(email='lead@aureon.com').first()
    dev_user = User.query.filter_by(email='ram.dev@aureon.com').first()

    projects_data = [
        {
            'name': 'Aureon Core Engine',
            'code': 'ACE',
            'description': 'Enterprise Software Engineering Intelligence Platform Core Engine',
            'priority': 'HIGH',
            'health_score': 88,
            'start_date': date.today() - timedelta(days=60),
            'due_date': date.today() + timedelta(days=90)
        },
        {
            'name': 'Cloud Infrastructure Gateway',
            'code': 'CIG',
            'description': 'High-throughput microservices API gateway and authentication router',
            'priority': 'CRITICAL',
            'health_score': 74,
            'start_date': date.today() - timedelta(days=45),
            'due_date': date.today() - timedelta(days=5) # Overdue project triggering risk rule
        }
    ]

    for p_data in projects_data:
        if not Project.query.filter_by(code=p_data['code']).first():
            project = Project(
                name=p_data['name'],
                code=p_data['code'],
                description=p_data['description'],
                priority=p_data['priority'],
                health_score=p_data['health_score'],
                start_date=p_data['start_date'],
                due_date=p_data['due_date'],
                manager_id=pm_user.id if pm_user else 2,
                status='IN_PROGRESS'
            )
            db.session.add(project)
    db.session.commit()

    # 4. Seed Teams & Tasks
    p1 = Project.query.first()
    if p1 and not Team.query.filter_by(project_id=p1.id).first():
        team = Team(
            name='Core Backend Guild',
            project_id=p1.id,
            lead_id=lead_user.id if lead_user else 3,
            department='Engineering'
        )
        db.session.add(team)
        db.session.flush()

        tasks_data = [
            {
                'title': 'Implement JWT Session Revocation Endpoint',
                'description': 'Add token blacklist and database session invalidation endpoint.',
                'priority': 'HIGH',
                'status': 'COMPLETED',
                'due_date': date.today() - timedelta(days=2)
            },
            {
                'title': 'Integrate Pylint & Radon Static Code Scanners',
                'description': 'Run non-AI AST static analysis and measure maintainability index.',
                'priority': 'CRITICAL',
                'status': 'IN_PROGRESS',
                'due_date': date.today() + timedelta(days=7)
            },
            {
                'title': 'Refactor PostgreSQL ORM Database Schemas',
                'description': 'Ensure proper foreign keys and index constraints across 21 normalized tables.',
                'priority': 'MEDIUM',
                'status': 'IN_PROGRESS',
                'due_date': date.today() - timedelta(days=3) # Overdue task for Rule Engine
            }
        ]

        for t_data in tasks_data:
            task = Task(
                title=t_data['title'],
                description=t_data['description'],
                project_id=p1.id,
                team_id=team.id,
                assigned_to_id=dev_user.id if dev_user else 4,
                created_by_id=lead_user.id if lead_user else 3,
                priority=t_data['priority'],
                status=t_data['status'],
                due_date=t_data['due_date']
            )
            db.session.add(task)
        db.session.commit()

    # 5. Seed Repositories & Commits
    if p1 and not Repository.query.filter_by(project_id=p1.id).first():
        repo = Repository(
            project_id=p1.id,
            name='aureon-backend',
            url='https://github.com/gayathrim06/Aureon',
            owner='gayathrim06',
            default_branch='main',
            connection_status='CONNECTED'
        )
        db.session.add(repo)
        db.session.flush()

        commits_data = [
            {'hash': 'a9cecb4f8d', 'author': 'Gayathri', 'message': 'Update admin name to Gayathri, fix profile management and browser history', 'added': 2060, 'removed': 1437},
            {'hash': '48343b9e12', 'author': 'David Chen', 'message': 'Refactor Flask REST API blueprints and PostgreSQL ORM mappings', 'added': 412, 'removed': 89},
            {'hash': '7c211a90b4', 'author': 'Ram Kumar', 'message': 'Connect React frontend components to backend REST endpoints', 'added': 185, 'removed': 42}
        ]

        for c_data in commits_data:
            c = Commit(
                repository_id=repo.id,
                commit_hash=c_data['hash'],
                author_name=c_data['author'],
                author_email=f"{c_data['author'].lower().replace(' ', '.')}@aureon.com",
                message=c_data['message'],
                branch='main',
                lines_added=c_data['added'],
                lines_removed=c_data['removed']
            )
            db.session.add(c)
        db.session.commit()

    # 6. Seed Static Code Analysis Results
    repo = Repository.query.first()
    if repo and not CodeAnalysis.query.filter_by(repository_id=repo.id).first():
        analysis = CodeAnalysis(
            repository_id=repo.id,
            commit_hash='a9cecb4f8d',
            tool_name='PYLINT_RADON',
            status='PASSED',
            quality_score=8.7
        )
        db.session.add(analysis)
        db.session.flush()

        metrics = CodeMetrics(
            analysis_id=analysis.id,
            file_path='app/services/risk_engine.py',
            cyclomatic_complexity=6,
            complexity_rank='A',
            loc=145,
            maintainability_index=82.4
        )
        db.session.add(metrics)

        issue = CodeAnalysisIssue(
            analysis_id=analysis.id,
            file_path='app/services/risk_engine.py',
            line_number=42,
            issue_type='CONVENTION',
            message_id='C0116',
            description='Missing function or method docstring',
            severity='LOW'
        )
        db.session.add(issue)
        db.session.commit()

    # 7. Seed Initial Audit Logs
    if not AuditLog.query.first():
        log = AuditLog(
            user_email='admin@aureon.com',
            role_name='ROLE_ADMIN',
            action='SYSTEM_INITIALIZED',
            details='PostgreSQL database schema and initial roles seeded successfully.'
        )
        db.session.add(log)
        db.session.commit()
