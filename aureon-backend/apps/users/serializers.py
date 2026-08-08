from rest_framework import serializers
from users.models import User
from roles.models import Role

class UserSerializer(serializers.ModelSerializer):
    role_code = serializers.CharField(source='role.code', read_only=True, default=None)
    role_name = serializers.CharField(source='role.name', read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name', 'phone', 'employee_id',
            'role', 'role_code', 'role_name', 'department', 'designation',
            'profile_image', 'must_change_password', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']


class CreateUserSerializer(serializers.ModelSerializer):
    role_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name', 'phone', 'employee_id',
            'role_id', 'department', 'designation', 'password'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        role_id = validated_data.pop('role_id', None)
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        if role_id:
            try:
                user.role = Role.objects.get(id=role_id)
            except Role.DoesNotExist:
                pass
        user.save()
        return user
