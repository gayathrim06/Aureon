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
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name', 'phone', 'employee_id',
            'role_code', 'department', 'designation', 'gender', 'avatar_preset',
            'profile_image', 'date_of_birth', 'pet_name', 'school_friend_name', 'password'
        ]
        extra_kwargs = {
            'full_name': {'required': False, 'allow_blank': True},
            'email': {'required': True},
            'username': {'required': False, 'allow_blank': True, 'allow_null': True},
            'date_of_birth': {'required': False, 'allow_null': True},
            'pet_name': {'required': False, 'allow_blank': True, 'allow_null': True},
            'school_friend_name': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)

        # Map fullName -> full_name
        if 'fullName' in mutable_data and not mutable_data.get('full_name'):
            mutable_data['full_name'] = mutable_data.pop('fullName')

        # Map dateOfBirth -> date_of_birth
        if 'dateOfBirth' in mutable_data and not mutable_data.get('date_of_birth'):
            dob = mutable_data.pop('dateOfBirth')
            mutable_data['date_of_birth'] = dob if dob else None

        if mutable_data.get('date_of_birth') == '':
            mutable_data['date_of_birth'] = None

        # Map security question fields
        if 'bestFriendName' in mutable_data:
            val = mutable_data.pop('bestFriendName')
            if not mutable_data.get('school_friend_name'):
                mutable_data['school_friend_name'] = val
            if not mutable_data.get('pet_name'):
                mutable_data['pet_name'] = val

        if 'schoolFriendName' in mutable_data and not mutable_data.get('school_friend_name'):
            mutable_data['school_friend_name'] = mutable_data.pop('schoolFriendName')

        if 'petName' in mutable_data and not mutable_data.get('pet_name'):
            mutable_data['pet_name'] = mutable_data.pop('petName')

        # Map role -> role_code
        if 'role' in mutable_data and not mutable_data.get('role_code'):
            role_val = mutable_data.pop('role')
            role_map = {
                'Developer': 'ROLE_DEV',
                'Team Lead': 'ROLE_LEAD',
                'QA Engineer': 'ROLE_QA',
                'Project Manager': 'ROLE_PM',
                'Admin': 'ROLE_ADMIN',
                'ROLE_DEV': 'ROLE_DEV',
                'ROLE_LEAD': 'ROLE_LEAD',
                'ROLE_QA': 'ROLE_QA',
                'ROLE_PM': 'ROLE_PM',
                'ROLE_ADMIN': 'ROLE_ADMIN',
            }
            mutable_data['role_code'] = role_map.get(role_val, 'ROLE_DEV')

        if 'roleCode' in mutable_data and not mutable_data.get('role_code'):
            mutable_data['role_code'] = mutable_data.pop('roleCode')

        # Fallback for full_name if empty
        if not mutable_data.get('full_name'):
            email = mutable_data.get('email', '')
            mutable_data['full_name'] = email.split('@')[0].capitalize() if email else 'User'

        return super().to_internal_value(mutable_data)

    def create(self, validated_data):
        role_code = validated_data.pop('role_code', 'ROLE_DEV')
        password = validated_data.pop('password')
        
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

        validated_data['must_change_password'] = False
        validated_data['first_login'] = False

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

