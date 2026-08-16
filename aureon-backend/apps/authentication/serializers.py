from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.models import User
from users.serializers import UserSerializer
from roles.models import Role
from authentication.models import UserSession

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT Token Login Serializer.
    Accepts email as login username and returns user profile & role alongside tokens.
    """
    username_field = 'email'

    def validate(self, attrs):
        data = super().validate(attrs)
        user_data = UserSerializer(self.user).data
        data['user'] = user_data
        data['must_change_password'] = self.user.must_change_password
        return data


class UserSessionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = UserSession
        fields = [
            'id', 'user', 'user_email', 'user_name', 'session_token',
            'ip_address', 'user_agent', 'device_type', 'login_at',
            'last_activity', 'expires_at', 'is_active'
        ]


class RegisterSerializer(serializers.ModelSerializer):
    role_code = serializers.CharField(write_only=True, required=False, default='ROLE_DEV')
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name', 'phone', 'employee_id',
            'role_code', 'department', 'designation', 'gender', 'avatar_preset',
            'profile_image', 'date_of_birth', 'pet_name', 'school_friend_name', 'password'
        ]

    def create(self, validated_data):
        role_code = validated_data.pop('role_code', 'ROLE_DEV')
        password = validated_data.pop('password')
        
        if not validated_data.get('username'):
            validated_data['username'] = validated_data['email'].split('@')[0]

        user = User(**validated_data)
        user.set_password(password)
        
        try:
            role = Role.objects.get(code=role_code)
            user.role = role
        except Role.DoesNotExist:
            pass

        user.save()
        return user



class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    reset_token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)


class ResetPasswordWithSecuritySerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    pet_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    school_friend_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    new_password = serializers.CharField(required=True, min_length=8)

