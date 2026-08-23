from projects.models import Project
from tasks.models import Task
from sprints.models import Sprint
from bugs.models import Bug
from users.models import User
from repositories.models import Repository
from sonarqube.models import CodeAnalysis

class ReportGeneratorService:
    """Generates structured JSON reports formatted for frontend PDF conversion."""

    @staticmethod
    def generate_project_report(project_id=None):
        projects = Project.objects.filter(id=project_id) if project_id else Project.objects.all()
        report_data = []
        for p in projects:
            report_data.append({
                "project_key": p.key,
                "project_name": p.name,
                "status": p.status,
                "health_score": p.health_score,
                "progress": p.progress,
                "budget_spent": str(p.budget_spent),
                "total_budget": str(p.budget),
                "manager": p.manager.full_name if p.manager else "Unassigned",
                "lead": p.lead.full_name if p.lead else "Unassigned",
                "target_deadline": str(p.target_deadline) if p.target_deadline else None
            })
        return {"report_type": "PROJECT_REPORT", "count": len(report_data), "data": report_data}

    @staticmethod
    def generate_task_report():
        tasks = Task.objects.select_related('assigned_to', 'project').all()
        return {
            "report_type": "TASK_REPORT",
            "count": tasks.count(),
            "data": [{
                "task_id": t.task_id,
                "title": t.title,
                "project": t.project.key,
                "assignee": t.assigned_to.full_name if t.assigned_to else "Unassigned",
                "status": t.status,
                "priority": t.priority,
                "logged_hours": str(t.actual_hours),
                "estimated_hours": str(t.estimated_hours)
            } for t in tasks]
        }

    @staticmethod
    def generate_bug_report():
        bugs = Bug.objects.select_related('assigned_developer', 'project').all()
        return {
            "report_type": "BUG_REPORT",
            "count": bugs.count(),
            "data": [{
                "bug_id": b.bug_id,
                "title": b.title,
                "severity": b.severity,
                "status": b.status,
                "project": b.project.key,
                "assignee": b.assigned_developer.full_name if b.assigned_developer else "Unassigned"
            } for b in bugs]
        }
