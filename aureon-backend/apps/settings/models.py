from django.db import models
from common.models import BaseModel

class SystemSetting(BaseModel):
    """
    tbl_system_setting Model.
    System configuration parameters.
    """
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField()
    category = models.CharField(max_length=50, default='SYSTEM', db_index=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tbl_system_setting'

    def __str__(self):
        return f"{self.key} = {self.value}"
