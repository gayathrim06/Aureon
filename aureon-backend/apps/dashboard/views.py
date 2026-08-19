from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from drf_spectacular.utils import extend_schema
from dashboard.services import DashboardService

class AdminDashboardView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="System Administrator Dashboard Metrics")
    def get(self, request):
        data = DashboardService.get_admin_dashboard()
        return Response({
            "success": True,
            "metrics": data.get("metrics", data),
            "recent_activities": data.get("recent_activities", []),
            "dashboard": data
        }, status=status.HTTP_200_OK)


class ManagerDashboardView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Project Manager Dashboard Metrics")
    def get(self, request):
        data = DashboardService.get_manager_dashboard(request.user)
        return Response({"success": True, "dashboard": data, "metrics": data}, status=status.HTTP_200_OK)


class LeadDashboardView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Team Lead Dashboard Metrics")
    def get(self, request):
        data = DashboardService.get_lead_dashboard(request.user)
        return Response({"success": True, "dashboard": data, "metrics": data}, status=status.HTTP_200_OK)


class DeveloperDashboardView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Developer Workspace Dashboard Metrics")
    def get(self, request):
        data = DashboardService.get_developer_dashboard(request.user)
        return Response({"success": True, "dashboard": data, "metrics": data}, status=status.HTTP_200_OK)


class QaDashboardView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="QA Engineer Dashboard Metrics")
    def get(self, request):
        data = DashboardService.get_qa_dashboard(request.user)
        return Response({"success": True, "dashboard": data, "metrics": data}, status=status.HTTP_200_OK)
