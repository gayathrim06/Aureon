from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from bugs.models import Bug
from bugs.serializers import BugSerializer

class BugViewSet(viewsets.ModelViewSet):
    queryset = Bug.objects.all()
    serializer_class = BugSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['project', 'severity', 'status', 'assigned_developer', 'assigned_qa', 'reporter']

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    @extend_schema(summary="Update Bug Status / Verify Defect Fix")
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        bug = self.get_object()
        new_status = request.data.get('status')
        valid_statuses = [c[0] for c in Bug.STATUS_CHOICES]
        
        if new_status not in valid_statuses:
            return Response({"success": False, "message": f"Invalid status. Must be one of {valid_statuses}"}, status=status.HTTP_400_BAD_REQUEST)

        # RBAC Check: Only QA Engineers or Admins can close defects
        if new_status in ['RESOLVED', 'CLOSED'] and not (request.user.role and request.user.role.code in ['ROLE_QA', 'ROLE_ADMIN']):
            return Response({"success": False, "message": "Only QA Engineers or System Administrators can close defect reports."}, status=status.HTTP_403_FORBIDDEN)

        bug.status = new_status
        bug.save()
        return Response({"success": True, "bug_id": bug.bug_id, "status": bug.status}, status=status.HTTP_200_OK)
