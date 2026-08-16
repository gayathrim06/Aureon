from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from users.models import User
from users.serializers import UserSerializer, CreateUserSerializer
from permissions.permissions import IsAdminUserRole

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateUserSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [IsAdminUserRole()]
        return super().get_permissions()

    @extend_schema(summary="Current User Profile")
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        if request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({"success": True, "message": "Profile updated successfully", "data": serializer.data})
        serializer = self.get_serializer(request.user)
        return Response({"success": True, "data": serializer.data})

