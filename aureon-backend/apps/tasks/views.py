from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from tasks.models import Task, TaskComment, TaskAttachment, TaskHistory
from tasks.serializers import TaskSerializer, TaskCommentSerializer, TaskAttachmentSerializer
from permissions.permissions import IsDeveloper, IsTeamLead, IsProjectManager, IsAdminUserRole

class TaskViewSet(viewsets.ModelViewSet):
    """
    Task ViewSet with STRICT Role-Based Access Control Filtering.
    - Developer (ROLE_DEV): ONLY receives tasks assigned to them (assigned_to = request.user).
    - Project Manager (ROLE_PM): Receives tasks within projects they manage.
    - Team Lead (ROLE_LEAD): Receives tasks within teams they lead.
    - QA Engineer (ROLE_QA): Receives testing tasks & assigned defects.
    - Administrator (ROLE_ADMIN): Receives all tasks.
    """
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['project', 'sprint', 'status', 'priority', 'assigned_to']
    search_fields = ['task_id', 'title', 'description']

    def get_queryset(self):
        user = self.request.user
        role_code = user.role_code if user and user.role else 'ROLE_DEV'

        # Administrator: view all
        if role_code == 'ROLE_ADMIN' or user.is_superuser:
            return Task.objects.all()

        # Project Manager: view tasks in managed projects
        if role_code == 'ROLE_PM':
            return Task.objects.filter(project__manager=user)

        # Team Lead: view tasks in teams led by user
        if role_code == 'ROLE_LEAD':
            return Task.objects.filter(project__lead=user)

        # QA Engineer: view testing tasks or tasks assigned to QA
        if role_code == 'ROLE_QA':
            return Task.objects.filter(status='TESTING') | Task.objects.filter(assigned_to=user)

        # Developer (ROLE_DEV): STRICT ISOLATION -> ONLY own assigned tasks
        return Task.objects.filter(assigned_to=user)

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)

    @extend_schema(summary="Add Comment to Task")
    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        task = self.get_object()
        text = request.data.get('text')
        if not text:
            return Response({"success": False, "message": "Comment text required."}, status=status.HTTP_400_BAD_REQUEST)
        
        comment = TaskComment.objects.create(task=task, author=request.user, text=text)
        serializer = TaskCommentSerializer(comment)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_201_CREATED)

    @extend_schema(summary="Update Kanban Task Status")
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        valid_statuses = [c[0] for c in Task.KANBAN_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({"success": False, "message": f"Invalid status. Must be one of {valid_statuses}"}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = task.status
        task.status = new_status
        if new_status == 'COMPLETED':
            task.completion_percentage = 100
        task.save()

        # Record history
        TaskHistory.objects.create(task=task, actor=request.user, action=f"Status changed from {old_status} to {new_status}")
        return Response({"success": True, "task_id": task.task_id, "new_status": task.status}, status=status.HTTP_200_OK)


class MyTasksView(generics.ListAPIView):
    """
    GET /api/v1/my/tasks/
    STRICT USER ISOLATION:
    Returns ONLY tasks assigned to the currently logged-in user.
    """
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Logged-In User's Assigned Tasks",
        description="Returns ONLY tasks assigned to the current authenticated user. User isolation strictly enforced."
    )
    def get_queryset(self):
        return Task.objects.filter(assigned_to=self.request.user)
