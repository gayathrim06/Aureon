from rest_framework.routers import DefaultRouter
from sprints.views import SprintViewSet

router = DefaultRouter()
router.register(r'sprints', SprintViewSet, basename='sprint')

urlpatterns = router.urls
