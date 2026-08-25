from rest_framework import serializers, viewsets, permissions
from audit_logs.models import AuditLog
from permissions.permissions import IsAdminUserRole

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]
    search_fields = ['user_email', 'action', 'resource', 'ip_address']
