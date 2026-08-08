from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from drf_spectacular.utils import extend_schema
from reports.services import ReportGeneratorService

class ProjectReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Generate PDF-Ready JSON Project Report")
    def get(self, request):
        data = ReportGeneratorService.generate_project_report()
        return Response(data, status=status.HTTP_200_OK)


class TaskReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Generate PDF-Ready JSON Task Report")
    def get(self, request):
        data = ReportGeneratorService.generate_task_report()
        return Response(data, status=status.HTTP_200_OK)


class BugReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Generate PDF-Ready JSON Bug Report")
    def get(self, request):
        data = ReportGeneratorService.generate_bug_report()
        return Response(data, status=status.HTTP_200_OK)
