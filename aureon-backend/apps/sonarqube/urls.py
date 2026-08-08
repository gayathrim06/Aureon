from rest_framework.routers import DefaultRouter
from sonarqube.views import CodeAnalysisViewSet, QualityGateViewSet

router = DefaultRouter()
router.register(r'sonarqube/analyses', CodeAnalysisViewSet, basename='code-analysis')
router.register(r'sonarqube/gates', QualityGateViewSet, basename='quality-gate')

urlpatterns = router.urls
