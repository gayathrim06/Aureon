// Aureon Enterprise Initial Seed & Role Configuration
// All user and entity arrays are kept empty by default so they only reflect database contents!

export const initialRoles = [
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

export const initialUsers = [
  {
    id: 'usr_1',
    name: 'Gayathri',
    email: 'admin@aureon.com',
    role: 'ROLE_ADMIN',
    status: 'ACTIVE',
    avatar: null,
    title: 'System Administrator & CTO',
    department: 'Executive Office',
    lastActive: 'Just now',
    online: true,
    failedLogins: 0,
    mfaEnabled: true
  }
];

// All dummy lists are kept completely empty so we do not display any unwanted fake records
export const initialOrganizations = [];
export const initialTeams = [];
export const initialProjects = [];
export const initialTasks = [];
export const initialCommitHistory = [];
export const initialPullRequests = [];
export const initialCodeSmells = [];
export const initialBugs = [];
export const initialTestCases = [];
export const initialTestSuites = [];
export const initialMilestones = [];
export const initialCalendarEvents = [];
export const initialSprints = [];
export const initialRepositories = [];
export const initialNotifications = [];
export const sonarQubePerProject = {};
export const initialSonarQube = [];
export const initialAuditLogs = [];
export const initialSystemLogs = [];
export const developerMetrics = [];

export const systemHealthMetrics = {
  cpuUsage: '14%',
  memoryUsage: '3.2 GB / 16 GB',
  storageUsage: '142 GB / 1 TB (14.2%)',
  apiStatus: 'OPERATIONAL (99.99% Uptime)',
  apiResponseTimeAvg: '24ms',
  failedLogins24h: 0,
  securityAlertsCount: 0
};

export const platformSettings = {
  jwtAccessExpiry: '15 minutes',
  jwtRefreshExpiry: '7 days',
  passwordMinLength: 12,
  passwordRequireUppercase: true,
  passwordRequireSpecialChar: true,
  maxFailedLogins: 5,
  lockoutDuration: '15 minutes',
  rateLimitWindow: '15 minutes',
  rateLimitMax: 20,
  corsAllowedOrigins: ['http://localhost:5173', 'https://app.aureon.io'],
  mfaEnforced: false,
  defaultTheme: 'dark',
  sessionTimeout: 3600,
  auditRetentionDays: 365
};
