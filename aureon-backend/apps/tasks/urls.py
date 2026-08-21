from django.urls import path
from rest_framework.routers import DefaultRouter
from tasks.views import TaskViewSet, MyTasksView

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('my/tasks/', MyTasksView.as_view(), name='my_tasks'),
] + router.urls
