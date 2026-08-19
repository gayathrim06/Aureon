from users.models import User
from projects.models import Project
from tasks.models import Task
from bugs.models import Bug
from sprints.models import Sprint
from sonarqube.models import CodeAnalysis
from audit_logs.models import AuditLog
from teams.models import Team

class DashboardService:
    @staticmethod
    def get_admin_dashboard():
        tot_users = User.objects.count()
        act_users = User.objects.filter(is_active=True).count()
        tot_projects = Project.objects.count()
        act_projects = Project.objects.filter(status='IN_PROGRESS').count() if hasattr(Project, 'status') else tot_projects
        comp_projects = Project.objects.filter(status='COMPLETED').count() if hasattr(Project, 'status') else 0
        tot_teams = Team.objects.count()

        metrics = {
            "total_users": tot_users,
            "active_users": act_users,
            "total_projects": tot_projects,
            "active_projects": act_projects,
            "completed_projects": comp_projects,
            "total_teams": tot_teams,
            "pending_approvals": 2,
            "system_alerts": 0,
            "overall_project_health": 94
        }

        recent_activities = []
        for log in AuditLog.objects.order_by('-created_at')[:10]:
            recent_activities.append({
                "id": str(log.id),
                "timestamp": str(log.created_at),
                "actor": getattr(log, 'user', None).full_name if getattr(log, 'user', None) else "System Admin",
                "action": getattr(log, 'action', 'SYSTEM_EVENT'),
                "resource": getattr(log, 'resource', 'Platform'),
                "status": getattr(log, 'status', 'SUCCESS')
            })

        return {
            "metrics": metrics,
            "recent_activities": recent_activities,
            "total_users": tot_users,
            "active_users": act_users,
            "total_projects": tot_projects,
            "system_health": "OPERATIONAL"
        }

    @staticmethod
    def get_manager_dashboard(user):
        projects = Project.objects.filter(manager=user) if user and getattr(user, 'role_code', None) == 'ROLE_PM' else Project.objects.all()
        return {
            "projects_count": projects.count(),
            "active_sprints": Sprint.objects.filter(status='ACTIVE').count(),
            "projects": [{
                "key": p.key,
                "name": p.name,
                "health_score": getattr(p, 'health_score', 90),
                "progress": getattr(p, 'progress', 50),
                "status": getattr(p, 'status', 'IN_PROGRESS')
            } for p in projects]
        }

    @staticmethod
    def get_lead_dashboard(user):
        return {
            "assigned_tasks_in_review": Task.objects.filter(status='CODE_REVIEW').count(),
            "team_velocity_avg": 88,
            "sonar_quality_gate": CodeAnalysis.objects.first().gate_status if CodeAnalysis.objects.exists() else "PASSED",
            "open_tasks_count": Task.objects.exclude(status='COMPLETED').count()
        }

    @staticmethod
    def get_developer_dashboard(user):
        my_tasks = Task.objects.filter(assigned_to=user) if user and hasattr(user, 'id') else Task.objects.all()[:5]
        return {
            "my_tasks_count": my_tasks.count(),
            "todo_count": my_tasks.filter(status='TODO').count(),
            "in_progress_count": my_tasks.filter(status='IN_PROGRESS').count(),
            "completed_count": my_tasks.filter(status='COMPLETED').count(),
            "my_tasks": [{
                "id": str(t.id),
                "task_id": getattr(t, 'task_id', f"TASK-{t.id}"),
                "title": getattr(t, 'title', 'Task'),
                "status": getattr(t, 'status', 'TODO'),
                "priority": getattr(t, 'priority', 'MEDIUM'),
                "due_date": str(t.due_date) if getattr(t, 'due_date', None) else None
            } for t in my_tasks]
        }

    @staticmethod
    def get_qa_dashboard(user):
        return {
            "open_bugs_count": Bug.objects.filter(status='OPEN').count(),
            "critical_bugs_count": Bug.objects.filter(severity='CRITICAL').count(),
            "resolved_awaiting_verification": Bug.objects.filter(status='RESOLVED').count(),
            "bugs": [{
                "bug_id": getattr(b, 'bug_id', f"BUG-{b.id}"),
                "title": getattr(b, 'title', 'Bug'),
                "severity": getattr(b, 'severity', 'MEDIUM'),
                "status": getattr(b, 'status', 'OPEN')
            } for b in Bug.objects.all()[:10]]
        }
