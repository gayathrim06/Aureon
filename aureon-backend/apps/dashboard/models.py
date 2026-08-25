from django.db import models
from common.models import BaseModel
from django.conf import settings

class DashboardCache(BaseModel):
    """
    tbl_dashboard_cache Model.
    Role-specific metric snapshot caches.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dashboard_caches')
    role_code = models.CharField(max_length=50, db_index=True)
    cache_key = models.CharField(max_length=255, unique=True)
    json_data = models.TextField()
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'tbl_dashboard_cache'
        ordering = ['-created_at']


class Dashboard(BaseModel):
    """
    tbl_dashboard Model.
    Stores project dashboard metrics including health score, sprint completion, task completion, and repository status.
    """
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='dashboard_metrics', null=True, blank=True)
    dashboard_health_score = models.FloatField(null=True, blank=True)
    dashboard_sprint_completion = models.FloatField(null=True, blank=True)
    dashboard_task_completion = models.FloatField(null=True, blank=True)
    dashboard_repository_status = models.CharField(max_length=30, blank=True, null=True)
    dashboard_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_dashboard'
        ordering = ['-created_at']

    def __str__(self):
        return f"Dashboard Metrics - Project {self.project_id if self.project else 'Global'}"

