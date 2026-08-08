from rest_framework.routers import DefaultRouter
from settings.views import SystemSettingViewSet

router = DefaultRouter()
router.register(r'settings', SystemSettingViewSet, basename='system-setting')

urlpatterns = router.urls
