export const SYSTEM_ROLES = [
  {
    id: 'ROLE_ADMIN',
    name: 'System Admin',
    description: 'Full administrative access to manage platform, organizations, users, and system configuration.',
    level: 1,
    permissions: [
      'admin:all', 'users:manage', 'org:manage', 'rbac:manage', 'audit:view', 'system:manage',
      'projects:all', 'reports:all', 'settings:all', 'integrations:manage'
    ]
  },
  {
    id: 'ROLE_PM',
    name: 'Project Manager',
    description: 'Manages software projects, sprints, milestones, workloads, and team allocations.',
    level: 2,
    permissions: [
      'projects:create', 'projects:edit', 'projects:archive', 'projects:view',
      'sprints:manage', 'tasks:manage', 'milestones:manage', 'reports:projects',
      'team:assign', 'repository:view', 'sonarqube:view'
    ]
  },
  {
    id: 'ROLE_LEAD',
    name: 'Team Lead',
    description: 'Coordinates developers, reviews code quality, approves completed tasks, and tracks sprint boards.',
    level: 3,
    permissions: [
      'projects:assigned_view', 'sprintboard:manage', 'tasks:assign', 'tasks:approve',
      'developers:monitor', 'codequality:view', 'repository:view', 'sonarqube:reports'
    ]
  },
  {
    id: 'ROLE_DEV',
    name: 'Developer',
    description: 'Executes development tasks, commits code, creates pull requests, and updates Kanban cards.',
    level: 4,
    permissions: [
      'tasks:my_update', 'kanban:move', 'code:commit', 'pr:create', 'repository:view',
      'codequality:view', 'tasks:comment', 'attachments:upload', 'profile:update'
    ]
  },
  {
    id: 'ROLE_QA',
    name: 'QA Engineer',
    description: 'Runs test cases, logs bugs, uploads evidence, and verifies bug fixes.',
    level: 5,
    permissions: [
      'testcases:manage', 'bugs:create', 'bugs:assign', 'bugs:update', 'bugs:verify',
      'evidence:upload', 'reports:bugs', 'repository:view'
    ]
  }
];

export const ROLES = {
  SYSTEM_ADMIN: 'ROLE_ADMIN',
  PROJECT_MANAGER: 'ROLE_PM',
  TEAM_LEAD: 'ROLE_LEAD',
  DEVELOPER: 'ROLE_DEV',
  QA_ENGINEER: 'ROLE_QA'
};

export const getRoleDefinition = (roleId) => {
  return SYSTEM_ROLES.find(r => r.id === roleId) || null;
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
