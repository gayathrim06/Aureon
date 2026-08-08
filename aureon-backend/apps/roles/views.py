from rest_framework import viewsets, permissions
from roles.models import Role
from roles.serializers import RoleSerializer
from permissions.permissions import IsAdminUserRole

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsAdminUserRole()]
        return super().get_permissions()
