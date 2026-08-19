from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

api_v1_patterns = [
    path('auth/', include('authentication.urls')),
    path('', include('users.urls')),
    path('', include('roles.urls')),
    path('', include('permissions.urls')),
    path('', include('projects.urls')),
    path('', include('teams.urls')),
    path('', include('sprints.urls')),
    path('', include('tasks.urls')),
    path('', include('bugs.urls')),
    path('', include('repositories.urls')),
    path('', include('github_integration.urls')),
    path('', include('sonarqube.urls')),
    path('', include('project_health.urls')),
    path('', include('dashboard.urls')),
    path('', include('notifications.urls')),
    path('', include('reports.urls')),
    path('', include('audit_logs.urls')),
    path('', include('settings.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1_patterns)),

    # OpenAPI 3.0 / Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
