from django.db import models
from common.models import BaseModel
from django.conf import settings

class Department(BaseModel):
    """
    tbl_department Model.
    Organizational department e.g. Engineering, Quality Assurance, Product Delivery.
    """
    name = models.CharField(max_length=150, unique=True, db_index=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tbl_department'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Team(BaseModel):
    """
    tbl_team Model.
    Engineering and delivery teams led by Team Leads.
    """
    name = models.CharField(max_length=150, unique=True, db_index=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='teams')
    lead = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='led_teams')
    capacity_percentage = models.IntegerField(default=100)

    class Meta:
        db_table = 'tbl_team'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.department.name})"


class TeamMember(BaseModel):
    """
    tbl_team_member Junction Table linking Users to Teams.
    """
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='team_members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_teams')
    joined_at = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'tbl_team_member'
        unique_together = ('team', 'user')

    def __str__(self):
        return f"{self.user.email} in {self.team.name}"
