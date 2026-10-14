import sys
import uuid
from datetime import datetime, date
from app import app
from extensions import db
from models import (
    Project, User, Team, TeamMember, ProjectMember, Sprint, Task,
    GitHubRepository, GitHubCommit, GitHubContributor, Repository
)

def setup_thrift_project():
    with app.app_context():
        # 1. Check if THRIFT-IN-CAMPUS project already exists
        existing = Project.query.filter(Project.name.ilike('%Thrift%')).first()
        if existing:
            print(f"Project already exists: {existing.id} - {existing.name}")
            project = existing
        else:
            pm = User.query.filter_by(email='gopika@aureon.com').first()
            lead = User.query.filter_by(email='krish@aureon.com').first()
            
            project = Project(
                id=uuid.uuid4(),
                name='THRIFT-IN-CAMPUS',
                description='A modern, full-stack campus marketplace where college students buy and sell pre-owned gear, textbooks, hostel essentials, and electronics with NextAuth authentication, category filtering, and admin moderation.',
                status='IN_PROGRESS',
                priority='HIGH',
                health_score=96,
                start_date=date(2026, 9, 25),
                target_deadline=date(2026, 11, 15),
                manager_id=pm.id if pm else None,
                lead_id=lead.id if lead else None,
                is_active=True,
                is_deleted=False
            )
            db.session.add(project)
            db.session.flush()
            print(f"Created Project THRIFT-IN-CAMPUS with ID: {project.id}")

        # 2. Get Squad and Members
        team = Team.query.filter_by(name='Frontend UI Squad').first()
        sainu = User.query.filter_by(email='sainu@aureon.com').first()
        ram = User.query.filter_by(email='ram.kumar@aureon.com').first()
        venu = User.query.filter_by(email='venu.qa@aureon.com').first()
        lead = User.query.filter_by(email='krish@aureon.com').first()
        pm = User.query.filter_by(email='gopika@aureon.com').first()

        # Add Project Members
        for u, role_code in [
            (pm, 'PROJECT_MANAGER'),
            (lead, 'TEAM_LEAD'),
            (sainu, 'DEVELOPER'),
            (ram, 'DEVELOPER'),
            (venu, 'QA_ENGINEER')
        ]:
            if u and not ProjectMember.query.filter_by(project_id=project.id, user_id=u.id).first():
                pm_record = ProjectMember(
                    project_id=project.id,
                    user_id=u.id,
                    role_in_project=role_code,
                    is_active=True,
                    is_deleted=False
                )
                db.session.add(pm_record)
                print(f"Added ProjectMember: {u.full_name} as {role_code}")

        # 3. Create or Link GitHubRepository & Repository
        gh_repo = GitHubRepository.query.filter_by(project_id=project.id).first()
        if not gh_repo:
            gh_repo = GitHubRepository(
                id=uuid.uuid4(),
                project_id=project.id,
                owner='aureon-maker',
                repository_name='thrift-in-campus',
                repository_url='https://github.com/aureon-maker/thrift-in-campus',
                default_branch='main',
                description='A modern full-stack campus marketplace for college students to buy and sell pre-owned gear.',
                visibility='public',
                language='TypeScript',
                stars=1,
                forks=0,
                open_issues=0,
                is_active=True,
                last_synced_at=datetime.utcnow()
            )
            db.session.add(gh_repo)
            db.session.flush()
            print(f"Created GitHubRepository: {gh_repo.id}")

        repo_mirror = Repository.query.filter_by(project_id=project.id).first()
        if not repo_mirror:
            repo_mirror = Repository(
                id=gh_repo.id,
                project_id=project.id,
                name='thrift-in-campus',
                repository_name='thrift-in-campus',
                url='https://github.com/aureon-maker/thrift-in-campus',
                repository_url='https://github.com/aureon-maker/thrift-in-campus',
                provider='github',
                default_branch='main',
                status='CONNECTED',
                connection_status='ACTIVE',
                last_synced=datetime.utcnow()
            )
            db.session.add(repo_mirror)
            print("Created Repository mirror")

        # 4. Add authentic commits from aureon-maker/thrift-in-campus
        commits_data = [
            ('fd2f7706758b7d8e187666a609988055547543ca', 'Update README with live site link, repo url, and Render deployment instructions', '2026-09-25 09:37:22'),
            ('8fa69408ec816a92589c5db720a6375d10da1fd6', 'Update seed to force-update student password and add 1-click demo fill buttons', '2026-09-25 09:17:29'),
            ('9d4bef46781c1d337650173f626efbc473885b9d', 'Configure nodejs runtime and friendly auth error handling on login', '2026-09-25 09:13:59'),
            ('736cd59cc09f8d10406426f53a5c3de525bd4489', 'Fix UntrustedHost by adding trustHost: true and AUTH_TRUST_HOST', '2026-09-25 09:06:09'),
            ('04e72d174a588ab97baac88bfad229d2d24310d8', 'Enable autoDeployTrigger: commit in render.yaml', '2026-09-25 08:58:49'),
            ('eb5c029952a7f71986fbdf7a25f141707960b742', 'Optimize mobile performance, enhance image handling, and update dependencies', '2026-09-25 08:50:03'),
            ('eabf800681ac581a75caa838ed33c8b9fa45cae8', 'Fix AUTH_SECRET in render.yaml', '2026-09-25 00:49:09'),
            ('982916ce76056418e1b111657b5fd44233d67a6e', 'Update Render service name to thrift-in-campus', '2026-09-25 00:42:11'),
            ('9dacbdf6441c4603327aac05befb9082206de511', 'Configure Render deployment and fix Next.js production build', '2026-09-25 00:39:32'),
            ('f930ddbe395920a60a886b6e42a6885e92892388', 'Initial commit: Thrift in Campus marketplace with 25% dark theme, campus background, and Electric Cyan accents', '2026-09-25 00:29:04'),
        ]

        for sha, msg, dt_str in commits_data:
            if not GitHubCommit.query.filter_by(repository_id=gh_repo.id, commit_sha=sha).first():
                c_date = datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S')
                c = GitHubCommit(
                    repository_id=gh_repo.id,
                    github_commit_id=sha,
                    commit_sha=sha,
                    author_name='aureon-maker',
                    author_email='dev@aureon.com',
                    commit_message=msg,
                    commit_date=c_date,
                    commit_url=f"https://github.com/aureon-maker/thrift-in-campus/commit/{sha[:7]}"
                )
                db.session.add(c)
                print(f"Added GitHubCommit: {sha[:7]} - {msg[:40]}...")

        # Contributor
        if not GitHubContributor.query.filter_by(repository_id=gh_repo.id, username='aureon-maker').first():
            contrib = GitHubContributor(
                repository_id=gh_repo.id,
                username='aureon-maker',
                display_name='Aureon Maker',
                contributions=10,
                profile_url='https://github.com/aureon-maker'
            )
            db.session.add(contrib)
            print("Added Contributor aureon-maker")

        # 5. Create Sprint 1
        sprint = Sprint.query.filter_by(project_id=project.id, name='Sprint 1: Core Marketplace & Student Auth').first()
        if not sprint:
            sprint = Sprint(
                id=uuid.uuid4(),
                name='Sprint 1: Core Marketplace & Student Auth',
                goal='Deliver NextAuth campus student authentication, product catalog browsing with category filters, and seller product listing submission.',
                status='IN_PROGRESS',
                start_date=date(2026, 9, 25),
                end_date=date(2026, 10, 15),
                project_id=project.id,
                team_id=team.id if team else None,
                created_by_id=lead.id if lead else None
            )
            db.session.add(sprint)
            db.session.flush()
            print(f"Created Sprint 1 with ID: {sprint.id}")

        # 6. Create Sprint Tasks
        sprint_tasks = [
            {
                'title': 'Implement NextAuth Campus Student Authentication & JWT Session Flow',
                'desc': 'Configure NextAuth Credentials provider with bcrypt hash verification, secure cookie sessions, and friendly auth error handling on login/register endpoints.',
                'assigned_to': sainu,
                'status': 'IN_PROGRESS',
                'priority': 'HIGH',
                'estimated_hours': 16,
                'progress': 65,
                'due_date': date(2026, 10, 8),
                'sprint_id': sprint.id
            },
            {
                'title': 'Build Real-Time Campus Marketplace Browse & Category Filter Engine',
                'desc': 'Build responsive 2-column product grid with search query debounce, category pills, price range slider, and sort by latest/price in Next.js App Router.',
                'assigned_to': ram,
                'status': 'IN_PROGRESS',
                'priority': 'HIGH',
                'estimated_hours': 20,
                'progress': 50,
                'due_date': date(2026, 10, 10),
                'sprint_id': sprint.id
            },
            {
                'title': 'Build Multi-Image Dropzone & Product Listing Form with Condition Rating',
                'desc': 'Create sell page with image upload preview, condition picker (Brand New, Like New, Good, Fair), price validation, and college department selection.',
                'assigned_to': sainu,
                'status': 'TODO',
                'priority': 'MEDIUM',
                'estimated_hours': 14,
                'progress': 0,
                'due_date': date(2026, 10, 14),
                'sprint_id': sprint.id
            },
            {
                'title': 'Set up SQLite to PostgreSQL Prisma Migration and Render Blueprint Pipeline',
                'desc': 'Configure render.yaml blueprint with autoDeployTrigger, environment variable injection, database push and Prisma seed script execution.',
                'assigned_to': ram,
                'status': 'DONE',
                'priority': 'HIGH',
                'estimated_hours': 8,
                'progress': 100,
                'due_date': date(2026, 9, 28),
                'sprint_id': sprint.id
            }
        ]

        for st in sprint_tasks:
            existing_t = Task.query.filter_by(project_id=project.id, title=st['title']).first()
            if not existing_t:
                t = Task(
                    id=uuid.uuid4(),
                    title=st['title'],
                    description=st['desc'],
                    ticket_type='Task',
                    priority=st['priority'],
                    status=st['status'],
                    start_date=date(2026, 9, 25),
                    due_date=st['due_date'],
                    estimated_hours=st['estimated_hours'],
                    progress=st['progress'],
                    assigned_to_id=st['assigned_to'].id if st['assigned_to'] else None,
                    assigned_by_id=lead.id if lead else None,
                    created_by_id=pm.id if pm else None,
                    project_id=project.id,
                    team_id=team.id if team else None,
                    sprint_id=st['sprint_id']
                )
                db.session.add(t)
                assignee_name = st['assigned_to'].full_name if st['assigned_to'] else 'None'
                print(f"Created Sprint Task: {st['title']} -> {st['status']} (Assigned: {assignee_name})")

        # 7. Create Backlog Tasks (sprint_id=None)
        backlog_tasks = [
            {
                'title': 'Build Admin Listing Moderation Dashboard with Approval Workflow',
                'desc': 'Create admin moderation console to review pending student product listings, preview details and images, and approve or reject submissions.',
                'priority': 'HIGH',
                'estimated_hours': 18
            },
            {
                'title': 'Implement Student Seller My-Listings Management & Status Toggles',
                'desc': 'Allow students to view their posted listings, toggle availability (Available / Sold / Reserved), and update pricing or product descriptions.',
                'priority': 'MEDIUM',
                'estimated_hours': 12
            },
            {
                'title': 'Implement Mobile-First Touch Navigation with Floating Bottom Bar & Campus Dark Theme',
                'desc': 'Design floating bottom navigation bar for mobile viewports, campus night theme styling with 25% dark backdrop, and Framer Motion micro-interactions.',
                'priority': 'LOW',
                'estimated_hours': 10
            }
        ]

        for bt in backlog_tasks:
            existing_bt = Task.query.filter_by(project_id=project.id, title=bt['title']).first()
            if not existing_bt:
                t = Task(
                    id=uuid.uuid4(),
                    title=bt['title'],
                    description=bt['desc'],
                    ticket_type='Task',
                    priority=bt['priority'],
                    status='TODO',
                    start_date=None,
                    due_date=None,
                    estimated_hours=bt['estimated_hours'],
                    progress=0,
                    assigned_to_id=None,
                    assigned_by_id=None,
                    created_by_id=pm.id if pm else None,
                    project_id=project.id,
                    team_id=team.id if team else None,
                    sprint_id=None  # Explicitly in Backlog
                )
                db.session.add(t)
                print(f"Created Backlog Task: {bt['title']}")

        db.session.commit()
        print("ALL DATA COMMITTED SUCCESSFULLY!")

if __name__ == '__main__':
    setup_thrift_project()
