from rest_framework import serializers
from permissions.models import PermissionToken

class PermissionTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PermissionToken
        fields = '__all__'
