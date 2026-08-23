from datetime import date
from tasks.models import Task
from sprints.models import Sprint
from bugs.models import Bug
from sonarqube.models import CodeAnalysis
from project_health.models import ProjectHealth

class ProjectHealthCalculator:
    """
    Deterministic Rule-Based Engine (NO AI) for calculating Software Project Health.
    Applies mathematical rules across Task completion, Sprints, SonarQube scans, and Bugs.
    """

    @classmethod
    def calculate_health(cls, project):
        tasks = Task.objects.filter(project=project)
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='COMPLETED').count()

        task_completion_factor = (completed_tasks / total_tasks * 25.0) if total_tasks > 0 else 20.0

        # Sprint factor
        sprints = Sprint.objects.filter(project=project)
        total_sprints = sprints.count()
        completed_sprints = sprints.filter(status='COMPLETED').count()
        sprint_factor = (completed_sprints / total_sprints * 20.0) if total_sprints > 0 else 15.0

        # SonarQube factor
        latest_analysis = CodeAnalysis.objects.filter(project=project).first()
        if latest_analysis:
            gate_score = 25.0 if latest_analysis.gate_status == 'PASSED' else 15.0 if latest_analysis.gate_status == 'WARNING' else 5.0
            sq_factor = min(25.0, gate_score + (float(latest_analysis.coverage_percentage) * 0.05))
        else:
            sq_factor = 20.0

        # Bugs penalty
        open_bugs = Bug.objects.filter(project=project, status__in=['OPEN', 'ASSIGNED', 'TESTING'])
        critical_bugs = open_bugs.filter(severity='CRITICAL').count()
        high_bugs = open_bugs.filter(severity='HIGH').count()
        medium_bugs = open_bugs.filter(severity='MEDIUM').count()
        bugs_penalty = (critical_bugs * 10.0) + (high_bugs * 5.0) + (medium_bugs * 2.0)

        # Late tasks penalty
        today = date.today()
        late_tasks = tasks.filter(due_date__lt=today).exclude(status='COMPLETED').count()
        late_penalty = late_tasks * 3.0

        raw_score = task_completion_factor + sprint_factor + sq_factor - bugs_penalty - late_penalty
        final_score = int(max(0, min(100, round(raw_score))))

        # Save snapshot in tbl_project_health
        snapshot = ProjectHealth.objects.create(
            project=project,
            score=final_score,
            task_completion_factor=task_completion_factor,
            sprint_progress_factor=sprint_factor,
            sonarqube_factor=sq_factor,
            bugs_penalty=bugs_penalty,
            late_tasks_penalty=late_penalty,
            summary=f"Calculated {final_score}/100. Tasks ({completed_tasks}/{total_tasks}), Critical Bugs ({critical_bugs}), Late Tasks ({late_tasks})."
        )

        project.health_score = final_score
        project.save(update_fields=['health_score', 'updated_at'])

        return snapshot
