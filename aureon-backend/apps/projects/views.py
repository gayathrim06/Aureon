from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from projects.models import Project, Milestone
from projects.serializers import ProjectSerializer, MilestoneSerializer
from permissions.permissions import IsProjectManager, IsAdminUserRole
from project_health.services import ProjectHealthCalculator

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy', 'archive']:
            return [IsProjectManager()]
        return super().get_permissions()

    @extend_schema(summary="Archive Project")
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        project = self.get_object()
        project.is_archived = True
        project.status = 'ARCHIVED'
        project.save()
        return Response({"success": True, "message": f"Project {project.key} archived."}, status=status.HTTP_200_OK)

    @extend_schema(summary="Recalculate Project Health Score")
    @action(detail=True, methods=['post'])
    def calculate_health(self, request, pk=None):
        project = self.get_object()
        snapshot = ProjectHealthCalculator.calculate_health(project)
        return Response({
            "success": True,
            "project_key": project.key,
            "health_score": snapshot.score,
            "summary": snapshot.summary
        }, status=status.HTTP_200_OK)


class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]
