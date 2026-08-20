from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from roles.models import Role

class UserAuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.role_admin = Role.objects.create(code='ROLE_ADMIN', name='System Admin', level=1)
        self.role_dev = Role.objects.create(code='ROLE_DEV', name='Developer', level=4)
        
        self.user_admin = User.objects.create_user(
            email='admin@aureon.com',
            password='Aureon@123',
            full_name='System Admin',
            role=self.role_admin
        )
        self.user_dev = User.objects.create_user(
            email='ram.dev@aureon.com',
            password='Aureon@123',
            full_name='Ram Kumar',
            role=self.role_dev
        )

    def test_jwt_login_success(self):
        url = reverse('auth_login')
        response = self.client.post(url, {'email': 'admin@aureon.com', 'password': 'Aureon@123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['role_code'], 'ROLE_ADMIN')

    def test_jwt_login_invalid_password(self):
        url = reverse('auth_login')
        response = self.client.post(url, {'email': 'admin@aureon.com', 'password': 'WrongPassword'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
