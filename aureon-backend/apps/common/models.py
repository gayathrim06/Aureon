import uuid
from django.db import models
from django.conf import settings

class BaseModel(models.Model):
    """
    Abstract Base Model for all Aureon database tables.
    Provides UUID primary key, timestamps, audit references, and soft delete capabilities.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(class)s_created",
        help_text="User who created this record"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(class)s_updated",
        help_text="User who last updated this record"
    )
    is_active = models.BooleanField(default=True, db_index=True, help_text="Designates whether this record is active.")
    is_deleted = models.BooleanField(default=False, db_index=True, help_text="Soft delete flag.")

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def soft_delete(self):
        """Soft delete record by setting is_deleted=True and is_active=False."""
        self.is_deleted = True
        self.is_active = False
        self.save(update_fields=['is_deleted', 'is_active', 'updated_at'])
