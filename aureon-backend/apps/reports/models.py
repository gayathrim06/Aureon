from django.db import models
from common.models import BaseModel
from django.conf import settings

class Report(BaseModel):
    """
    tbl_report Model.
    Stores generated JSON report records ready for PDF output.
    """
    TYPE_CHOICES = (
        ('PROJECT_REPORT', 'Project Report'),
        ('TASK_REPORT', 'Task Report'),
        ('SPRINT_REPORT', 'Sprint Report'),
        ('BUG_REPORT', 'Bug Report'),
        ('DEVELOPER_REPORT', 'Developer Report'),
        ('REPOSITORY_REPORT', 'Repository Report'),
    )

    report_type = models.CharField(max_length=50, choices=TYPE_CHOICES, db_index=True)
    title = models.CharField(max_length=200)
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    json_content = models.TextField()

    class Meta:
        db_table = 'tbl_report'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.report_type}: {self.title}"
