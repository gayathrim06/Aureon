from django.db import models
from common.models import BaseModel
from roles.models import Role

class PermissionToken(BaseModel):
    """
    tbl_permission Model.
    Database-driven Permission Token Model.
    """
    token = models.CharField(max_length=100, unique=True, db_index=True, help_text="Token code e.g. projects.create")
    name = models.CharField(max_length=150)
    module = models.CharField(max_length=50, db_index=True, help_text="Domain module e.g. projects, tasks, bugs")
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tbl_permission'
        ordering = ['module', 'token']

    def __str__(self):
        return f"{self.token} ({self.name})"


class RolePermission(BaseModel):
    """
    tbl_role_permission Junction Table linking Roles to Permissions.
    """
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(PermissionToken, on_delete=models.CASCADE, related_name='permission_roles')

    class Meta:
        db_table = 'tbl_role_permission'
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role.code} -> {self.permission.token}"
