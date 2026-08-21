from django.db import models
from common.models import BaseModel
from django.conf import settings

class Project(BaseModel):
    """
    tbl_project Model.
    Software project entity managed by Project Managers.
    """
    STATUS_CHOICES = (
        ('PLANNING', 'Planning'),
        ('IN_PROGRESS', 'In Progress'),
        ('ON_HOLD', 'On Hold'),
        ('COMPLETED', 'Completed'),
        ('ARCHIVED', 'Archived'),
    )

    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    )

    name = models.CharField(max_length=200, db_index=True)
    key = models.CharField(max_length=20, unique=True, db_index=True, help_text="Short key prefix e.g. ACCA")
    description = models.TextField(blank=True, null=True)
    
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_projects')
    business_architect = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='architected_projects')
    lead = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='led_projects')
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='IN_PROGRESS', db_index=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='HIGH', db_index=True)
    
    progress = models.IntegerField(default=0, help_text="Completion percentage (0-100)")
    health_score = models.IntegerField(default=100, help_text="Calculated project health index (0-100)")
    
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    budget_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    start_date = models.DateField(blank=True, null=True)
    target_deadline = models.DateField(blank=True, null=True)
    is_archived = models.BooleanField(default=False)

    class Meta:
        db_table = 'tbl_project'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.key})"


class ProjectMember(BaseModel):
    """
    tbl_project_member Junction Table linking Users to Projects.
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_projects')
    role_in_project = models.CharField(max_length=100, default='Developer')

    class Meta:
        db_table = 'tbl_project_member'
        unique_together = ('project', 'user')

    def __str__(self):
        return f"{self.user.email} -> {self.project.key}"


class Milestone(BaseModel):
    """
    tbl_project_milestone Model.
    Delivery milestones within a Project.
    """
    STATUS_CHOICES = (
        ('ON_TRACK', 'On Track'),
        ('AT_RISK', 'At Risk'),
        ('DELAYED', 'Delayed'),
        ('COMPLETED', 'Completed'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    name = models.CharField(max_length=200)
    target_date = models.DateField()
    progress = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ON_TRACK')
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tbl_project_milestone'
        ordering = ['target_date']

    def __str__(self):
        return f"{self.project.key} - {self.name}"
