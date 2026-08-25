from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from roles.models import Role
from authentication.models import UserSession

class UserSessionAndLockoutTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.role_dev = Role.objects.create(code='ROLE_DEV', name='Developer', level=4)
        self.user = User.objects.create_user(
            email='test.dev@aureon.com',
            password='AureonPassword123',
            full_name='Test Developer',
            role=self.role_dev
        )

    def test_login_creates_active_session(self):
        url = reverse('auth_login')
        response = self.client.post(url, {'email': 'test.dev@aureon.com', 'password': 'AureonPassword123'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('session_token', response.data)
        
        # Verify UserSession database record created
        session = UserSession.objects.filter(user=self.user, is_active=True).first()
        self.assertIsNotNone(session)
        self.assertEqual(session.user.email, 'test.dev@aureon.com')

    def test_account_lockout_after_5_failed_attempts(self):
        url = reverse('auth_login')
        
        # Fail 5 consecutive times
        for _ in range(5):
            self.client.post(url, {'email': 'test.dev@aureon.com', 'password': 'WrongPassword'})

        self.user.refresh_from_db()
        self.assertEqual(self.user.failed_login_attempts, 5)
        self.assertIsNotNone(self.user.lockout_until)

        # 6th attempt should return 429 Too Many Requests
        response = self.client.post(url, {'email': 'test.dev@aureon.com', 'password': 'AureonPassword123'})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertTrue(response.data.get('is_locked'))
