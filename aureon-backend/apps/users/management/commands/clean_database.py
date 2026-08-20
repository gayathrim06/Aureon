from django.core.management.base import BaseCommand
from django.core.management import call_command
from roles.models import Role
from permissions.models import PermissionToken, RolePermission
from users.models import User

class Command(BaseCommand):
    help = 'Wipes all demo users, projects, tasks, and data from the database and initializes a fresh System Admin account.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Flushing all data from database..."))
        call_command('flush', verbosity=0, interactive=False)
        self.stdout.write(self.style.SUCCESS("Database tables successfully flushed."))

        self.stdout.write(self.style.NOTICE("Initializing system roles & permissions..."))

        # 1. Create System Roles
        roles_data = [
            {'code': 'ROLE_ADMIN', 'name': 'Administrator', 'description': 'Full system administrative access', 'level': 1},
            {'code': 'ROLE_PM', 'name': 'Project Manager', 'description': 'Manages software projects, milestones & sprints', 'level': 2},
            {'code': 'ROLE_LEAD', 'name': 'Team Lead', 'description': 'Manages developer task allocation & code reviews', 'level': 3},
            {'code': 'ROLE_DEV', 'name': 'Developer', 'description': 'Executes code development and updates assigned tasks', 'level': 4},
            {'code': 'ROLE_QA', 'name': 'QA Engineer', 'description': 'Logs defects, executes test cases, and verifies fixes', 'level': 5},
        ]

        roles_dict = {}
        for rdata in roles_data:
            role, created = Role.objects.get_or_create(
                code=rdata['code'],
                defaults={'name': rdata['name'], 'description': rdata['description'], 'level': rdata['level']}
            )
            roles_dict[rdata['code']] = role
            self.stdout.write(self.style.SUCCESS(f"  - Role Ready: {role.name} ({role.code})"))

        # 2. Create Permission Tokens & Junction Entries
        permissions_data = [
            {'token': 'admin.all', 'name': 'Global Administrator Access', 'module': 'admin', 'roles': ['ROLE_ADMIN']},
            {'token': 'users.manage', 'name': 'User Management & Provisioning', 'module': 'users', 'roles': ['ROLE_ADMIN']},
            {'token': 'projects.create', 'name': 'Create Project', 'module': 'projects', 'roles': ['ROLE_ADMIN', 'ROLE_PM']},
            {'token': 'projects.edit', 'name': 'Edit Project Details', 'module': 'projects', 'roles': ['ROLE_ADMIN', 'ROLE_PM']},
            {'token': 'tasks.assign', 'name': 'Assign Tasks to Developers', 'module': 'tasks', 'roles': ['ROLE_ADMIN', 'ROLE_PM', 'ROLE_LEAD']},
            {'token': 'tasks.update', 'name': 'Update Task Status', 'module': 'tasks', 'roles': ['ROLE_ADMIN', 'ROLE_PM', 'ROLE_LEAD', 'ROLE_DEV']},
            {'token': 'bugs.create', 'name': 'Log Software Defect', 'module': 'bugs', 'roles': ['ROLE_ADMIN', 'ROLE_QA', 'ROLE_DEV', 'ROLE_LEAD']},
            {'token': 'bugs.close', 'name': 'Verify & Close Defect', 'module': 'bugs', 'roles': ['ROLE_ADMIN', 'ROLE_QA']},
            {'token': 'reports.download', 'name': 'Download PDF Reports', 'module': 'reports', 'roles': ['ROLE_ADMIN', 'ROLE_PM', 'ROLE_LEAD']},
        ]

        for pdata in permissions_data:
            perm, _ = PermissionToken.objects.get_or_create(
                token=pdata['token'],
                defaults={'name': pdata['name'], 'module': pdata['module']}
            )
            for rcode in pdata['roles']:
                if rcode in roles_dict:
                    RolePermission.objects.get_or_create(role=roles_dict[rcode], permission=perm)

        # 3. Create Fresh Administrator Account
        admin_user, _ = User.objects.get_or_create(
            email='admin@aureon.com',
            defaults={
                'username': 'admin',
                'full_name': 'System Administrator',
                'employee_id': 'EMP-001',
                'role': roles_dict['ROLE_ADMIN'],
                'department': 'Executive Management',
                'designation': 'CTO',
                'account_status': 'ACTIVE',
                'email_verified': True,
                'first_login': False,
                'must_change_password': False,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('Aureon@123')
        admin_user.save()

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  AUREON DATABASE HAS BEEN CLEARED AND RESET!"))
        self.stdout.write(self.style.SUCCESS("  Fresh System Admin Account Ready:"))
        self.stdout.write(self.style.SUCCESS("  Email:    admin@aureon.com"))
        self.stdout.write(self.style.SUCCESS("  Password: Aureon@123"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
