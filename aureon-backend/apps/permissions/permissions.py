from rest_framework.permissions import BasePermission

class IsAdminUserRole(BasePermission):
    """Allows access only to System Administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role and request.user.role.code == 'ROLE_ADMIN' or request.user.is_superuser)
        )

class IsProjectManager(BasePermission):
    """Allows access to Project Managers and System Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role and
            request.user.role.code in ['ROLE_PM', 'ROLE_ADMIN']
        )

class IsTeamLead(BasePermission):
    """Allows access to Team Leads, PMs, and System Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role and
            request.user.role.code in ['ROLE_LEAD', 'ROLE_PM', 'ROLE_ADMIN']
        )

class IsDeveloper(BasePermission):
    """Allows access to Developers, Leads, PMs, and Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role and
            request.user.role.code in ['ROLE_DEV', 'ROLE_LEAD', 'ROLE_PM', 'ROLE_ADMIN']
        )

class IsQAEngineer(BasePermission):
    """Allows access to QA Engineers and System Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role and
            request.user.role.code in ['ROLE_QA', 'ROLE_ADMIN']
        )

class HasPermissionToken(BasePermission):
    """
    Database-driven permission check.
    Usage: Set required_permission = 'projects.create' on the View.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.is_superuser or (request.user.role and request.user.role.code == 'ROLE_ADMIN'):
            return True

        required_permission = getattr(view, 'required_permission', None)
        if not required_permission:
            return True

        if not request.user.role:
            return False

        return request.user.role.permissions.filter(token=required_permission, is_active=True).exists()
