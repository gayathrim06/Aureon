from rest_framework.routers import DefaultRouter
from permissions.views import PermissionTokenViewSet

router = DefaultRouter()
router.register(r'permissions', PermissionTokenViewSet, basename='permission')

urlpatterns = router.urls
