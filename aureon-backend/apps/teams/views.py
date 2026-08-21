from rest_framework import viewsets, permissions
from teams.models import Team
from teams.serializers import TeamSerializer
from permissions.permissions import IsTeamLead, IsProjectManager

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsProjectManager()]
        return super().get_permissions()
