from django.urls import path
from reports.views import ProjectReportView, TaskReportView, BugReportView

urlpatterns = [
    path('reports/projects/', ProjectReportView.as_view(), name='report_projects'),
    path('reports/tasks/', TaskReportView.as_view(), name='report_tasks'),
    path('reports/bugs/', BugReportView.as_view(), name='report_bugs'),
]
