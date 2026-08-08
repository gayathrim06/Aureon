// Role-Based Access Control (RBAC) & Security Service
import { initialRoles } from './mockData';

export const ROLES = {
  SYSTEM_ADMIN: 'ROLE_ADMIN',
  PROJECT_MANAGER: 'ROLE_PM',
  TEAM_LEAD: 'ROLE_LEAD',
  DEVELOPER: 'ROLE_DEV',
  QA_ENGINEER: 'ROLE_QA'
};

export const getRoleDefinition = (roleId) => {
  return initialRoles.find(r => r.id === roleId) || null;
};

export const hasPermission = (userRole, requiredPermission) => {
  if (!userRole) return false;
  const roleDef = getRoleDefinition(userRole);
  if (!roleDef) return false;
  if (roleDef.permissions.includes('admin:all')) return true;
  return roleDef.permissions.includes(requiredPermission);
};

export const checkApiGuard = ({ user, requiredPermission, requiredRole, resourceOwnerId }) => {
  if (!user) {
    return {
      allowed: false,
      statusCode: 401,
      error: 'UNAUTHENTICATED',
      message: 'HTTP 401: Authentication required. Valid JWT access token missing or expired.'
    };
  }

  if (requiredRole && user.role !== requiredRole && user.role !== ROLES.SYSTEM_ADMIN) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'FORBIDDEN_ROLE_MISMATCH',
      message: `HTTP 403 Forbidden: Your role (${user.role}) is unauthorized to perform this operation.`
    };
  }

  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'FORBIDDEN_PERMISSION_DENIED',
      message: `HTTP 403 Forbidden: Insufficient permissions. Required: [${requiredPermission}].`
    };
  }

  if (resourceOwnerId && user.id !== resourceOwnerId && user.role !== ROLES.SYSTEM_ADMIN && user.role !== ROLES.PROJECT_MANAGER) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'FORBIDDEN_OBJECT_LEVEL_DENIED',
      message: 'HTTP 403 Forbidden: Object-level access denied. You are not the owner of this resource.'
    };
  }

  return { allowed: true, statusCode: 200 };
};
