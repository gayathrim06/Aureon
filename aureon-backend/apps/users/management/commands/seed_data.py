from django.core.management.base import BaseCommand
from roles.models import Role
from permissions.models import PermissionToken, RolePermission
from teams.models import Department, Team
from users.models import User

class Command(BaseCommand):
    help = 'Seeds initial Aureon PostgreSQL roles, permissions, departments, teams, and demo users.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Starting Aureon PostgreSQL database seeding..."))

        # 1. Create Roles
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
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created Role: {role.name}"))

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

        # 3. Create Departments & Teams
        dept_eng, _ = Department.objects.get_or_create(name='Engineering', code='ENG', defaults={'description': 'Software Engineering Department'})
        dept_qa, _ = Department.objects.get_or_create(name='Quality Assurance', code='QA', defaults={'description': 'Quality Assurance & Testing'})
        dept_pm, _ = Department.objects.get_or_create(name='Product Delivery', code='PMO', defaults={'description': 'Project & Product Management'})

        team_core, _ = Team.objects.get_or_create(name='Core Engine Team', department=dept_eng)
        team_frontend, _ = Team.objects.get_or_create(name='UI/UX Frontend Team', department=dept_eng)

        # 4. Create Demo Accounts
        default_password = 'Aureon@123'

        demo_users = [
            {
                'email': 'admin@aureon.com',
                'full_name': 'System Administrator',
                'username': 'admin',
                'employee_id': 'EMP-001',
                'role': roles_dict['ROLE_ADMIN'],
                'department': 'Executive Management',
                'designation': 'CTO'
            },
            {
                'email': 'manager@aureon.com',
                'full_name': 'Sarah Jenkins',
                'username': 'manager',
                'employee_id': 'EMP-002',
                'role': roles_dict['ROLE_PM'],
                'department': 'Product Delivery',
                'designation': 'Senior Project Manager'
            },
            {
                'email': 'lead@aureon.com',
                'full_name': 'David Chen',
                'username': 'lead',
                'employee_id': 'EMP-003',
                'role': roles_dict['ROLE_LEAD'],
                'department': 'Engineering',
                'designation': 'Tech Lead'
            },
            {
                'email': 'ram.dev@aureon.com',
                'full_name': 'Ram Kumar',
                'username': 'ram.dev',
                'employee_id': 'EMP-004',
                'role': roles_dict['ROLE_DEV'],
                'department': 'Engineering',
                'designation': 'Backend Developer'
            },
            {
                'email': 'venu.dev@aureon.com',
                'full_name': 'Venu Gopal',
                'username': 'venu.dev',
                'employee_id': 'EMP-005',
                'role': roles_dict['ROLE_DEV'],
                'department': 'Engineering',
                'designation': 'Frontend Developer'
            },
            {
                'email': 'akhil.dev@aureon.com',
                'full_name': 'Akhil Reddy',
                'username': 'akhil.dev',
                'employee_id': 'EMP-006',
                'role': roles_dict['ROLE_DEV'],
                'department': 'Engineering',
                'designation': 'DevOps Engineer'
            },
            {
                'email': 'venu.qa@aureon.com',
                'full_name': 'Venu QA',
                'username': 'venu.qa',
                'employee_id': 'EMP-007',
                'role': roles_dict['ROLE_QA'],
                'department': 'Quality Assurance',
                'designation': 'QA Automation Lead'
            },
            {
                'email': 'meera.qa@aureon.com',
                'full_name': 'Meera Nair',
                'username': 'meera.qa',
                'employee_id': 'EMP-008',
                'role': roles_dict['ROLE_QA'],
                'department': 'Quality Assurance',
                'designation': 'QA Engineer'
            },
        ]

        for udata in demo_users:
            email = udata['email']
            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.create_user(
                    email=email,
                    password=default_password,
                    full_name=udata['full_name'],
                    username=udata['username'],
                    employee_id=udata['employee_id'],
                    role=udata['role'],
                    department=udata['department'],
                    designation=udata['designation'],
                    first_login=True,
                    must_change_password=True,
                    account_status='ACTIVE'
                )
                self.stdout.write(self.style.SUCCESS(f"Created User: {user.full_name} ({user.email})"))
            else:
                user.set_password(default_password)
                user.role = udata['role']
                user.must_change_password = True
                user.account_status = 'ACTIVE'
                user.save()
                self.stdout.write(self.style.WARNING(f"Updated Password for User: {user.email}"))

        self.stdout.write(self.style.SUCCESS("Aureon PostgreSQL database seeding completed successfully!"))
