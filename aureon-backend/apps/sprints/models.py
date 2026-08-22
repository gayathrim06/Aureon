from django.db import models
from common.models import BaseModel
from projects.models import Project

class Sprint(BaseModel):
    """
    tbl_sprint Model.
    Sprint iteration within a software project.
    """
    STATUS_CHOICES = (
        ('PLANNING', 'Planning'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sprints')
    name = models.CharField(max_length=150, db_index=True)
    goal = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    velocity = models.IntegerField(default=0, help_text="Sprint story points velocity")
    completion_percentage = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNING', db_index=True)

    class Meta:
        db_table = 'tbl_sprint'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.project.key} - {self.name}"
