from rest_framework import serializers
from users.models import User
from roles.models import Role

class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name', read_only=True)
    role = serializers.CharField(source='role.code', read_only=True, default='ROLE_DEV')
    role_code = serializers.CharField(source='role.code', read_only=True, default=None)
    role_name = serializers.CharField(source='role.name', read_only=True, default=None)
    avatar_url = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'name', 'full_name', 'phone', 'employee_id',
            'role', 'role_code', 'role_name', 'department', 'designation',
            'gender', 'avatar_preset', 'avatar_url', 'profile_image',
            'must_change_password', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']


class CreateUserSerializer(serializers.ModelSerializer):
    role_id = serializers.UUIDField(write_only=True, required=False)
    role_code = serializers.CharField(write_only=True, required=False)
    role = serializers.CharField(write_only=True, required=False)
    name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'name', 'full_name', 'phone', 'employee_id',
            'role_id', 'role_code', 'role', 'department', 'designation', 'gender', 'avatar_preset',
            'profile_image', 'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False, 'allow_blank': True},
            'username': {'required': False, 'allow_blank': True},
            'full_name': {'required': False, 'allow_blank': True}
        }

    def create(self, validated_data):
        role_id = validated_data.pop('role_id', None)
        role_code = validated_data.pop('role_code', None) or validated_data.pop('role', 'ROLE_DEV')
        password = validated_data.pop('password', None) or 'Aureon@123'
        
        name = validated_data.pop('name', None)
        if name and not validated_data.get('full_name'):
            validated_data['full_name'] = name

        email = validated_data.get('email', '')
        if not validated_data.get('username'):
            base_username = email.split('@')[0] if email else 'user'
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1
            validated_data['username'] = username

        if not validated_data.get('employee_id'):
            import random
            emp_id = f"EMP{random.randint(1000, 9999)}"
            while User.objects.filter(employee_id=emp_id).exists():
                emp_id = f"EMP{random.randint(1000, 9999)}"
            validated_data['employee_id'] = emp_id

        # Flag user to change password on first login
        validated_data['must_change_password'] = True
        validated_data['first_login'] = True

        user = User(**validated_data)
        user.set_password(password)

        if role_id:
            try:
                user.role = Role.objects.get(id=role_id)
            except Role.DoesNotExist:
                pass
        elif role_code:
            role_map = {
                'Developer': 'ROLE_DEV',
                'Team Lead': 'ROLE_LEAD',
                'QA Engineer': 'ROLE_QA',
                'Project Manager': 'ROLE_PM',
                'Admin': 'ROLE_ADMIN',
            }
            code = role_map.get(role_code, role_code)
            try:
                user.role = Role.objects.get(code=code)
            except Role.DoesNotExist:
                pass

        user.save()
        return user

