from django.urls import path
from rest_framework.routers import DefaultRouter
from project_health.views import ProjectHealthViewSet, CalculateProjectHealthView

router = DefaultRouter()
router.register(r'project-health/scores', ProjectHealthViewSet, basename='project-health-score')

urlpatterns = [
    path('project-health/calculate/<uuid:project_id>/', CalculateProjectHealthView.as_view(), name='calculate_project_health'),
] + router.urls
