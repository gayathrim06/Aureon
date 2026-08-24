from django.db import models
from common.models import BaseModel
from django.conf import settings
from projects.models import Project

class Bug(BaseModel):
    """
    tbl_bug Model.
    Software defect tracking model with assigned QA & Developer references.
    """
    SEVERITY_CHOICES = (
        ('CRITICAL', 'Critical'),
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
    )

    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    )

    STATUS_CHOICES = (
        ('OPEN', 'Open'),
        ('ASSIGNED', 'Assigned'),
        ('TESTING', 'Testing'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    )

    bug_id = models.CharField(max_length=50, unique=True, db_index=True, help_text="e.g. BUG-401")
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField()
    steps_to_reproduce = models.TextField(blank=True, null=True)
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='bugs')
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='reported_bugs')
    assigned_qa = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='qa_assigned_bugs')
    assigned_developer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='dev_assigned_bugs')
    
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='HIGH', db_index=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='HIGH', db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN', db_index=True)
    
    evidence_file = models.FileField(upload_to='bug_evidence/', blank=True, null=True)
    resolution_summary = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tbl_bug'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.bug_id}: {self.title} ({self.severity})"


class BugComment(BaseModel):
    """
    tbl_bug_comment Model.
    Discussion thread on defects.
    """
    bug = models.ForeignKey(Bug, on_delete=models.CASCADE, related_name='bug_comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()

    class Meta:
        db_table = 'tbl_bug_comment'
        ordering = ['created_at']
