from users.models import User
from projects.models import Project
from tasks.models import Task
from bugs.models import Bug
from sprints.models import Sprint
from sonarqube.models import CodeAnalysis
from audit_logs.models import AuditLog

class DashboardService:
    @staticmethod
    def get_admin_dashboard():
        return {
            "total_users": User.objects.count(),
            "active_users": User.objects.filter(is_active=True).count(),
            "total_projects": Project.objects.count(),
            "system_health": "OPERATIONAL",
            "recent_audit_logs_count": AuditLog.objects.count(),
            "failed_logins_24h": AuditLog.objects.filter(action__contains='LOGIN', status='FAILURE').count()
        }

    @staticmethod
    def get_manager_dashboard(user):
        projects = Project.objects.filter(manager=user) if user and user.role_code == 'ROLE_PM' else Project.objects.all()
        return {
            "projects_count": projects.count(),
            "active_sprints": Sprint.objects.filter(status='ACTIVE').count(),
            "projects": [{
                "key": p.key,
                "name": p.name,
                "health_score": p.health_score,
                "progress": p.progress,
                "status": p.status
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
        my_tasks = Task.objects.filter(assigned_to=user)
        return {
            "my_tasks_count": my_tasks.count(),
            "todo_count": my_tasks.filter(status='TODO').count(),
            "in_progress_count": my_tasks.filter(status='IN_PROGRESS').count(),
            "completed_count": my_tasks.filter(status='COMPLETED').count(),
            "my_tasks": [{
                "id": t.id,
                "task_id": t.task_id,
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
                "due_date": str(t.due_date) if t.due_date else None
            } for t in my_tasks]
        }

    @staticmethod
    def get_qa_dashboard(user):
        return {
            "open_bugs_count": Bug.objects.filter(status='OPEN').count(),
            "critical_bugs_count": Bug.objects.filter(severity='CRITICAL').count(),
            "resolved_awaiting_verification": Bug.objects.filter(status='RESOLVED').count(),
            "bugs": [{
                "bug_id": b.bug_id,
                "title": b.title,
                "severity": b.severity,
                "status": b.status
            } for b in Bug.objects.all()[:10]]
        }
