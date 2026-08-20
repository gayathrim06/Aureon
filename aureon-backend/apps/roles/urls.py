from rest_framework.routers import DefaultRouter
from roles.views import RoleViewSet

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')

urlpatterns = router.urls
