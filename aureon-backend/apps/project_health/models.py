from django.db import models
from common.models import BaseModel
from projects.models import Project

class ProjectHealth(BaseModel):
    """
    tbl_project_health Model.
    Rule-based deterministic health snapshots per project.
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='health_records')
    score = models.IntegerField(help_text="Calculated score (0-100)")
    task_completion_factor = models.FloatField(default=0.0)
    sprint_progress_factor = models.FloatField(default=0.0)
    sonarqube_factor = models.FloatField(default=0.0)
    bugs_penalty = models.FloatField(default=0.0)
    late_tasks_penalty = models.FloatField(default=0.0)
    summary = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tbl_project_health'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project.key} Health ({self.score}/100)"
