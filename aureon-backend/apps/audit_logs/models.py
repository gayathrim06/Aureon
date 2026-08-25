from django.db import models
from common.models import BaseModel
from django.conf import settings

class ActivityLog(BaseModel):
    """
    tbl_activity_log Model.
    User feature activity log tracking logins, logouts, task updates, role changes.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=100, db_index=True)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'tbl_activity_log'
        ordering = ['-timestamp']


class AuditLog(BaseModel):
    """
    tbl_audit_log Model.
    Immutable security audit ledger storing IP address, User-Agent, OS, user, and action status.
    """
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    user_email = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    role_name = models.CharField(max_length=100, blank=True, null=True)
    
    ip_address = models.GenericIPAddressField(blank=True, null=True, db_index=True)
    user_agent = models.TextField(blank=True, null=True)
    operating_system = models.CharField(max_length=100, default='Windows')
    browser = models.CharField(max_length=100, default='Chrome')
    
    action = models.CharField(max_length=100, db_index=True, help_text="e.g. USER_LOGIN, TASK_UPDATE, REPORT_DOWNLOAD")
    resource = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, default='SUCCESS', db_index=True)
    details = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tbl_audit_log'
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.user_email} - {self.action} ({self.status})"
