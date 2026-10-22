import pytest
from flask_jwt_extended import create_access_token
from models import User, Project, Team, TeamMember, Task, Sprint, Role
from extensions import db
from services.task_recommendation_service import TaskRecommendationService
from datetime import date, timedelta
import uuid

@pytest.fixture
def test_setup(app):
    with app.app_context():
        # Clean tasks for test stability
        Task.query.delete()
        db.session.commit()

        proj = Project.query.filter_by(name='FinPulse Core Banking').first()
        if not proj:
            proj = Project(name='FinPulse Core Banking', status='ACTIVE', is_active=True)
            db.session.add(proj)
            db.session.commit()

        team = Team.query.filter_by(name='Backend Data Engine').first()
        if not team:
            team = Team(name='Backend Data Engine', status='ACTIVE', project_id=proj.id)
            db.session.add(team)
            db.session.commit()

        lead = User.query.filter_by(username='david').first()
        dev_jiya = User.query.filter_by(username='jiya').first()
        dev_priya = User.query.filter_by(username='priya').first()
        pm_gopika = User.query.filter_by(username='gopika').first()
        dev_sainu = User.query.filter_by(username='sainu').first()

        # Set specific test skills
        dev_jiya.skills = 'Python, Flask, SQL, REST APIs'
        dev_jiya.max_concurrent_tasks = 3
        dev_jiya.capacity_hours = 40.0
        dev_jiya.is_active = True
        dev_jiya.account_status = 'ACTIVE'

        dev_priya.skills = 'Python, PostgreSQL, Redis, Docker'
        dev_priya.max_concurrent_tasks = 3
        dev_priya.capacity_hours = 40.0
        dev_priya.is_active = True
        dev_priya.account_status = 'ACTIVE'

        # Ensure project assignments
        proj.manager_id = pm_gopika.id if pm_gopika else None
        proj.lead_id = lead.id if lead else None
        team.lead_id = lead.id if lead else None
        team.team_leader_id = lead.id if lead else None
        team.project_id = proj.id

        # Ensure team memberships
        for u in [dev_jiya, dev_priya]:
            if not TeamMember.query.filter_by(team_id=team.id, user_id=u.id).first():
                db.session.add(TeamMember(team_id=team.id, user_id=u.id))

        db.session.commit()

        yield {
            'project': proj,
            'team': team,
            'lead': lead,
            'pm': pm_gopika,
            'jiya': dev_jiya,
            'priya': dev_priya,
            'sainu': dev_sainu
        }


# 1. Developer matching all required skills with capacity -> recommended as primary candidate
def test_case_1_developer_matching_all_required_skills_with_capacity(client, app, test_setup):
    with app.app_context():
        t = test_setup
        task = Task(
            title='Implement Flask REST APIs',
            project_id=t['project'].id,
            team_id=t['team'].id,
            required_skills='Python, Flask, REST APIs',
            estimated_hours=8.0,
            status='TODO'
        )
        db.session.add(task)
        db.session.commit()

        res = TaskRecommendationService.recommend_candidates(task.id, requesting_user=t['lead'])
        assert res['status'] == 'RECOMMENDED'
        assert len(res['candidates']) > 0
        top = res['candidates'][0]
        assert top['user_id'] == str(t['jiya'].id)
        assert top['skill_coverage'] == 1.0  # 100% matched
        assert set(top['matched_skills']) == {'Python', 'Flask', 'REST APIs'}


# 2. Developer missing required skills -> lower ranked or excluded
def test_case_2_developer_missing_required_skills(client, app, test_setup):
    with app.app_context():
        t = test_setup
        task = Task(
            title='Setup Redis Caching Layer',
            project_id=t['project'].id,
            team_id=t['team'].id,
            required_skills='Redis, Docker, PostgreSQL',
            estimated_hours=6.0,
            status='TODO'
        )
        db.session.add(task)
        db.session.commit()

        res = TaskRecommendationService.recommend_candidates(task.id, requesting_user=t['lead'])
        assert res['status'] == 'RECOMMENDED'
        # Priya has Redis, Docker, PostgreSQL (100%), Jiya has none (0%) -> Jiya should be excluded under zero-match rule
        priya_c = next((c for c in res['candidates'] if c['user_id'] == str(t['priya'].id)), None)
        jiya_c = next((c for c in res['candidates'] if c['user_id'] == str(t['jiya'].id)), None)
        assert priya_c is not None
        assert priya_c['skill_coverage'] == 1.0
        assert jiya_c is None  # Excluded due to 0% skill match


# 3. Inactive developer -> excluded
def test_case_3_inactive_developer_excluded(client, app, test_setup):
    with app.app_context():
        t = test_setup
        t['jiya'].is_active = False
        db.session.commit()

        task = Task(
            title='Python Task for Active Users',
            project_id=t['project'].id,
            team_id=t['team'].id,
            required_skills='Python',
            estimated_hours=4.0,
            status='TODO'
        )
        db.session.add(task)
        db.session.commit()

        res = TaskRecommendationService.recommend_candidates(task.id, requesting_user=t['lead'])
        jiya_candidate = next((c for c in res['candidates'] if c['user_id'] == str(t['jiya'].id)), None)
        assert jiya_candidate is None

        # Restore
        t['jiya'].is_active = True
        db.session.commit()


# 4. Developer outside authorized project/team -> excluded
def test_case_4_developer_outside_authorized_project_or_team_excluded(client, app, test_setup):
    with app.app_context():
        t = test_setup
        # Sainu is in Frontend UI Squad, not Backend Data Engine
        task = Task(
            title='Backend Data Pipeline Task',
            project_id=t['project'].id,
            team_id=t['team'].id,
            required_skills='Python',
            estimated_hours=4.0,
            status='TODO'
        )
        db.session.add(task)
        db.session.commit()

        res = TaskRecommendationService.recommend_candidates(task.id, requesting_user=t['lead'])
        sainu_candidate = next((c for c in res['candidates'] if c['user_id'] == str(t['sainu'].id)), None)
        assert sainu_candidate is None


# 5. Developer with active tasks but remaining capacity -> remains eligible
def test_case_5_developer_with_active_tasks_but_remaining_capacity_eligible(client, app, test_setup):
    with app.app_context():
        t = test_setup
        # Jiya already has 1 active task (capacity is 3)
        existing_task = Task(
            title='Existing Active Task',
            project_id=t['project'].id,
            team_id=t['team'].id,
            assigned_to_id=t['jiya'].id,
            estimated_hours=8.0,
            status='IN_PROGRESS'
        )
        db.session.add(existing_task)

        new_task = Task(
            title='Second Task for Jiya',
            project_id=t['project'].id,
            team_id=t['team'].id,
            required_skills='Python, SQL',
            estimated_hours=6.0,
            status='TODO'
        )
        db.session.add(new_task)
        db.session.commit()

        res = TaskRecommendationService.recommend_candidates(new_task.id, requesting_user=t['lead'])
        jiya_c = next((c for c in res['candidates'] if c['user_id'] == str(t['jiya'].id)), None)
        assert jiya_c is not None
        assert jiya_c['active_task_count'] == 1
        assert jiya_c['is_available'] is True


# 6. Developer exceeding capacity -> excluded with CAPACITY_EXCEEDED reason
def test_case_6_developer_exceeding_capacity_excluded(client, app, test_setup):
    with app.app_context():
        t = test_setup
        # Create 3 active tasks for Jiya (max_concurrent_tasks = 3)
        for i in range(3):
            db.session.add(Task(
                title=f'Heavy Task {i+1}',
                project_id=t['project'].id,
                team_id=t['team'].id,
                assigned_to_id=t['jiya'].id,
                estimated_hours=10.0,
                status='IN_PROGRESS'
            ))

        new_task = Task(
            title='Overload Task',
            project_id=t['project'].id,
            team_id=t['team'].id,
            required_skills='Python',
            estimated_hours=8.0,
            status='TODO'
        )
        db.session.add(new_task)
        db.session.commit()

        res = TaskRecommendationService.recommend_candidates(new_task.id, requesting_user=t['lead'])
        jiya_c = next((c for c in res['candidates'] if c['user_id'] == str(t['jiya'].id)), None)
        assert jiya_c is None
        excluded = next((e for e in res['excluded_candidates'] if e['user_id'] == str(t['jiya'].id)), None)
        assert 'capacity' in excluded['reason'].lower()


# 7. Multiple candidates with varying matches and loads -> ranked deterministically
def test_case_7_multiple_candidates_ranked_deterministically(client, app, test_setup):
    with app.app_context():
        t = test_setup
        # Priya has 1 active task, Jiya has 0 active tasks.
        # Task requires Python, PostgreSQL, Redis (Priya has 100% skill match, Jiya has 33% match)
        # Even though Jiya has lower load, Priya's superior skill match (60% weight) ensures Priya is #1
        existing_task = Task(
            title='Priya existing load',
            project_id=t['project'].id,
            team_id=t['team'].id,
            assigned_to_id=t['priya'].id,
            estimated_hours=8.0,
            status='IN_PROGRESS'
        )
        db.session.add(existing_task)

        task = Task(
            title='Database Migration and Redis Integration',
            project_id=t['project'].id,
            team_id=t['team'].id,
            required_skills='Python, PostgreSQL, Redis',
            estimated_hours=6.0,
            status='TODO'
        )
        db.session.add(task)
        db.session.commit()

        res = TaskRecommendationService.recommend_candidates(task.id, requesting_user=t['lead'])
        assert res['status'] == 'RECOMMENDED'
        assert res['candidates'][0]['user_id'] == str(t['priya'].id)
        assert res['candidates'][0]['suitability_score'] > res['candidates'][1]['suitability_score']


# 8. No eligible developers -> returns NO_ELIGIBLE_CANDIDATE
def test_case_8_no_eligible_developers_returns_no_candidate_status(client, app, test_setup):
    with app.app_context():
        t = test_setup
        task = Task(
            title='Rare Assembly & Rust Kernel Task',
            project_id=t['project'].id,
            team_id=t['team'].id,
            required_skills='Rust, Assembly, CUDA, WebAssembly',
            estimated_hours=12.0,
            status='TODO'
        )
        db.session.add(task)
        db.session.commit()

        res = TaskRecommendationService.recommend_candidates(task.id, requesting_user=t['lead'])
        assert res['status'] == 'NO_ELIGIBLE_CANDIDATE'
        assert len(res['candidates']) == 0
        assert len(res['excluded_candidates']) > 0


# 9. Missing skill or capacity information -> graceful defaults applied
def test_case_9_missing_skill_or_capacity_information_graceful_defaults(client, app, test_setup):
    with app.app_context():
        t = test_setup
        # Blank developer skills and capacity
        t['jiya'].skills = None
        t['jiya'].max_concurrent_tasks = None
        t['jiya'].capacity_hours = None
        db.session.commit()

        task = Task(
            title='Unspecified Skills Task',
            project_id=t['project'].id,
            team_id=t['team'].id,
            required_skills=None,
            estimated_hours=4.0,
            status='TODO'
        )
        db.session.add(task)
        db.session.commit()

        # Should execute safely without NoneType or division by zero exceptions
        res = TaskRecommendationService.recommend_candidates(task.id, requesting_user=t['lead'])
        assert res['status'] == 'RECOMMENDED'
        assert len(res['candidates']) > 0


# 10. Backlog vs Sprint task -> works seamlessly for both
def test_case_10_backlog_vs_sprint_task_scoping(client, app, test_setup):
    with app.app_context():
        t = test_setup
        # Backlog task without sprint_id
        backlog_task = Task(
            title='Product Backlog Future Architecture',
            project_id=t['project'].id,
            team_id=t['team'].id,
            sprint_id=None,
            required_skills='Python, PostgreSQL',
            estimated_hours=6.0,
            status='BACKLOG'
        )
        db.session.add(backlog_task)

        # Sprint task with active sprint
        sprint = Sprint(
            name='Sprint 1 - Fintech',
            project_id=t['project'].id,
            team_id=t['team'].id,
            status='ACTIVE'
        )
        db.session.add(sprint)
        db.session.flush()

        sprint_task = Task(
            title='Sprint Deliverable Feature',
            project_id=t['project'].id,
            team_id=t['team'].id,
            sprint_id=sprint.id,
            required_skills='Python, PostgreSQL',
            estimated_hours=6.0,
            status='TODO'
        )
        db.session.add(sprint_task)
        db.session.commit()

        res_backlog = TaskRecommendationService.recommend_candidates(backlog_task.id, requesting_user=t['lead'])
        res_sprint = TaskRecommendationService.recommend_candidates(sprint_task.id, requesting_user=t['lead'])

        assert res_backlog['status'] == 'RECOMMENDED'
        assert res_sprint['status'] == 'RECOMMENDED'


# 11. Developer becoming ineligible between recommendation and confirmation (409 Conflict)
def test_case_11_developer_becoming_ineligible_between_recommendation_and_confirmation(client, app, test_setup):
    with app.app_context():
        t = test_setup
        task = Task(
            title='Time Sensitive Task',
            project_id=t['project'].id,
            team_id=t['team'].id,
            required_skills='Python, SQL',
            estimated_hours=8.0,
            status='TODO'
        )
        db.session.add(task)
        db.session.commit()

        # Jiya was recommended initially
        res = TaskRecommendationService.recommend_candidates(task.id, requesting_user=t['lead'])
        assert res['status'] == 'RECOMMENDED'

        # Before confirmation, Jiya's account becomes inactive or filled with tasks
        t['jiya'].is_active = False
        db.session.commit()

        # Confirmation must fail with conflict / ineligible
        confirm_res, status_code = TaskRecommendationService.confirm_assignment(
            task_id=task.id,
            selected_developer_id=t['jiya'].id,
            confirming_user=t['lead'],
            recommendation_score=85
        )
        assert status_code == 409
        assert 'INELIGIBLE_CANDIDATE' in confirm_res['error']


# 12. Concurrent assignment safety / atomic check
def test_case_12_concurrent_assignment_safety_and_revalidation(client, app, test_setup):
    with app.app_context():
        t = test_setup
        t['jiya'].is_active = True
        t['jiya'].max_concurrent_tasks = 1
        db.session.commit()

        task1 = Task(
            title='Concurrent Task A',
            project_id=t['project'].id,
            team_id=t['team'].id,
            required_skills='Python',
            status='TODO'
        )
        task2 = Task(
            title='Concurrent Task B',
            project_id=t['project'].id,
            team_id=t['team'].id,
            required_skills='Python',
            status='TODO'
        )
        db.session.add_all([task1, task2])
        db.session.commit()

        # First assignment succeeds
        res1, code1 = TaskRecommendationService.confirm_assignment(task1.id, t['jiya'].id, t['lead'], 80)
        assert code1 == 200

        # Second assignment immediately hits capacity limit (revalidation catches it atomically)
        res2, code2 = TaskRecommendationService.confirm_assignment(task2.id, t['jiya'].id, t['lead'], 80)
        assert code2 == 409
        assert 'CAPACITY_EXCEEDED' in res2['error']


# 13. Unauthorized task assignment -> 401/403
def test_case_13_unauthorized_task_assignment(client, app, test_setup):
    with app.app_context():
        t = test_setup
        task = Task(title='Secured Task', project_id=t['project'].id, status='TODO')
        db.session.add(task)
        db.session.commit()

        # No token
        res = client.post(f'/api/v1/tasks/{task.id}/confirm-assignment', json={'developer_id': str(t['jiya'].id)})
        assert res.status_code in [401, 403]


# 14. Developer attempting to assign tasks to another developer -> 403 Forbidden
def test_case_14_developer_attempting_to_assign_tasks_rejected(client, app, test_setup):
    with app.app_context():
        t = test_setup
        task = Task(title='Developer Assigned Task', project_id=t['project'].id, team_id=t['team'].id, status='TODO')
        db.session.add(task)
        db.session.commit()

        dev_token = create_access_token(identity=str(t['jiya'].id))
        res = client.post(
            f'/api/v1/tasks/{task.id}/confirm-assignment',
            json={'developer_id': str(t['priya'].id)},
            headers={'Authorization': f'Bearer {dev_token}'}
        )
        assert res.status_code == 403
        data = res.get_json()
        assert 'Unauthorized' in data.get('error', '') or 'Unauthorized' in data.get('message', '')


# 15. PM attempting assignment outside assigned project -> 403 Forbidden
def test_case_15_pm_attempting_assignment_outside_assigned_project_rejected(client, app, test_setup):
    with app.app_context():
        t = test_setup
        # Create unassigned project where PM is not manager
        other_proj = Project(name='Unassigned Project Secret', status='ACTIVE', is_active=True, manager_id=uuid.uuid4())
        db.session.add(other_proj)
        db.session.commit()

        task = Task(title='Secret Project Task', project_id=other_proj.id, status='TODO')
        db.session.add(task)
        db.session.commit()

        pm_token = create_access_token(identity=str(t['pm'].id))
        res = client.post(
            f'/api/v1/tasks/{task.id}/confirm-assignment',
            json={'developer_id': str(t['jiya'].id)},
            headers={'Authorization': f'Bearer {pm_token}'}
        )
        assert res.status_code == 403


# 16. Team Lead attempting assignment outside authorized squad -> 403 Forbidden
def test_case_16_team_lead_attempting_assignment_outside_authorized_squad_rejected(client, app, test_setup):
    with app.app_context():
        t = test_setup
        # Create another squad where David is NOT the lead
        other_team = Team(name='Foreign Rogue Squad', status='ACTIVE', project_id=t['project'].id, lead_id=uuid.uuid4())
        db.session.add(other_team)
        db.session.commit()

        task = Task(title='Foreign Squad Task', project_id=t['project'].id, team_id=other_team.id, status='TODO')
        db.session.add(task)
        db.session.commit()

        lead_token = create_access_token(identity=str(t['lead'].id))
        res = client.post(
            f'/api/v1/tasks/{task.id}/confirm-assignment',
            json={'developer_id': str(t['jiya'].id)},
            headers={'Authorization': f'Bearer {lead_token}'}
        )
        assert res.status_code == 403
