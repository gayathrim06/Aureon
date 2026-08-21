from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from roles.models import Role
from projects.models import Project
from tasks.models import Task

class TaskUserIsolationTests(TestCase):
    def setUp(self):
        self.role_dev = Role.objects.create(code='ROLE_DEV', name='Developer', level=4)
        self.ram = User.objects.create_user(email='ram.dev@aureon.com', password='Aureon@123', full_name='Ram Kumar', role=self.role_dev)
        self.venu = User.objects.create_user(email='venu.dev@aureon.com', password='Aureon@123', full_name='Venu Gopal', role=self.role_dev)
        
        self.project = Project.objects.create(name='Aureon Core Cloud', key='ACCA')
        
        self.task_ram = Task.objects.create(task_id='TSK-101', title='Task for Ram', project=self.project, assigned_to=self.ram)
        self.task_venu = Task.objects.create(task_id='TSK-102', title='Task for Venu', project=self.project, assigned_to=self.venu)

    def test_ram_gets_only_ram_tasks(self):
        client = APIClient()
        client.force_authenticate(user=self.ram)
        url = reverse('my_tasks')
        response = client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task_ids = [t['task_id'] for t in response.data['results']]
        self.assertIn('TSK-101', task_ids)
        self.assertNotIn('TSK-102', task_ids)

    def test_venu_gets_only_venu_tasks(self):
        client = APIClient()
        client.force_authenticate(user=self.venu)
        url = reverse('my_tasks')
        response = client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task_ids = [t['task_id'] for t in response.data['results']]
        self.assertIn('TSK-102', task_ids)
        self.assertNotIn('TSK-101', task_ids)
