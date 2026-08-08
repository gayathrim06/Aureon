from django.db import models
from common.models import BaseModel
from django.conf import settings

class Notification(BaseModel):
    """
    tbl_notification Model.
    Automated notifications generated for task assignments, sprint events, defects.
    """
    TYPE_CHOICES = (
        ('TASK_ASSIGNED', 'Task Assigned'),
        ('TASK_UPDATED', 'Task Updated'),
        ('BUG_ASSIGNED', 'Bug Assigned'),
        ('SPRINT_STARTED', 'Sprint Started'),
        ('SPRINT_COMPLETED', 'Sprint Completed'),
        ('REPO_CONNECTED', 'Repository Connected'),
        ('PROJECT_UPDATED', 'Project Updated'),
    )

    PRIORITY_CHOICES = (('HIGH', 'High'), ('MEDIUM', 'Medium'), ('LOW', 'Low'))

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=40, choices=TYPE_CHOICES, db_index=True)
    read = models.BooleanField(default=False, db_index=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')

    class Meta:
        db_table = 'tbl_notification'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} -> {self.recipient.email}: {self.title}"
