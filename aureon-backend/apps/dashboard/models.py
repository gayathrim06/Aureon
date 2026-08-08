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
