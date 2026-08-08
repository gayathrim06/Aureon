from rest_framework.routers import DefaultRouter
from projects.views import ProjectViewSet, MilestoneViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'milestones', MilestoneViewSet, basename='milestone')

urlpatterns = router.urls
