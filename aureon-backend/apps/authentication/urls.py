from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from authentication.views import (
    CustomTokenObtainPairView, RegisterView, LogoutView, ChangePasswordView,
    ForgotPasswordView, ResetPasswordView, ResetPasswordWithSecurityView, VerifyEmailView,
    UserSessionListView, RevokeSessionView, RevokeAllSessionsView
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth_reset_password'),
    path('reset-password-security/', ResetPasswordWithSecurityView.as_view(), name='auth_reset_password_security'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth_verify_email'),
    
    # Session Management Routes
    path('sessions/', UserSessionListView.as_view(), name='auth_session_list'),
    path('sessions/revoke/<uuid:session_id>/', RevokeSessionView.as_view(), name='auth_session_revoke'),
    path('sessions/revoke-all/', RevokeAllSessionsView.as_view(), name='auth_session_revoke_all'),
]
