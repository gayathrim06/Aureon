from django.urls import path
from dashboard.views import (
    AdminDashboardView, ManagerDashboardView, LeadDashboardView,
    DeveloperDashboardView, QaDashboardView
)

urlpatterns = [
    path('dashboard/admin/', AdminDashboardView.as_view(), name='dashboard_admin'),
    path('dashboard/manager/', ManagerDashboardView.as_view(), name='dashboard_manager'),
    path('dashboard/lead/', LeadDashboardView.as_view(), name='dashboard_lead'),
    path('dashboard/developer/', DeveloperDashboardView.as_view(), name='dashboard_developer'),
    path('dashboard/qa/', QaDashboardView.as_view(), name='dashboard_qa'),
]
