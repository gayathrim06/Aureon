from django.db import models
from common.models import BaseModel
from projects.models import Project

class Repository(BaseModel):
    """
    tbl_repository Model.
    Connected GitHub repository entity.
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='repositories')
    name = models.CharField(max_length=200, db_index=True, help_text="e.g. aureon/core-backend")
    github_repository_id = models.CharField(max_length=100, blank=True, null=True)
    owner = models.CharField(max_length=100, default='aureon-saas')
    repository_url = models.URLField()
    default_branch = models.CharField(max_length=50, default='main')
    visibility = models.CharField(max_length=20, default='PRIVATE')
    clone_status = models.CharField(max_length=50, default='CLONED')
    last_sync_at = models.DateTimeField(auto_now=True)
    platform = models.CharField(max_length=50, default='GitHub')

    class Meta:
        db_table = 'tbl_repository'
        ordering = ['name']

    def __str__(self):
        return self.name
