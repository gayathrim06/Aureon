from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from users.models import User
from users.serializers import UserSerializer, CreateUserSerializer
from permissions.permissions import IsAdminUserRole

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateUserSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user_data = UserSerializer(user).data
            return Response({
                "success": True,
                "message": f"User {user.full_name} ({user.email}) provisioned successfully.",
                "data": user_data,
                **user_data
            }, status=status.HTTP_201_CREATED)
        
        error_msg = "User provisioning failed. " + ", ".join([f"{k}: {' '.join(v)}" if isinstance(v, list) else str(v) for k, v in serializer.errors.items()])
        return Response({
            "success": False,
            "message": error_msg,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        from authentication.models import UserSession
        from teams.models import Team, TeamMember

        UserSession.objects.filter(user=user).delete()
        TeamMember.objects.filter(user=user).delete()
        Team.objects.filter(lead=user).update(lead=None)

        user.delete()
        return Response({"success": True, "message": "User deleted successfully"}, status=status.HTTP_200_OK)

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

