from django.db import models
from common.models import BaseModel

class Role(BaseModel):
    """
    tbl_role Model representing System Roles in Aureon.
    """
    CODE_CHOICES = (
        ('ROLE_ADMIN', 'Administrator'),
        ('ROLE_PM', 'Project Manager'),
        ('ROLE_LEAD', 'Team Lead'),
        ('ROLE_DEV', 'Developer'),
        ('ROLE_QA', 'QA Engineer'),
    )

    code = models.CharField(max_length=50, choices=CODE_CHOICES, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    level = models.IntegerField(default=5, help_text="Priority level (1=highest)")

    class Meta:
        db_table = 'tbl_role'
        ordering = ['level']

    def __str__(self):
        return f"{self.name} ({self.code})"
