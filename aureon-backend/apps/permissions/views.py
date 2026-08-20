from rest_framework import viewsets, permissions
from permissions.models import PermissionToken
from permissions.serializers import PermissionTokenSerializer
from permissions.permissions import IsAdminUserRole

class PermissionTokenViewSet(viewsets.ModelViewSet):
    queryset = PermissionToken.objects.all()
    serializer_class = PermissionTokenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsAdminUserRole()]
        return super().get_permissions()
