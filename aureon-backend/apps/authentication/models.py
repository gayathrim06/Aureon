from django.db import models
from common.models import BaseModel
from django.conf import settings

class UserSession(BaseModel):
    """
    tbl_user_session Model.
    Tracks active user device sessions, IP address, and User-Agent.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_sessions')
    session_token = models.CharField(max_length=255, unique=True, db_index=True)
    refresh_token_jti = models.CharField(max_length=255, blank=True, null=True)
    
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    device_type = models.CharField(max_length=100, default='Web Browser')
    
    login_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = 'tbl_user_session'
        ordering = ['-last_activity']

    def __str__(self):
        return f"{self.user.email} - {self.device_type} ({self.session_token})"


class RefreshTokenLog(BaseModel):
    """
    tbl_refresh_token Model.
    Stores JWT SimpleJWT refresh token JTIs for blacklisting and rotation validation.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='refresh_tokens')
    jti = models.CharField(max_length=255, unique=True, db_index=True)
    token = models.TextField()
    blacklisted = models.BooleanField(default=False, db_index=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'tbl_refresh_token'
        ordering = ['-created_at']


class PasswordResetToken(BaseModel):
    """
    tbl_password_reset Model.
    Secure password reset tokens.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='password_resets')
    reset_token = models.CharField(max_length=255, unique=True, db_index=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'tbl_password_reset'
        ordering = ['-created_at']
