from rest_framework import serializers, viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from projects.models import Project
from project_health.models import ProjectHealth
from project_health.services import ProjectHealthCalculator

class ProjectHealthSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectHealth
        fields = '__all__'

class ProjectHealthViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProjectHealth.objects.all()
    serializer_class = ProjectHealthSerializer
    permission_classes = [permissions.IsAuthenticated]

class CalculateProjectHealthView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Trigger Rule-Based Project Health Calculation")
    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"success": False, "message": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        snapshot = ProjectHealthCalculator.calculate_health(project)
        serializer = ProjectHealthSerializer(snapshot)
        return Response({"success": True, "health_snapshot": serializer.data}, status=status.HTTP_200_OK)
