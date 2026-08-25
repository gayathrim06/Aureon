from django.urls import path
from dashboard.views import (
    AdminDashboardView, ManagerDashboardView, LeadDashboardView,
    DeveloperDashboardView, QaDashboardView
)

urlpatterns = [
    path('dashboard/admin/', AdminDashboardView.as_view(), name='dashboard_admin'),
    path('dashboards/admin', AdminDashboardView.as_view()),
    path('dashboards/admin/', AdminDashboardView.as_view()),
    path('dashboard/manager/', ManagerDashboardView.as_view(), name='dashboard_manager'),
    path('dashboards/manager', ManagerDashboardView.as_view()),
    path('dashboards/manager/', ManagerDashboardView.as_view()),
    path('dashboard/lead/', LeadDashboardView.as_view(), name='dashboard_lead'),
    path('dashboards/lead', LeadDashboardView.as_view()),
    path('dashboards/lead/', LeadDashboardView.as_view()),
    path('dashboard/developer/', DeveloperDashboardView.as_view(), name='dashboard_developer'),
    path('dashboards/developer', DeveloperDashboardView.as_view()),
    path('dashboards/developer/', DeveloperDashboardView.as_view()),
    path('dashboard/qa/', QaDashboardView.as_view(), name='dashboard_qa'),
    path('dashboards/qa', QaDashboardView.as_view()),
    path('dashboards/qa/', QaDashboardView.as_view()),
]
