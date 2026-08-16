// Aureon Enterprise Mock Database & Initial Seed Data
// Comprehensive data for all 5 role dashboards (49 pages)

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
    email: 'admin@aureon.io',
    role: 'ROLE_ADMIN',
    status: 'ACTIVE',
    avatar: null,
    title: 'System Administrator & CTO',
    department: 'Executive Office',
    lastActive: 'Just now',
    online: true,
    failedLogins: 0,
    mfaEnabled: true
  },
  {
    id: 'usr_2',
    name: 'Sarah Jenkins',
    email: 'pm@aureon.io',
    role: 'ROLE_PM',
    status: 'ACTIVE',
    avatar: null,
    title: 'Senior Product Manager',
    department: 'Product Delivery',
    lastActive: '5 mins ago',
    online: true,
    failedLogins: 0,
    mfaEnabled: true
  },
  {
    id: 'usr_3',
    name: 'David Chen',
    email: 'lead@aureon.io',
    role: 'ROLE_LEAD',
    status: 'ACTIVE',
    avatar: null,
    title: 'Tech Lead - Core Backend',
    department: 'Engineering',
    lastActive: '12 mins ago',
    online: true,
    failedLogins: 0,
    mfaEnabled: false
  },
  {
    id: 'usr_4',
    name: 'Marcus Brody',
    email: 'dev@aureon.io',
    role: 'ROLE_DEV',
    status: 'ACTIVE',
    avatar: null,
    title: 'Full Stack Engineer',
    department: 'Engineering',
    lastActive: '1 min ago',
    online: true,
    failedLogins: 0,
    mfaEnabled: true
  },
  {
    id: 'usr_5',
    name: 'Elena Rostova',
    email: 'qa@aureon.io',
    role: 'ROLE_QA',
    status: 'ACTIVE',
    avatar: null,
    title: 'Senior QA Automation Engineer',
    department: 'Quality Assurance',
    lastActive: '4 mins ago',
    online: true,
    failedLogins: 0,
    mfaEnabled: false
  },
  {
    id: 'usr_6',
    name: 'James Wilson',
    email: 'j.wilson@aureon.io',
    role: 'ROLE_DEV',
    status: 'INACTIVE',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    title: 'Frontend Developer',
    department: 'Engineering',
    lastActive: '3 days ago',
    online: false,
    failedLogins: 2,
    mfaEnabled: false
  }
];

export const initialOrganizations = [
  { id: 'org_1', name: 'Aureon Technologies Inc.', domain: 'aureon.io', plan: 'Enterprise', seats: 200, usedSeats: 148, status: 'ACTIVE', createdAt: '2025-01-15', country: 'United States' },
  { id: 'org_2', name: 'Aureon APAC Division', domain: 'apac.aureon.io', plan: 'Business', seats: 50, usedSeats: 32, status: 'ACTIVE', createdAt: '2025-06-01', country: 'Singapore' }
];

export const initialTeams = [
  { id: 'team_1', name: 'Core Backend Team', lead: 'David Chen', members: ['Marcus Brody', 'James Wilson'], department: 'Engineering', projectCount: 2, capacity: '85%' },
  { id: 'team_2', name: 'Frontend UX Team', lead: 'David Chen', members: ['Marcus Brody'], department: 'Engineering', projectCount: 1, capacity: '70%' },
  { id: 'team_3', name: 'QA Automation Team', lead: 'David Chen', members: ['Elena Rostova'], department: 'Quality Assurance', projectCount: 2, capacity: '90%' },
  { id: 'team_4', name: 'DevOps & Infrastructure', lead: 'Alex Vance', members: [], department: 'Operations', projectCount: 1, capacity: '60%' }
];

export const initialProjects = [
  {
    id: 'proj_1',
    name: 'Aureon Core Cloud API',
    key: 'ACCA',
    manager: 'Sarah Jenkins',
    lead: 'David Chen',
    status: 'IN_PROGRESS',
    healthScore: 94,
    progress: 78,
    repositories: ['aureon/core-backend', 'aureon/auth-service'],
    budgetSpent: '$142,000 / $180,000',
    deadline: '2026-09-15',
    activeSprint: 'Sprint 24 - OAuth2 Hardening'
  },
  {
    id: 'proj_2',
    name: 'Enterprise Dashboard UI',
    key: 'EDUI',
    manager: 'Sarah Jenkins',
    lead: 'David Chen',
    status: 'IN_PROGRESS',
    healthScore: 88,
    progress: 65,
    repositories: ['aureon/web-app'],
    budgetSpent: '$98,500 / $120,000',
    deadline: '2026-10-01',
    activeSprint: 'Sprint 12 - RBAC Micro-frontend'
  },
  {
    id: 'proj_3',
    name: 'SonarQube Quality Gateway Engine',
    key: 'SQQE',
    manager: 'Sarah Jenkins',
    lead: 'David Chen',
    status: 'PLANNING',
    healthScore: 99,
    progress: 20,
    repositories: ['aureon/sonarqube-connector'],
    budgetSpent: '$15,000 / $60,000',
    deadline: '2026-11-20',
    activeSprint: 'Sprint 1 - Specs & Mocking'
  }
];

export const initialSprints = [
  {
    id: 'spr_1',
    projectId: 'proj_1',
    name: 'Sprint 24 - OAuth2 Hardening',
    startDate: '2026-07-25',
    endDate: '2026-08-08',
    status: 'ACTIVE',
    goal: 'Implement token rotation, argon2 verification, and CORS headers.',
    totalTasks: 18,
    completedTasks: 14,
    burnDownData: [
      { day: 'Day 1', remaining: 18, target: 18 },
      { day: 'Day 3', remaining: 15, target: 15 },
      { day: 'Day 5', remaining: 11, target: 12 },
      { day: 'Day 7', remaining: 7, target: 8 },
      { day: 'Day 9', remaining: 4, target: 4 }
    ]
  },
  {
    id: 'spr_2',
    projectId: 'proj_2',
    name: 'Sprint 12 - RBAC Micro-frontend',
    startDate: '2026-08-01',
    endDate: '2026-08-15',
    status: 'ACTIVE',
    goal: 'Deliver 5 role-specific navigation systems and audit view.',
    totalTasks: 24,
    completedTasks: 16,
    burnDownData: [
      { day: 'Day 1', remaining: 24, target: 24 },
      { day: 'Day 2', remaining: 20, target: 21 },
      { day: 'Day 3', remaining: 16, target: 18 },
      { day: 'Day 4', remaining: 12, target: 14 }
    ]
  },
  {
    id: 'spr_3',
    projectId: 'proj_1',
    name: 'Sprint 23 - Core API V2',
    startDate: '2026-07-10',
    endDate: '2026-07-24',
    status: 'COMPLETED',
    goal: 'REST API v2 endpoints, pagination, rate limiting.',
    totalTasks: 20,
    completedTasks: 20,
    burnDownData: [
      { day: 'Day 1', remaining: 20, target: 20 },
      { day: 'Day 5', remaining: 12, target: 13 },
      { day: 'Day 10', remaining: 4, target: 5 },
      { day: 'Day 14', remaining: 0, target: 0 }
    ]
  }
];

export const initialTasks = [
  {
    id: 'TSK-101',
    title: 'Implement JWT Token Rotation & Session Expiry',
    projectId: 'proj_1',
    projectKey: 'ACCA',
    assignee: 'Marcus Brody',
    reporter: 'David Chen',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    type: 'FEATURE',
    estimatedHours: 16,
    loggedHours: 12,
    dueDate: '2026-08-04',
    comments: [
      { author: 'David Chen', text: 'Ensure token refresh resets idle timer properly.', time: '2 hours ago' },
      { author: 'Marcus Brody', text: 'Implemented refresh interceptor with token queueing.', time: '30 mins ago' }
    ],
    attachments: [
      { name: 'jwt_architecture_spec.pdf', size: '1.2 MB' }
    ]
  },
  {
    id: 'TSK-102',
    title: 'Enforce Server-Side RBAC Permission Middleware',
    projectId: 'proj_1',
    projectKey: 'ACCA',
    assignee: 'Marcus Brody',
    reporter: 'Sarah Jenkins',
    status: 'REVIEW',
    priority: 'CRITICAL',
    type: 'SECURITY',
    estimatedHours: 20,
    loggedHours: 19,
    dueDate: '2026-08-03',
    comments: [
      { author: 'Elena Rostova', text: 'Tested boundary cases. Returning 403 on role escalation attempts.', time: '1 hour ago' }
    ],
    attachments: []
  },
  {
    id: 'TSK-103',
    title: 'Build Dark/Light Mode Design Tokens & Components',
    projectId: 'proj_2',
    projectKey: 'EDUI',
    assignee: 'Marcus Brody',
    reporter: 'Sarah Jenkins',
    status: 'DONE',
    priority: 'MEDIUM',
    type: 'FEATURE',
    estimatedHours: 8,
    loggedHours: 8,
    dueDate: '2026-08-01',
    comments: [],
    attachments: []
  },
  {
    id: 'TSK-104',
    title: 'QA Automated Test Suite for Sprint 24 Endpoints',
    projectId: 'proj_1',
    projectKey: 'ACCA',
    assignee: 'Elena Rostova',
    reporter: 'Elena Rostova',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    type: 'TEST',
    estimatedHours: 14,
    loggedHours: 10,
    dueDate: '2026-08-06',
    comments: [],
    attachments: []
  },
  {
    id: 'TSK-105',
    title: 'Implement Sidebar Role-Based Navigation Guard',
    projectId: 'proj_2',
    projectKey: 'EDUI',
    assignee: 'Marcus Brody',
    reporter: 'David Chen',
    status: 'TODO',
    priority: 'HIGH',
    type: 'FEATURE',
    estimatedHours: 6,
    loggedHours: 0,
    dueDate: '2026-08-07',
    comments: [],
    attachments: []
  },
  {
    id: 'TSK-106',
    title: 'SonarQube Webhook Integration Endpoint',
    projectId: 'proj_3',
    projectKey: 'SQQE',
    assignee: 'Marcus Brody',
    reporter: 'Sarah Jenkins',
    status: 'TODO',
    priority: 'MEDIUM',
    type: 'FEATURE',
    estimatedHours: 12,
    loggedHours: 0,
    dueDate: '2026-08-10',
    comments: [],
    attachments: []
  }
];

export const initialMilestones = [
  { id: 'ms_1', projectId: 'proj_1', name: 'OAuth2 Hardening Complete', dueDate: '2026-08-08', progress: 90, status: 'ON_TRACK', tasks: 18, completedTasks: 16 },
  { id: 'ms_2', projectId: 'proj_2', name: 'RBAC Frontend Integration', dueDate: '2026-08-15', progress: 75, status: 'ON_TRACK', tasks: 24, completedTasks: 18 },
  { id: 'ms_3', projectId: 'proj_3', name: 'SonarQube Quality Gate MVP', dueDate: '2026-09-30', progress: 30, status: 'AT_RISK', tasks: 15, completedTasks: 5 },
  { id: 'ms_4', projectId: 'proj_1', name: 'Production Release v2.0', dueDate: '2026-09-15', progress: 55, status: 'ON_TRACK', tasks: 40, completedTasks: 22 },
  { id: 'ms_5', projectId: 'proj_2', name: 'Dashboard Beta Launch', dueDate: '2026-10-01', progress: 40, status: 'ON_TRACK', tasks: 30, completedTasks: 12 }
];

export const initialRepositories = [
  { id: 'repo_1', name: 'aureon/core-backend', platform: 'GitHub', language: 'Python', branches: 12, openPRs: 3, lastCommit: '2 mins ago', commitAuthor: 'Marcus Brody', stars: 42, status: 'SYNCED', coverage: '92.4%', size: '14.2 MB' },
  { id: 'repo_2', name: 'aureon/auth-service', platform: 'GitHub', language: 'Python', branches: 6, openPRs: 1, lastCommit: '1 hour ago', commitAuthor: 'Marcus Brody', stars: 18, status: 'SYNCED', coverage: '88.1%', size: '4.8 MB' },
  { id: 'repo_3', name: 'aureon/web-app', platform: 'GitHub', language: 'JavaScript', branches: 8, openPRs: 2, lastCommit: '15 mins ago', commitAuthor: 'Marcus Brody', stars: 36, status: 'SYNCED', coverage: '78.5%', size: '22.1 MB' },
  { id: 'repo_4', name: 'aureon/sonarqube-connector', platform: 'GitHub', language: 'Python', branches: 3, openPRs: 0, lastCommit: '3 days ago', commitAuthor: 'David Chen', stars: 8, status: 'SYNCED', coverage: '65.0%', size: '2.1 MB' },
  { id: 'repo_5', name: 'aureon/mobile-sdk', platform: 'GitHub', language: 'TypeScript', branches: 4, openPRs: 1, lastCommit: '5 hours ago', commitAuthor: 'James Wilson', stars: 12, status: 'PENDING', coverage: '71.2%', size: '8.4 MB' }
];

export const initialPullRequests = [
  { id: 'PR-142', title: 'feat: JWT token rotation with refresh queue', repo: 'aureon/core-backend', author: 'Marcus Brody', reviewers: ['David Chen'], status: 'OPEN', branch: 'feature/jwt-argon2', baseBranch: 'main', additions: 342, deletions: 89, files: 12, createdAt: '2026-08-01', comments: 4, checks: 'PASSING' },
  { id: 'PR-143', title: 'fix: CORS header missing on preflight OPTIONS', repo: 'aureon/auth-service', author: 'Marcus Brody', reviewers: ['David Chen'], status: 'OPEN', branch: 'fix/cors-preflight', baseBranch: 'main', additions: 28, deletions: 5, files: 2, createdAt: '2026-08-02', comments: 1, checks: 'PASSING' },
  { id: 'PR-144', title: 'feat: role-based sidebar navigation system', repo: 'aureon/web-app', author: 'Marcus Brody', reviewers: ['David Chen', 'Sarah Jenkins'], status: 'REVIEW', branch: 'feature/rbac-sidebar', baseBranch: 'develop', additions: 580, deletions: 120, files: 18, createdAt: '2026-08-02', comments: 6, checks: 'PASSING' },
  { id: 'PR-141', title: 'chore: update Argon2 hash parameters for OWASP compliance', repo: 'aureon/core-backend', author: 'Marcus Brody', reviewers: ['David Chen'], status: 'MERGED', branch: 'chore/argon2-params', baseBranch: 'main', additions: 14, deletions: 8, files: 1, createdAt: '2026-07-30', comments: 2, checks: 'PASSING' },
  { id: 'PR-140', title: 'feat: audit log CSV export engine', repo: 'aureon/web-app', author: 'Marcus Brody', reviewers: ['Elena Rostova'], status: 'MERGED', branch: 'feature/audit-export', baseBranch: 'develop', additions: 210, deletions: 45, files: 5, createdAt: '2026-07-28', comments: 3, checks: 'PASSING' }
];

export const initialCommitHistory = [
  { id: 'c_1', hash: 'a3f9b2e', message: 'feat: implement JWT refresh interceptor with token queue', author: 'Marcus Brody', repo: 'aureon/core-backend', branch: 'feature/jwt-argon2', timestamp: '2026-08-02 14:22', additions: 142, deletions: 23 },
  { id: 'c_2', hash: 'e7d4c1a', message: 'fix: resolve rate limiter window reset on successful auth', author: 'Marcus Brody', repo: 'aureon/core-backend', branch: 'feature/jwt-argon2', timestamp: '2026-08-02 13:10', additions: 28, deletions: 12 },
  { id: 'c_3', hash: 'b2a8f5d', message: 'feat: add RBAC middleware guards for 5 role endpoints', author: 'Marcus Brody', repo: 'aureon/core-backend', branch: 'main', timestamp: '2026-08-02 11:45', additions: 89, deletions: 0 },
  { id: 'c_4', hash: 'f1c9e3b', message: 'style: dark mode glassmorphic card tokens', author: 'Marcus Brody', repo: 'aureon/web-app', branch: 'feature/rbac-sidebar', timestamp: '2026-08-02 10:30', additions: 210, deletions: 45 },
  { id: 'c_5', hash: 'd5b7a2c', message: 'test: add Jest unit tests for auth context provider', author: 'Elena Rostova', repo: 'aureon/web-app', branch: 'test/auth-context', timestamp: '2026-08-02 09:15', additions: 156, deletions: 0 },
  { id: 'c_6', hash: 'c8e2f1d', message: 'feat: SonarQube webhook payload parser', author: 'David Chen', repo: 'aureon/sonarqube-connector', branch: 'main', timestamp: '2026-07-30 16:40', additions: 340, deletions: 22 },
  { id: 'c_7', hash: '91a4d3e', message: 'docs: update API security documentation', author: 'Marcus Brody', repo: 'aureon/core-backend', branch: 'main', timestamp: '2026-07-29 14:00', additions: 48, deletions: 12 },
  { id: 'c_8', hash: 'e3f7b9c', message: 'refactor: extract permission matrix to separate module', author: 'Marcus Brody', repo: 'aureon/core-backend', branch: 'refactor/rbac-module', timestamp: '2026-07-28 11:20', additions: 190, deletions: 165 }
];

export const initialBugs = [
  {
    id: 'BUG-401',
    title: 'JWT Refresh Token reuse window accepts expired tokens under heavy concurrency',
    projectId: 'proj_1',
    severity: 'CRITICAL',
    status: 'OPEN',
    reporter: 'Elena Rostova',
    assignee: 'Marcus Brody',
    createdAt: '2026-08-01 14:22',
    description: 'During stress test with 50 concurrent requests, expired refresh tokens passed authorization check.',
    evidence: [
      { name: 'concurrency_race_condition.log', size: '42 KB' },
      { name: 'http_response_401_expected.png', size: '340 KB' }
    ],
    stepsToReproduce: '1. Fire 50 POST /api/v1/auth/refresh requests simultaneously.\n2. Pass token expired 1s ago.\n3. Notice 2 requests return 200 OK.'
  },
  {
    id: 'BUG-402',
    title: 'Audit log export button missing CSV header row in Safari browser',
    projectId: 'proj_2',
    severity: 'LOW',
    status: 'IN_PROGRESS',
    reporter: 'Elena Rostova',
    assignee: 'Marcus Brody',
    createdAt: '2026-08-02 09:15',
    description: 'Exported file opens without column names in Safari 17.',
    evidence: [],
    stepsToReproduce: '1. Open Audit Logs as Admin in Safari.\n2. Click Export CSV.\n3. Inspect row 1.'
  },
  {
    id: 'BUG-403',
    title: 'Dark mode toggle flashes white background on initial page load',
    projectId: 'proj_2',
    severity: 'MEDIUM',
    status: 'OPEN',
    reporter: 'Elena Rostova',
    assignee: 'Marcus Brody',
    createdAt: '2026-08-02 11:00',
    description: 'When user preference is dark mode, the page briefly shows white background before CSS variables apply.',
    evidence: [{ name: 'flash_of_white.mp4', size: '1.2 MB' }],
    stepsToReproduce: '1. Set theme to dark.\n2. Hard refresh the page.\n3. Observe brief white flash.'
  }
];

export const initialTestCases = [
  { id: 'TC-801', title: 'Verify HTTP 403 response for unauthorized role access to /api/v1/admin/logs', projectId: 'proj_1', type: 'SECURITY', status: 'PASSED', lastRun: '2026-08-02 11:30', executedBy: 'Elena Rostova', automated: true },
  { id: 'TC-802', title: 'Account lockout verification after 5 consecutive failed login attempts', projectId: 'proj_1', type: 'SECURITY', status: 'PASSED', lastRun: '2026-08-02 11:45', executedBy: 'Elena Rostova', automated: true },
  { id: 'TC-803', title: 'Verify evidence upload file format validation (.png, .log, .pdf)', projectId: 'proj_2', type: 'FUNCTIONAL', status: 'PENDING', lastRun: 'Never', executedBy: 'Elena Rostova', automated: false },
  { id: 'TC-804', title: 'JWT token rotation generates unique refresh token on each call', projectId: 'proj_1', type: 'SECURITY', status: 'PASSED', lastRun: '2026-08-02 12:00', executedBy: 'Elena Rostova', automated: true },
  { id: 'TC-805', title: 'RBAC sidebar navigation only shows permitted menu items per role', projectId: 'proj_2', type: 'FUNCTIONAL', status: 'PASSED', lastRun: '2026-08-02 12:15', executedBy: 'Elena Rostova', automated: false },
  { id: 'TC-806', title: 'Dark/Light mode toggle persists across page refreshes', projectId: 'proj_2', type: 'UI', status: 'FAILED', lastRun: '2026-08-02 12:30', executedBy: 'Elena Rostova', automated: false },
  { id: 'TC-807', title: 'API rate limiter blocks requests exceeding 20/15min threshold', projectId: 'proj_1', type: 'SECURITY', status: 'PASSED', lastRun: '2026-08-02 13:00', executedBy: 'Elena Rostova', automated: true },
  { id: 'TC-808', title: 'Kanban card drag between columns updates task status in database', projectId: 'proj_2', type: 'FUNCTIONAL', status: 'PENDING', lastRun: 'Never', executedBy: 'Elena Rostova', automated: false }
];

export const initialTestSuites = [
  { id: 'TS-1', name: 'Sprint 24 Security Regression', projectId: 'proj_1', totalCases: 12, passed: 10, failed: 1, pending: 1, automated: true, lastRun: '2026-08-02 13:00', status: 'COMPLETED' },
  { id: 'TS-2', name: 'RBAC Frontend Smoke Tests', projectId: 'proj_2', totalCases: 8, passed: 6, failed: 1, pending: 1, automated: false, lastRun: '2026-08-02 12:30', status: 'IN_PROGRESS' },
  { id: 'TS-3', name: 'API Endpoint Integration Suite', projectId: 'proj_1', totalCases: 24, passed: 22, failed: 0, pending: 2, automated: true, lastRun: '2026-08-01 18:00', status: 'COMPLETED' },
  { id: 'TS-4', name: 'SonarQube Connector Unit Tests', projectId: 'proj_3', totalCases: 6, passed: 4, failed: 0, pending: 2, automated: true, lastRun: '2026-07-30 16:00', status: 'PENDING' }
];

export const initialSonarQube = {
  overallQualityGate: 'PASSED',
  bugs: 3,
  vulnerabilities: 0,
  securityHotspots: 1,
  codeSmells: 12,
  coverage: '92.4%',
  duplications: '0.8%',
  rating: 'A',
  lastScan: 'Today, 10:14 AM'
};

export const sonarQubePerProject = [
  { projectKey: 'ACCA', projectName: 'Aureon Core Cloud API', qualityGate: 'PASSED', bugs: 2, vulnerabilities: 0, codeSmells: 5, coverage: '94.2%', duplications: '0.4%', technicalDebt: '2h 15m', rating: 'A', lastScan: '2026-08-02 10:14' },
  { projectKey: 'EDUI', projectName: 'Enterprise Dashboard UI', qualityGate: 'PASSED', bugs: 1, vulnerabilities: 0, codeSmells: 7, coverage: '78.5%', duplications: '1.2%', technicalDebt: '4h 30m', rating: 'B', lastScan: '2026-08-02 09:45' },
  { projectKey: 'SQQE', projectName: 'SonarQube Quality Gateway', qualityGate: 'WARNING', bugs: 0, vulnerabilities: 0, codeSmells: 0, coverage: '65.0%', duplications: '0.0%', technicalDebt: '0h', rating: 'A', lastScan: '2026-07-30 16:40' }
];

export const initialCodeSmells = [
  { id: 'CS-1', file: 'src/auth/jwt_handler.py', line: 142, rule: 'python:S1192', message: 'String literal "Bearer" duplicated 4 times', severity: 'MINOR', effort: '5min', type: 'CODE_SMELL' },
  { id: 'CS-2', file: 'src/api/views/admin.py', line: 89, rule: 'python:S3776', message: 'Refactor this function to reduce cognitive complexity from 18 to 15', severity: 'MAJOR', effort: '30min', type: 'CODE_SMELL' },
  { id: 'CS-3', file: 'src/services/audit_logger.py', line: 34, rule: 'python:S1135', message: 'Complete the task associated with this TODO comment', severity: 'INFO', effort: '0min', type: 'CODE_SMELL' },
  { id: 'CS-4', file: 'src/components/Header.jsx', line: 67, rule: 'javascript:S3776', message: 'Refactor this function to reduce cognitive complexity', severity: 'MAJOR', effort: '20min', type: 'CODE_SMELL' },
  { id: 'CS-5', file: 'src/components/DataTable.jsx', line: 112, rule: 'javascript:S1192', message: 'String literal duplicated 3 times', severity: 'MINOR', effort: '5min', type: 'CODE_SMELL' }
];

export const initialNotifications = [
  { id: 'notif_1', type: 'SECURITY', title: 'Failed Login Threshold Exceeded', message: 'IP 185.220.101.4 blocked after 5 failed attempts', timestamp: '2026-08-02 13:10', read: false, priority: 'HIGH' },
  { id: 'notif_2', type: 'SYSTEM', title: 'JWT Signing Key Rotated', message: 'Scheduled key rotation completed at 04:00 UTC', timestamp: '2026-08-02 04:00', read: true, priority: 'LOW' },
  { id: 'notif_3', type: 'PROJECT', title: 'Sprint 24 Nearing Completion', message: 'Sprint 24 is 82% complete with 4 days remaining', timestamp: '2026-08-02 09:00', read: false, priority: 'MEDIUM' },
  { id: 'notif_4', type: 'TASK', title: 'Task TSK-102 Submitted for Review', message: 'Marcus Brody submitted RBAC Middleware for code review', timestamp: '2026-08-02 11:45', read: false, priority: 'MEDIUM' },
  { id: 'notif_5', type: 'BUG', title: 'Critical Bug BUG-401 Filed', message: 'Elena Rostova reported JWT concurrency race condition', timestamp: '2026-08-01 14:22', read: true, priority: 'HIGH' },
  { id: 'notif_6', type: 'DEPLOYMENT', title: 'Staging Build Deployed', message: 'Build #1247 deployed to staging environment successfully', timestamp: '2026-08-02 08:30', read: true, priority: 'LOW' },
  { id: 'notif_7', type: 'PR', title: 'PR #144 Needs Review', message: 'Role-based sidebar navigation PR awaiting review from David Chen', timestamp: '2026-08-02 10:00', read: false, priority: 'MEDIUM' }
];

export const initialCalendarEvents = [
  { id: 'evt_1', title: 'Sprint 24 End', date: '2026-08-08', type: 'SPRINT', color: '#3b82f6' },
  { id: 'evt_2', title: 'Sprint 12 End', date: '2026-08-15', type: 'SPRINT', color: '#3b82f6' },
  { id: 'evt_3', title: 'Core API v2.0 Release', date: '2026-09-15', type: 'RELEASE', color: '#10b981' },
  { id: 'evt_4', title: 'Dashboard Beta Launch', date: '2026-10-01', type: 'RELEASE', color: '#10b981' },
  { id: 'evt_5', title: 'SonarQube MVP Deadline', date: '2026-09-30', type: 'MILESTONE', color: '#f59e0b' },
  { id: 'evt_6', title: 'OAuth2 Hardening Complete', date: '2026-08-08', type: 'MILESTONE', color: '#f59e0b' },
  { id: 'evt_7', title: 'Sprint 25 Planning', date: '2026-08-09', type: 'MEETING', color: '#8b5cf6' },
  { id: 'evt_8', title: 'Quarterly Security Review', date: '2026-08-20', type: 'MEETING', color: '#8b5cf6' }
];

export const developerMetrics = [
  { name: 'Marcus Brody', role: 'Full Stack Dev', commits: 48, prs: 5, tasksCompleted: 12, tasksActive: 4, linesAdded: 2840, linesRemoved: 560, codeReviews: 3, avgTaskTime: '6.2h', velocity: 94, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { name: 'James Wilson', role: 'Frontend Dev', commits: 22, prs: 2, tasksCompleted: 8, tasksActive: 2, linesAdded: 1200, linesRemoved: 340, codeReviews: 1, avgTaskTime: '8.1h', velocity: 78, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
  { name: 'Elena Rostova', role: 'QA Automation', commits: 18, prs: 1, tasksCompleted: 14, tasksActive: 3, linesAdded: 890, linesRemoved: 120, codeReviews: 0, avgTaskTime: '4.5h', velocity: 96, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' }
];

export const initialAuditLogs = [
  {
    id: 'log_901',
    timestamp: '2026-08-02 13:30:12',
    user: 'Alex Vance (admin@aureon.io)',
    role: 'System Admin',
    ip: '192.168.1.105',
    device: 'Chrome 127 / Windows 11',
    action: 'USER_ROLE_UPDATE',
    resource: 'User: David Chen (usr_3)',
    status: 'SUCCESS'
  },
  {
    id: 'log_902',
    timestamp: '2026-08-02 13:22:45',
    user: 'Sarah Jenkins (pm@aureon.io)',
    role: 'Project Manager',
    ip: '192.168.1.112',
    device: 'Firefox 128 / macOS',
    action: 'SPRINT_CREATE',
    resource: 'Sprint: Sprint 24 - OAuth2 Hardening',
    status: 'SUCCESS'
  },
  {
    id: 'log_903',
    timestamp: '2026-08-02 13:10:04',
    user: 'Unknown (attacker@external.net)',
    role: 'UNAUTHENTICATED',
    ip: '185.220.101.4',
    device: 'Python-requests/2.31',
    action: 'AUTH_FAILED_LOGIN',
    resource: 'Endpoint: /api/v1/auth/login',
    status: 'FAILURE'
  },
  {
    id: 'log_904',
    timestamp: '2026-08-02 12:45:00',
    user: 'Elena Rostova (qa@aureon.io)',
    role: 'QA Engineer',
    ip: '192.168.1.130',
    device: 'Edge 126 / Windows 11',
    action: 'BUG_REPORT_CREATE',
    resource: 'Bug: BUG-401 (JWT Refresh concurrency)',
    status: 'SUCCESS'
  }
];

export const initialSystemLogs = [
  { id: 'sys_1', level: 'INFO', message: 'Argon2 key derivation parameters initialized (m=65536, t=3, p=4)', timestamp: '2026-08-02 13:30:00', source: 'AuthService' },
  { id: 'sys_2', level: 'WARN', message: 'Rate limit threshold reached for IP 185.220.101.4 [5 requests/sec]', timestamp: '2026-08-02 13:10:05', source: 'RateLimiter' },
  { id: 'sys_3', level: 'INFO', message: 'SonarQube API webhook processed for project ACCA with QualityGate: PASSED', timestamp: '2026-08-02 10:14:02', source: 'WebhookEngine' },
  { id: 'sys_4', level: 'ERROR', message: 'Redis connection pool exhausted - retrying with backoff (attempt 1/3)', timestamp: '2026-08-02 09:45:12', source: 'CacheLayer' },
  { id: 'sys_5', level: 'INFO', message: 'Database migration #47 applied successfully (add audit_metadata JSONB column)', timestamp: '2026-08-02 08:00:00', source: 'MigrationRunner' },
  { id: 'sys_6', level: 'WARN', message: 'JWT signing key rotation scheduled in 24 hours', timestamp: '2026-08-02 04:00:00', source: 'KeyManager' },
  { id: 'sys_7', level: 'INFO', message: 'Celery worker pool scaled to 4 workers (auto-scale triggered)', timestamp: '2026-08-02 03:15:00', source: 'TaskQueue' },
  { id: 'sys_8', level: 'ERROR', message: 'SonarQube API timeout for project SQQE (connection refused on port 9000)', timestamp: '2026-07-31 22:10:00', source: 'IntegrationHub' },
  { id: 'sys_9', level: 'INFO', message: 'Nightly database backup completed (142 GB compressed to 28 GB)', timestamp: '2026-08-02 02:00:00', source: 'BackupService' },
  { id: 'sys_10', level: 'INFO', message: 'Health check endpoint /api/v1/health responded in 2ms', timestamp: '2026-08-02 13:30:00', source: 'HealthMonitor' }
];

export const systemHealthMetrics = {
  cpuUsage: '14%',
  memoryUsage: '3.2 GB / 16 GB',
  storageUsage: '142 GB / 1 TB (14.2%)',
  apiStatus: 'OPERATIONAL (99.99% Uptime)',
  apiResponseTimeAvg: '24ms',
  failedLogins24h: 3,
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
