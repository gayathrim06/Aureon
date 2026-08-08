from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from sprints.models import Sprint
from sprints.serializers import SprintSerializer
from permissions.permissions import IsProjectManager, IsTeamLead

class SprintViewSet(viewsets.ModelViewSet):
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy', 'start_sprint', 'complete_sprint']:
            return [IsProjectManager()]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def start_sprint(self, request, pk=None):
        sprint = self.get_object()
        sprint.status = 'ACTIVE'
        sprint.save()
        return Response({"success": True, "message": f"Sprint {sprint.name} started."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def complete_sprint(self, request, pk=None):
        sprint = self.get_object()
        sprint.status = 'COMPLETED'
        sprint.save()
        return Response({"success": True, "message": f"Sprint {sprint.name} marked completed."}, status=status.HTTP_200_OK)
