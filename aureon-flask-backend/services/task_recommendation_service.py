import uuid
from datetime import datetime
from extensions import db
from models import (
    User, Task, Project, Team, TeamMember, ProjectMember, Sprint,
    TaskStatusHistory, AuditLog, Notification, Role
)
from services.rbac_service import get_user_scope

class TaskRecommendationService:
    """
    Deterministic, Skill-Based and Capacity-Based Task Recommendation Service.
    Strictly Non-AI. Evaluates:
    - User account activity and role permissions
    - Project and Team boundary constraints (strictly preventing cross-project / cross-team leaks)
    - Required skill match coverage vs developer skills
    - Current active workload count and estimated hours capacity
    - Explainable suitability scoring formula
    - Safe two-phase recommendation and confirmation workflow
    """

    DEFAULT_MAX_CONCURRENT_TASKS = 3
    DEFAULT_CAPACITY_HOURS = 40.0

    ACTIVE_TASK_STATUSES = ('TODO', 'IN_PROGRESS', 'CODE_REVIEW', 'REVIEW', 'IN_REVIEW', 'TESTING', 'BLOCKED')
    COMPLETED_TASK_STATUSES = ('COMPLETED', 'DONE', 'CLOSED', 'CANCELLED')

    @classmethod
    def normalize_skills(cls, skills_input):
        """Normalizes skills from string, comma-separated list, or array into a list of clean strings."""
        if not skills_input:
            return []
        if isinstance(skills_input, (list, tuple, set)):
            return [str(s).strip() for s in skills_input if str(s).strip()]
        if isinstance(skills_input, str):
            raw = skills_input.strip()
            if raw.startswith('['):
                import json
                try:
                    parsed = json.loads(raw)
                    return [str(s).strip() for s in parsed if str(s).strip()]
                except Exception:
                    pass
            return [s.strip() for s in raw.split(',') if s.strip()]
        return []

    @classmethod
    def get_candidate_pool(cls, project_id=None, team_id=None, sprint_id=None, caller_user=None):
        """
        Determines the strictly authorized candidate pool of developers based on
        project/team boundaries and caller permissions.
        """
        candidates = []
        seen_user_ids = set()

        # If team_id is provided, candidate pool is strictly restricted to that team
        if team_id:
            team = Team.query.get(team_id)
            if team:
                # Add team members
                members = TeamMember.query.filter_by(team_id=team.id).all()
                for m in members:
                    u = m.user or User.query.get(m.user_id)
                    if u and u.id not in seen_user_ids:
                        seen_user_ids.add(u.id)
                        candidates.append(u)
                # If team leader is a developer, consider them
                leader = team.leader or (User.query.get(team.team_leader_id) if team.team_leader_id else None)
                if leader and leader.id not in seen_user_ids:
                    seen_user_ids.add(leader.id)
                    candidates.append(leader)
            return candidates

        # If sprint_id is provided, check if sprint has a team
        if sprint_id:
            sprint = Sprint.query.get(sprint_id)
            if sprint and sprint.team_id:
                return cls.get_candidate_pool(project_id=sprint.project_id, team_id=sprint.team_id, caller_user=caller_user)
            if sprint and sprint.project_id:
                project_id = sprint.project_id

        # If project_id is provided, candidates are members of the project or its teams
        if project_id:
            # 1. Project direct members
            p_members = ProjectMember.query.filter_by(project_id=project_id, is_active=True).all()
            for pm in p_members:
                u = User.query.get(pm.user_id)
                if u and u.id not in seen_user_ids:
                    seen_user_ids.add(u.id)
                    candidates.append(u)

            # 2. Members of squads/teams assigned to this project
            teams = Team.query.filter_by(project_id=project_id, is_active=True).all()
            for t in teams:
                for tm in TeamMember.query.filter_by(team_id=t.id).all():
                    u = tm.user or User.query.get(tm.user_id)
                    if u and u.id not in seen_user_ids:
                        seen_user_ids.add(u.id)
                        candidates.append(u)

        return candidates

    @classmethod
    def evaluate_developer_eligibility(cls, developer, required_skills=None, new_task_hours=4.0):
        """
        Runs rigorous pre-ranking eligibility checks:
        1. Account status active
        2. Role check (developer or contributor, not admin/pm pure oversight)
        3. Active tasks capacity limit
        4. Skill match requirement (must possess at least 1 required skill if required_skills is non-empty)
        """
        # Check 1: User Account Active
        if not developer.is_active or developer.account_status != 'ACTIVE':
            return False, "User account is inactive or deactivated", {}

        # Check 2: Role check
        role_code = (developer.role_name or '').upper()
        if role_code in ('ROLE_ADMIN', 'ADMIN'):
            return False, "System Administrator cannot be assigned development tasks", {}
        if role_code in ('ROLE_PM', 'PROJECT_MANAGER', 'PM'):
            return False, "Project Manager cannot be assigned development tasks", {}

        # Check 3: Active Task Capacity
        active_tasks = Task.query.filter(
            Task.assigned_to_id == developer.id,
            ~Task.status.in_(cls.COMPLETED_TASK_STATUSES)
        ).all()
        active_count = len(active_tasks)
        max_tasks = developer.max_concurrent_tasks or cls.DEFAULT_MAX_CONCURRENT_TASKS

        if active_count >= max_tasks:
            return False, f"At maximum concurrent tasks capacity ({active_count}/{max_tasks} active tasks)", {
                'active_tasks_count': active_count,
                'max_concurrent_tasks': max_tasks
            }

        # Check 4: Capacity Hours
        active_hours = sum(float(t.estimated_hours or 0.0) for t in active_tasks)
        max_hours = developer.capacity_hours or cls.DEFAULT_CAPACITY_HOURS
        task_hours = float(new_task_hours or 4.0)

        # Check 5: Skill Matching
        dev_skills = developer.skills_list
        dev_skills_set = {s.strip().lower() for s in dev_skills}
        req_skills = cls.normalize_skills(required_skills)

        matched_skills = []
        missing_skills = []

        if req_skills:
            for req in req_skills:
                if req.strip().lower() in dev_skills_set:
                    matched_skills.append(req)
                else:
                    missing_skills.append(req)

            if len(matched_skills) == 0:
                return False, f"Missing all required skills (Requires: {', '.join(req_skills)})", {
                    'matched_skills': [],
                    'missing_skills': missing_skills,
                    'active_tasks_count': active_count,
                    'max_concurrent_tasks': max_tasks
                }

        metrics = {
            'active_tasks_count': active_count,
            'max_concurrent_tasks': max_tasks,
            'remaining_task_capacity': max(0, max_tasks - active_count),
            'active_hours': round(active_hours, 1),
            'capacity_hours': max_hours,
            'remaining_hours': max(0.0, round(max_hours - active_hours, 1)),
            'matched_skills': matched_skills,
            'missing_skills': missing_skills,
            'developer_skills': dev_skills
        }

        return True, "Eligible", metrics

    @classmethod
    def calculate_suitability_score(cls, metrics, required_skills_count):
        """
        Deterministic, Explainable Scoring Formula (0-100):
        Score = round(60 * SkillCoverage + 25 * TaskCapacityRatio + 15 * HoursCapacityRatio)
        """
        matched_count = len(metrics.get('matched_skills', []))
        if required_skills_count > 0:
            skill_coverage = matched_count / float(required_skills_count)
        else:
            skill_coverage = 1.0  # Full coverage if no specific skill required

        skill_coverage = min(1.0, max(0.0, skill_coverage))

        max_tasks = metrics.get('max_concurrent_tasks', cls.DEFAULT_MAX_CONCURRENT_TASKS)
        active_count = metrics.get('active_tasks_count', 0)
        task_capacity_ratio = max(0.0, (max_tasks - active_count) / float(max_tasks))

        capacity_hours = metrics.get('capacity_hours', cls.DEFAULT_CAPACITY_HOURS)
        active_hours = metrics.get('active_hours', 0.0)
        hours_capacity_ratio = max(0.0, min(1.0, (capacity_hours - active_hours) / float(capacity_hours)))

        skill_score = 60.0 * skill_coverage
        task_cap_score = 25.0 * task_capacity_ratio
        hours_cap_score = 15.0 * hours_capacity_ratio

        total_score = round(skill_score + task_cap_score + hours_cap_score)
        total_score = max(0, min(100, total_score))

        breakdown = {
            'skill_coverage_score': round(skill_score, 1),
            'task_capacity_score': round(task_cap_score, 1),
            'hours_capacity_score': round(hours_cap_score, 1),
            'formula': 'round(60 * SkillCoverage + 25 * TaskCapacityRatio + 15 * HoursCapacityRatio)'
        }

        return total_score, breakdown, skill_coverage

    @classmethod
    def recommend_candidates(cls, project_id=None, team_id=None, sprint_id=None, required_skills=None, estimated_hours=4.0, caller_user=None, **kwargs):
        """
        Returns ranked recommendations, alternative eligible candidates, and excluded candidates
        with full explainability details.
        """
        caller_user = caller_user or kwargs.get('requesting_user')
        task_obj = None
        if kwargs.get('task_id'):
            task_obj = Task.query.get(kwargs.get('task_id'))
        elif project_id and not team_id and not required_skills:
            task_obj = Task.query.get(project_id)
        if task_obj:
            res, _ = cls.recommend_for_task(task_obj.id, caller_user=caller_user)
            return res

        req_skills_list = cls.normalize_skills(required_skills)
        candidate_pool = cls.get_candidate_pool(project_id=project_id, team_id=team_id, sprint_id=sprint_id, caller_user=caller_user)

        eligible_candidates = []
        excluded_candidates = []

        for dev in candidate_pool:
            is_eligible, reason, metrics = cls.evaluate_developer_eligibility(
                developer=dev,
                required_skills=req_skills_list,
                new_task_hours=estimated_hours
            )

            if not is_eligible:
                excluded_candidates.append({
                    'id': str(dev.id),
                    'user_id': str(dev.id),
                    'developer_id': str(dev.id),
                    'name': dev.display_name,
                    'email': dev.email,
                    'designation': dev.designation or 'Software Engineer',
                    'role': dev.role_name,
                    'reason': reason,
                    'skills': dev.skills_list,
                    'active_tasks_count': metrics.get('active_tasks_count', 0),
                    'max_concurrent_tasks': metrics.get('max_concurrent_tasks', cls.DEFAULT_MAX_CONCURRENT_TASKS)
                })
                continue

            score, breakdown, coverage = cls.calculate_suitability_score(metrics, len(req_skills_list))

            # Explainable justification string
            matched_str = ', '.join(metrics['matched_skills']) if metrics['matched_skills'] else 'All general tasks'
            explanation = (
                f"{dev.display_name} has {round(coverage * 100, 1)}% skill match ({matched_str}), "
                f"{metrics['remaining_task_capacity']} remaining task slot(s) ({metrics['active_tasks_count']}/{metrics['max_concurrent_tasks']} active), "
                f"and {metrics['remaining_hours']}h weekly bandwidth, resulting in a suitability score of {score}/100."
            )

            eligible_candidates.append({
                'id': str(dev.id),
                'user_id': str(dev.id),
                'developer_id': str(dev.id),
                'name': dev.display_name,
                'email': dev.email,
                'designation': dev.designation or 'Software Engineer',
                'role': dev.role_name,
                'suitability_score': score,
                'score_breakdown': breakdown,
                'skill_coverage': coverage,
                'skill_coverage_pct': round(coverage * 100, 1),
                'skills': metrics['developer_skills'],
                'matched_skills': metrics['matched_skills'],
                'missing_skills': metrics['missing_skills'],
                'active_tasks_count': metrics['active_tasks_count'],
                'active_task_count': metrics['active_tasks_count'],
                'max_concurrent_tasks': metrics['max_concurrent_tasks'],
                'remaining_task_capacity': metrics['remaining_task_capacity'],
                'active_hours': metrics['active_hours'],
                'capacity_hours': metrics['capacity_hours'],
                'remaining_hours': metrics['remaining_hours'],
                'explanation': explanation,
                'is_available': metrics['remaining_task_capacity'] > 0
            })

        # Rank candidates: Primary suitability score, secondary skill coverage, tertiary lowest active tasks, quaternary name
        eligible_candidates.sort(
            key=lambda c: (
                -c['suitability_score'],
                -c['skill_coverage_pct'],
                c['active_tasks_count'],
                c['active_hours'],
                c['name'].lower()
            )
        )

        recommended = eligible_candidates[0] if eligible_candidates else None
        alternatives = eligible_candidates[1:] if len(eligible_candidates) > 1 else []

        if not recommended:
            overall_status = 'NO_ELIGIBLE_CANDIDATE'
            summary_reason = (
                f"No eligible developer found in the assigned squad/project. "
                f"{len(excluded_candidates)} candidate(s) were evaluated and excluded based on missing skills or workload capacity."
            )
        else:
            overall_status = 'RECOMMENDATION_READY'
            summary_reason = (
                f"Recommended '{recommended['name']}' with suitability score {recommended['suitability_score']}/100. "
                f"{len(alternatives)} alternative candidate(s) available."
            )

        all_candidates = ([recommended] if recommended else []) + alternatives
        status_val = 'RECOMMENDED' if overall_status == 'RECOMMENDATION_READY' else overall_status

        return {
            'success': True,
            'status': status_val,
            'overall_status': overall_status,
            'candidates': all_candidates,
            'summary_reason': summary_reason,
            'required_skills': req_skills_list,
            'estimated_hours': float(estimated_hours or 4.0),
            'recommended_developer': recommended,
            'alternative_candidates': alternatives,
            'total_eligible_count': len(eligible_candidates),
            'excluded_candidates': excluded_candidates,
            'total_excluded_count': len(excluded_candidates)
        }

    @classmethod
    def recommend_for_task(cls, task_id, caller_user=None):
        """Fetches recommendations for an existing task entity."""
        task = Task.query.get(task_id)
        if not task:
            return {'success': False, 'message': 'Task not found.'}, 404

        # Validate caller scope
        if caller_user:
            scope = get_user_scope(caller_user)
            if not scope.is_admin and not scope.can_access_task(task):
                return {'success': False, 'message': '403 Forbidden: Access denied to this task.'}, 403

        # Inherit team and project
        team_id = task.team_id
        if not team_id and task.sprint_id:
            sprint = Sprint.query.get(task.sprint_id)
            if sprint:
                team_id = sprint.team_id

        res = cls.recommend_candidates(
            project_id=task.project_id,
            team_id=team_id,
            sprint_id=task.sprint_id,
            required_skills=task.required_skills_list,
            estimated_hours=task.estimated_hours or 4.0,
            caller_user=caller_user
        )
        res['task_id'] = str(task.id)
        res['task_title'] = task.display_title
        res['current_assignee_id'] = str(task.assigned_to_id) if task.assigned_to_id else None
        res['current_assignee_name'] = task.assignee_display_name
        return res, 200

    @classmethod
    def confirm_assignment(cls, task_id, developer_id=None, caller_user=None, notes=None, **kwargs):
        """
        Confirms assignment of a task to a recommended or selected eligible developer.
        Revalidates developer eligibility within a database transaction.
        Enforces strict RBAC: Developers cannot assign tasks to other developers.
        """
        developer_id = developer_id or kwargs.get('selected_developer_id') or kwargs.get('developer_id')
        caller_user = caller_user or kwargs.get('confirming_user') or kwargs.get('caller_user')

        if not caller_user:
            return {'success': False, 'message': 'Authentication required to assign tasks.'}, 401

        scope = get_user_scope(caller_user)

        # Developer check: Developers cannot assign tasks
        if scope.is_dev or caller_user.role_name == 'ROLE_DEV':
            return {'success': False, 'message': '403 Forbidden: Developers are not authorized to assign tasks.', 'error': 'Unauthorized: Developers cannot assign tasks'}, 403

        task = Task.query.get(task_id)
        if not task:
            return {'success': False, 'message': 'Task not found.'}, 404

        # Scope validation: PM or Lead can only assign tasks within their projects/teams
        if not scope.is_admin:
            if scope.is_lead and task.team_id and (task.team_id not in scope.team_ids):
                return {'success': False, 'message': '403 Forbidden: Cannot assign tasks outside your authorized squad.'}, 403
            if not scope.can_access_task(task):
                return {'success': False, 'message': '403 Forbidden: Cannot assign tasks outside your authorized scope.'}, 403

        developer = User.query.get(developer_id)
        if not developer:
            return {'success': False, 'message': 'Target developer not found.'}, 404

        # ─── REVALIDATION OF ELIGIBILITY AT CONFIRMATION TIME ───
        # 1. Project / Team Boundary Revalidation
        team_id = task.team_id
        if not team_id and task.sprint_id:
            sprint = Sprint.query.get(task.sprint_id)
            if sprint:
                team_id = sprint.team_id

        if team_id:
            team = Team.query.get(team_id)
            if team:
                is_member = TeamMember.query.filter_by(team_id=team.id, user_id=developer.id).first()
                is_lead = (team.team_leader_id and str(team.team_leader_id) == str(developer.id)) or (team.lead_id and str(team.lead_id) == str(developer.id))
                if not (is_member or is_lead):
                    return {
                        'success': False,
                        'message': f"Cross-team assignment rejected: Developer '{developer.display_name}' does not belong to team '{team.name}'."
                    }, 400

        # 2. Capacity & Activity Revalidation
        is_eligible, reason, metrics = cls.evaluate_developer_eligibility(
            developer=developer,
            required_skills=task.required_skills_list,
            new_task_hours=task.estimated_hours or 4.0
        )

        if not is_eligible:
            err_tag = 'CAPACITY_EXCEEDED' if ('capacity' in reason.lower() or 'max_tasks' in reason.lower()) else 'INELIGIBLE_CANDIDATE'
            return {
                'success': False,
                'status': 'ASSIGNMENT_REVALIDATION_FAILED',
                'error': f"{err_tag}: {reason}",
                'message': f"Developer '{developer.display_name}' is no longer eligible: {reason}.",
                'reason': reason
            }, 409

        # ─── ATOMIC TRANSACTION: PERSIST CONFIRMED ASSIGNMENT ───
        old_assignee_name = task.assignee_display_name
        task.assigned_to_id = developer.id
        task.assigned_by_id = caller_user.id
        task.updated_at = datetime.utcnow()

        # Audit History
        reason_text = notes or f"Skill-based task assignment confirmed by {caller_user.display_name}"
        hist = TaskStatusHistory(
            task_id=task.id,
            user_id=caller_user.id,
            action_type='TASK_ASSIGNED',
            old_value=old_assignee_name,
            new_value=developer.display_name,
            details=f"Assigned to {developer.display_name}. {reason_text}"
        )
        db.session.add(hist)

        # Audit Log
        log = AuditLog(
            action='SKILL_BASED_TASK_ASSIGNMENT_CONFIRMED',
            user_email=caller_user.email,
            role_name=caller_user.role_name,
            details=f"Task '{task.display_title}' assigned to developer {developer.display_name} ({developer.email}) by {caller_user.display_name}."
        )
        db.session.add(log)

        # In-App Notification to Assignee
        if str(developer.id) != str(caller_user.id):
            notif = Notification(
                recipient_id=developer.id,
                title='⚡ Task Ticket Assigned (Skill-Matched)',
                message=f"You have been assigned to task: '{task.display_title}' by {caller_user.display_name}.",
                notification_type='TASK_ASSIGNMENT',
                read=False
            )
            db.session.add(notif)

        db.session.commit()

        return {
            'success': True,
            'message': f"Task successfully assigned to {developer.display_name}.",
            'task': task.to_dict(),
            'assignment_summary': {
                'task_id': str(task.id),
                'task_title': task.display_title,
                'assigned_developer_id': str(developer.id),
                'assigned_developer_name': developer.display_name,
                'assigned_by': caller_user.display_name,
                'confirmed_at': datetime.utcnow().isoformat(),
                'notes': reason_text
            }
        }, 200
