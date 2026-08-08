from django.db import models
from common.models import BaseModel
from django.conf import settings
from projects.models import Project
from sprints.models import Sprint

class Task(BaseModel):
    """
    tbl_task Model.
    Task work item with assigned developer, sprint, and Kanban status.
    """
    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    )

    KANBAN_STATUS_CHOICES = (
        ('TODO', 'Todo'),
        ('IN_PROGRESS', 'In Progress'),
        ('CODE_REVIEW', 'Code Review'),
        ('TESTING', 'Testing'),
        ('COMPLETED', 'Completed'),
        ('BLOCKED', 'Blocked'),
    )

    task_id = models.CharField(max_length=50, unique=True, db_index=True, help_text="Human-readable ID e.g. TSK-101")
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True, null=True)
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    sprint = models.ForeignKey(Sprint, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_tasks')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks', db_index=True)
    
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM', db_index=True)
    status = models.CharField(max_length=30, choices=KANBAN_STATUS_CHOICES, default='TODO', db_index=True)
    
    due_date = models.DateField(blank=True, null=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    completion_percentage = models.IntegerField(default=0)

    class Meta:
        db_table = 'tbl_task'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.task_id}: {self.title}"


class TaskComment(BaseModel):
    """tbl_task_comment Model."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()

    class Meta:
        db_table = 'tbl_task_comment'
        ordering = ['created_at']


class TaskAttachment(BaseModel):
    """tbl_task_attachment Model."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='task_attachments/')
    filename = models.CharField(max_length=255)

    class Meta:
        db_table = 'tbl_task_attachment'


class TaskHistory(BaseModel):
    """tbl_task_history Model."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='history')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)

    class Meta:
        db_table = 'tbl_task_history'
        ordering = ['-created_at']


class TaskLabel(BaseModel):
    """tbl_task_label Model."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='task_labels')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default='#3b82f6')

    class Meta:
        db_table = 'tbl_task_label'


class TaskDependency(BaseModel):
    """tbl_task_dependency Model for task blocking & prerequisite relationships."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='dependencies')
    depends_on = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='blocking_tasks')
    dependency_type = models.CharField(max_length=50, default='BLOCKS')

    class Meta:
        db_table = 'tbl_task_dependency'
        unique_together = ('task', 'depends_on')
