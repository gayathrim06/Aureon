from datetime import timedelta
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiResponse

from authentication.models import UserSession
from authentication.serializers import (
    CustomTokenObtainPairSerializer, RegisterSerializer, LogoutSerializer,
    ChangePasswordSerializer, ForgotPasswordSerializer, ResetPasswordSerializer,
    ResetPasswordWithSecuritySerializer, UserSessionSerializer
)
from users.serializers import UserSerializer
from users.models import User
from audit_logs.models import AuditLog

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/v1/auth/login/
    JWT Email/Password Authentication with Account Lockout & Session Tracking.
    """
    serializer_class = CustomTokenObtainPairSerializer

    @extend_schema(
        summary="JWT Login & Session Creation",
        description="Authenticates user via corporate email & password. Enforces account lockout (5 failed attempts) and creates active UserSession.",
        responses={200: OpenApiResponse(description="Login successful with tokens, user details & active session_id")}
    )
    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()

        # 1. User Security & Lockout Validation
        user = User.objects.filter(email=email).first()
        if user:
            # Check if account is locked out
            if user.lockout_until and user.lockout_until > timezone.now():
                remaining_mins = int((user.lockout_until - timezone.now()).total_seconds() / 60) + 1
                return Response({
                    "success": False,
                    "is_locked": True,
                    "message": f"Account locked due to 5 consecutive failed login attempts. Retry in {remaining_mins} minutes or contact System Admin."
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)

            # Check if user account is deactivated
            if not user.is_active:
                return Response({
                    "success": False,
                    "message": "Account has been deactivated. Please contact System Administrator."
                }, status=status.HTTP_403_FORBIDDEN)

        # 2. Execute Authentication
        try:
            response = super().post(request, *args, **kwargs)
        except Exception as exc:
            if user:
                user.failed_login_attempts += 1
                if user.failed_login_attempts >= 5:
                    user.lockout_until = timezone.now() + timedelta(minutes=15)
                user.save(update_fields=['failed_login_attempts', 'lockout_until'])

                AuditLog.objects.create(
                    user=user,
                    user_email=user.email,
                    role_name=user.role_name,
                    ip_address=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
                    action='USER_LOGIN_FAILED',
                    status='FAILURE',
                    details=f"Failed attempt {user.failed_login_attempts}/5"
                )

            return Response({
                "success": False,
                "message": "Invalid corporate email or password. Please verify your credentials."
            }, status=status.HTTP_401_UNAUTHORIZED)

        # 3. On Successful Login: Reset lockout counters & Create UserSession
        if user and response.status_code == status.HTTP_200_OK:
            user.failed_login_attempts = 0
            user.lockout_until = None
            user.save(update_fields=['failed_login_attempts', 'lockout_until'])

            ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0]
            user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown Web Browser')
            
            session_token = f"sess_{user.id}_{int(timezone.now().timestamp())}"
            refresh_token = response.data.get('refresh', '')

            session = UserSession.objects.create(
                user=user,
                session_token=session_token,
                refresh_token_jti=refresh_token[:50] if refresh_token else None,
                ip_address=ip_address,
                user_agent=user_agent[:255],
                device_type=self.parse_device_type(user_agent),
                expires_at=timezone.now() + timedelta(days=7),
                is_active=True
            )

            response.data['session_id'] = str(session.id)
            response.data['session_token'] = session.session_token

            AuditLog.objects.create(
                user=user,
                user_email=user.email,
                role_name=user.role_name,
                ip_address=ip_address,
                user_agent=user_agent[:255],
                action='USER_LOGIN_SUCCESS',
                status='SUCCESS',
                details=f"Session created: {session.session_token}"
            )

        return response

    @staticmethod
    def parse_device_type(user_agent):
        ua = user_agent.lower()
        if 'mobile' in ua or 'android' in ua or 'iphone' in ua:
            return 'Mobile Browser'
        if 'mac' in ua:
            return 'macOS Browser'
        if 'windows' in ua:
            return 'Windows Browser'
        if 'linux' in ua:
            return 'Linux Browser'
        return 'Web Desktop Browser'


class UserSessionListView(APIView):
    """
    GET /api/v1/auth/sessions/
    Lists all active login sessions for the authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="List User Active Sessions", responses={200: UserSessionSerializer(many=True)})
    def get(self, request):
        sessions = UserSession.objects.filter(user=request.user, is_active=True)
        serializer = UserSessionSerializer(sessions, many=True)
        return Response({"success": True, "count": len(serializer.data), "sessions": serializer.data}, status=status.HTTP_200_OK)


class RevokeSessionView(APIView):
    """
    POST /api/v1/auth/sessions/revoke/<session_id>/
    Revokes a specific active user session.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Revoke User Session")
    def post(self, request, session_id):
        session = UserSession.objects.filter(id=session_id, user=request.user).first()
        if not session:
            return Response({"success": False, "message": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        session.is_active = False
        session.save()
        return Response({"success": True, "message": f"Session {session.session_token} revoked."}, status=status.HTTP_200_OK)


class RevokeAllSessionsView(APIView):
    """
    POST /api/v1/auth/sessions/revoke-all/
    Revokes all active sessions for the user across all devices.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Revoke All User Sessions")
    def post(self, request):
        UserSession.objects.filter(user=request.user, is_active=True).update(is_active=False)
        return Response({"success": True, "message": "All active sessions have been revoked."}, status=status.HTTP_200_OK)


class RegisterView(APIView):
    """
    POST /api/v1/auth/register/
    Self-service account registration for new users.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Self-Service User Registration",
        description="Registers a new user account on Aureon SaaS, assigns selected role, and generates JWT tokens.",
        request=RegisterSerializer
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            
            # Create session for registered user
            session = UserSession.objects.create(
                user=user,
                session_token=f"sess_{user.id}_{int(timezone.now().timestamp())}",
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
                expires_at=timezone.now() + timedelta(days=7),
                is_active=True
            )

            return Response({
                "success": True,
                "message": "User registered successfully.",
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "session_token": session.session_token
            }, status=status.HTTP_201_CREATED)
        err_msg = "Registration failed."
        if serializer.errors:
            messages = []
            for field, errs in serializer.errors.items():
                if isinstance(errs, list):
                    clean_errs = [str(e) for e in errs]
                    messages.append(f"{field.replace('_', ' ').capitalize()}: {' '.join(clean_errs)}")
                else:
                    messages.append(f"{field.replace('_', ' ').capitalize()}: {errs}")
            err_msg = "; ".join(messages)

        return Response({
            "success": False,
            "message": err_msg,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklists the refresh token to revoke user session.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Logout & Token Blacklist",
        description="Revokes the provided refresh token by placing it on the SimpleJWT blacklist.",
        request=LogoutSerializer
    )
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            # Deactivate current active user session
            UserSession.objects.filter(user=request.user, is_active=True).update(is_active=False)

            return Response({"success": True, "message": "Successfully logged out and session terminated."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/change-password/
    Allows authenticated user to change password and resets force-change flag.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Change Password", request=ChangePasswordSerializer)
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"success": False, "message": "Incorrect current password."}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.validated_data['new_password'])
            user.must_change_password = False
            user.save()
            return Response({"success": True, "message": "Password updated successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    """POST /api/v1/auth/forgot-password/"""
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Forgot Password Link Dispatch", request=ForgotPasswordSerializer)
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            if user:
                # Placeholder for email dispatch
                pass
            return Response({"success": True, "message": "If the email exists, a password reset link has been sent."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    """POST /api/v1/auth/reset-password/"""
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Reset Password with Token", request=ResetPasswordSerializer)
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = User.objects.filter(email=serializer.validated_data['email']).first()
            if user:
                user.set_password(serializer.validated_data['new_password'])
                user.must_change_password = False
                user.save()
                return Response({"success": True, "message": "Password reset successful. You may now login."}, status=status.HTTP_200_OK)
            return Response({"success": False, "message": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    """POST /api/v1/auth/verify-email/"""
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Email Verification Placeholder")
    def post(self, request):
        return Response({"success": True, "message": "Email verification confirmed."}, status=status.HTTP_200_OK)


class ResetPasswordWithSecurityView(APIView):
    """POST /api/v1/auth/reset-password-security/"""
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Reset Password via Security Answers", request=ResetPasswordWithSecuritySerializer)
    def post(self, request):
        serializer = ResetPasswordWithSecuritySerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].strip().lower()
        dob = serializer.validated_data.get('date_of_birth')
        pet_name = (serializer.validated_data.get('pet_name') or '').strip().lower()
        school_friend = (serializer.validated_data.get('school_friend_name') or '').strip().lower()
        new_password = serializer.validated_data['new_password']

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"success": False, "message": "No account found with this email address."}, status=status.HTTP_404_NOT_FOUND)

        # Verification logic: match DOB, pet_name, or school_friend_name
        verified = False
        if dob and user.date_of_birth and str(user.date_of_birth) == str(dob):
            verified = True
        if pet_name and user.pet_name and user.pet_name.strip().lower() == pet_name:
            verified = True
        if school_friend and user.school_friend_name and user.school_friend_name.strip().lower() == school_friend:
            verified = True

        if not verified:
            return Response({
                "success": False,
                "message": "Security verification failed. The provided Date of Birth, Pet Name, or Friend Name does not match our records."
            }, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.must_change_password = False
        user.save()

        AuditLog.objects.create(
            user=user,
            user_email=user.email,
            role_name=user.role_name,
            action='PASSWORD_RESET_SECURITY_SUCCESS',
            status='SUCCESS',
            details="Password reset via security question verification"
        )

        return Response({"success": True, "message": "Password updated successfully! You can now log in with your new password."}, status=status.HTTP_200_OK)

