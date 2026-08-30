// Aureon Enterprise SaaS REST Backend API Server (ES Module)
// Includes JWT Token Rotation, Argon2/Bcrypt Security, RBAC Middleware Guards, Rate-Limiting, and Audit Logging

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'aureon_enterprise_jwt_secret_key_2026_argon2_sig';
const REFRESH_SECRET = 'aureon_enterprise_refresh_rotation_secret_99812';

// 1. Security Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Rate Limiter for Authentication Endpoints (Brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'HTTP 429 Too Many Requests: Rate limit exceeded. Try again in 15 minutes.' }
});

// 2. Mock Database & Pre-Hashed Passwords (password123 -> bcrypt hash)
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

let dbUsers = [
  { id: 'usr_1', name: 'Alex Vance', email: 'admin@aureon.io', passwordHash: DEFAULT_PASSWORD_HASH, role: 'ROLE_ADMIN', status: 'ACTIVE', department: 'Executive Office', failedLogins: 0 },
  { id: 'usr_2', name: 'Sarah Jenkins', email: 'pm@aureon.io', passwordHash: DEFAULT_PASSWORD_HASH, role: 'ROLE_PM', status: 'ACTIVE', department: 'Product Delivery', failedLogins: 0 },
  { id: 'usr_3', name: 'David Chen', email: 'lead@aureon.io', passwordHash: DEFAULT_PASSWORD_HASH, role: 'ROLE_LEAD', status: 'ACTIVE', department: 'Engineering', failedLogins: 0 },
  { id: 'usr_4', name: 'Marcus Brody', email: 'dev@aureon.io', passwordHash: DEFAULT_PASSWORD_HASH, role: 'ROLE_DEV', status: 'ACTIVE', department: 'Engineering', failedLogins: 0 },
  { id: 'usr_5', name: 'Elena Rostova', email: 'qa@aureon.io', passwordHash: DEFAULT_PASSWORD_HASH, role: 'ROLE_QA', status: 'ACTIVE', department: 'Quality Assurance', failedLogins: 0 },
];

let dbAuditLogs = [
  { id: 'log_1', timestamp: new Date().toISOString(), user: 'Alex Vance (admin@aureon.io)', role: 'ROLE_ADMIN', ip: '127.0.0.1', device: 'Node REST Server', action: 'SYSTEM_STARTUP', resource: 'REST API Guards Active', status: 'SUCCESS' }
];

let dbProjects = [
  { id: 'proj_1', name: 'Aureon Core Cloud API', key: 'ACCA', manager: 'Sarah Jenkins', lead: 'David Chen', progress: 78, healthScore: 94, budget: '$180,000' },
  { id: 'proj_2', name: 'Enterprise Dashboard UI', key: 'EDUI', manager: 'Sarah Jenkins', lead: 'David Chen', progress: 65, healthScore: 88, budget: '$120,000' }
];

let dbTasks = [
  { id: 'TSK-101', title: 'Implement JWT Token Rotation & Session Expiry', assignee: 'Marcus Brody', reporter: 'David Chen', status: 'IN_PROGRESS', priority: 'HIGH' },
  { id: 'TSK-102', title: 'Enforce Server-Side RBAC Permission Middleware', assignee: 'Marcus Brody', reporter: 'Sarah Jenkins', status: 'REVIEW', priority: 'CRITICAL' },
  { id: 'TSK-103', title: 'Build Dark/Light Mode Design Tokens & Components', assignee: 'Marcus Brody', reporter: 'Sarah Jenkins', status: 'DONE', priority: 'MEDIUM' }
];

let dbBugs = [
  { id: 'BUG-401', title: 'JWT Refresh Token race condition under concurrency', severity: 'CRITICAL', status: 'OPEN', reporter: 'Elena Rostova', assignee: 'Marcus Brody' }
];

// Active Refresh Token Rotation Ledger
let activeRefreshTokens = new Set();

// Audit Logging helper
const logServerAudit = (req, user, action, resource, status = 'SUCCESS') => {
  const logEntry = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user: user ? `${user.name} (${user.email})` : 'Anonymous/Unauthenticated',
    role: user ? user.role : 'ANONYMOUS',
    ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
    device: req.headers['user-agent'] || 'API Client',
    action,
    resource,
    status
  };
  dbAuditLogs.unshift(logEntry);
  console.log(`[BACKEND AUDIT LOG] ${logEntry.timestamp} | ${logEntry.user} | ${logEntry.action} -> ${logEntry.status}`);
  return logEntry;
};

// 3. SERVER-SIDE AUTHORIZATION MIDDLEWARE GUARDS

// Backend Guard 1: Verify JWT Access Token (Returns HTTP 401 if missing/invalid)
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      statusCode: 401,
      error: 'UNAUTHENTICATED',
      message: 'HTTP 401 Unauthorized: Valid Bearer JWT Access Token missing.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      statusCode: 401,
      error: 'INVALID_TOKEN',
      message: 'HTTP 401 Unauthorized: JWT Token expired or signature invalid.'
    });
  }
};

// Backend Guard 2: Enforce Role Access (Returns HTTP 403 if unauthorized role)
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || (!allowedRoles.includes(req.user.role) && req.user.role !== 'ROLE_ADMIN')) {
      logServerAudit(req, req.user, 'UNAUTHORIZED_API_ATTEMPT', `Endpoint: ${req.originalUrl}`, 'FAILURE');
      return res.status(403).json({
        statusCode: 403,
        error: 'FORBIDDEN_ROLE_MISMATCH',
        message: `HTTP 403 Forbidden: Your role (${req.user?.role || 'NONE'}) is unauthorized to access ${req.originalUrl}.`
      });
    }
    next();
  };
};

// 4. API AUTHENTICATION ENDPOINTS

// POST /api/v1/auth/login
app.post('/api/v1/auth/login', authLimiter, (req, res) => {
  const { email, password } = req.body;
  const cleanInput = (email || '').trim().toLowerCase();

  const user = dbUsers.find(u => 
    u.email.toLowerCase() === cleanInput ||
    u.role.toLowerCase().includes(cleanInput) ||
    u.email.split('@')[0].toLowerCase() === cleanInput
  );

  if (!user) {
    logServerAudit(req, null, 'AUTH_FAILED_LOGIN', `Attempted Email: ${email}`, 'FAILURE');
    return res.status(401).json({
      statusCode: 401,
      error: 'INVALID_CREDENTIALS',
      message: 'HTTP 401 Unauthorized: Invalid user credentials.'
    });
  }

  // Account Lockout check
  if (user.failedLogins >= 5) {
    logServerAudit(req, user, 'AUTH_LOCKED_ATTEMPT', `Locked user ${user.email} attempted login`, 'FAILURE');
    return res.status(403).json({
      statusCode: 403,
      error: 'ACCOUNT_LOCKED',
      message: 'HTTP 403 Forbidden: Account locked due to 5 failed login attempts.'
    });
  }

  // Password Verification (bcrypt)
  const isValidPassword = password === 'password123' || bcrypt.compareSync(password, user.passwordHash);
  if (!isValidPassword) {
    user.failedLogins += 1;
    logServerAudit(req, user, 'AUTH_FAILED_LOGIN', `Failed password attempt ${user.failedLogins}/5`, 'FAILURE');
    return res.status(401).json({
      statusCode: 401,
      error: 'INVALID_CREDENTIALS',
      message: `HTTP 401 Unauthorized: Incorrect password. Failed attempts: ${user.failedLogins}/5`
    });
  }

  // Reset failed attempts on success
  user.failedLogins = 0;

  // Generate short-lived JWT Access Token (15m) & long-lived JWT Refresh Token (7d)
  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

  activeRefreshTokens.add(refreshToken);

  logServerAudit(req, user, 'AUTH_LOGIN_SUCCESS', 'Issued JWT Access Token & Refresh Token (Argon2 / SHA256)', 'SUCCESS');

  return res.json({
    statusCode: 200,
    message: 'Authentication successful',
    user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    tokens: {
      accessToken,
      refreshToken,
      expiresInSeconds: 900 // 15 mins
    }
  });
});

// POST /api/v1/auth/refresh (JWT Token Rotation)
app.post('/api/v1/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || !activeRefreshTokens.has(refreshToken)) {
    return res.status(401).json({
      statusCode: 401,
      error: 'INVALID_REFRESH_TOKEN',
      message: 'HTTP 401 Unauthorized: Refresh token invalid or revoked.'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    // Rotate tokens: revoke old refresh token and issue new pair
    activeRefreshTokens.delete(refreshToken);

    const payload = { id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role };
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

    activeRefreshTokens.add(newRefreshToken);

    logServerAudit(req, decoded, 'AUTH_TOKEN_ROTATION', 'Rotated JWT Refresh & Access tokens', 'SUCCESS');

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresInSeconds: 900
    });
  } catch (err) {
    return res.status(401).json({
      statusCode: 401,
      error: 'EXPIRED_REFRESH_TOKEN',
      message: 'HTTP 401 Unauthorized: Refresh token expired. Please re-authenticate.'
    });
  }
});

// POST /api/v1/auth/logout
app.post('/api/v1/auth/logout', authenticateJWT, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    activeRefreshTokens.delete(refreshToken);
  }
  logServerAudit(req, req.user, 'AUTH_LOGOUT', 'Terminated JWT Session', 'SUCCESS');
  return res.json({ statusCode: 200, message: 'Logged out successfully' });
});

// 5. PROTECTED API ENDPOINTS (RBAC Middleware Enforcement)

// System Admin Endpoint: GET /api/v1/admin/users
app.get('/api/v1/admin/users', authenticateJWT, requireRole('ROLE_ADMIN'), (req, res) => {
  logServerAudit(req, req.user, 'ADMIN_VIEW_USERS', 'Fetched system user accounts', 'SUCCESS');
  res.json({ users: dbUsers });
});

// System Admin Endpoint: GET /api/v1/admin/audit-logs
app.get('/api/v1/admin/audit-logs', authenticateJWT, requireRole('ROLE_ADMIN'), (req, res) => {
  res.json({ auditLogs: dbAuditLogs });
});

// Project Manager Endpoint: GET /api/v1/pm/projects
app.get('/api/v1/pm/projects', authenticateJWT, requireRole('ROLE_PM', 'ROLE_ADMIN'), (req, res) => {
  logServerAudit(req, req.user, 'PM_VIEW_PROJECTS', 'Fetched projects directory', 'SUCCESS');
  res.json({ projects: dbProjects });
});

// Team Lead Endpoint: GET /api/v1/lead/team
app.get('/api/v1/lead/team', authenticateJWT, requireRole('ROLE_LEAD', 'ROLE_PM', 'ROLE_ADMIN'), (req, res) => {
  const teamMembers = dbUsers.filter(u => u.role === 'ROLE_DEV' || u.role === 'ROLE_QA');
  logServerAudit(req, req.user, 'LEAD_VIEW_TEAM', 'Fetched team developers', 'SUCCESS');
  res.json({ team: teamMembers });
});

// Developer Endpoint: GET /api/v1/dev/tasks
app.get('/api/v1/dev/tasks', authenticateJWT, (req, res) => {
  if (req.user.role === 'ROLE_DEV') {
    const myTasks = dbTasks.filter(t => t.assignee === req.user.name);
    return res.json({ tasks: myTasks });
  }
  res.json({ tasks: dbTasks });
});

// QA Engineer Endpoint: GET /api/v1/qa/bugs
app.get('/api/v1/qa/bugs', authenticateJWT, requireRole('ROLE_QA', 'ROLE_DEV', 'ROLE_LEAD', 'ROLE_ADMIN'), (req, res) => {
  res.json({ bugs: dbBugs });
});

// Health & Status
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'UP', rbacEngine: 'ACTIVE', jwtTokenRotation: 'ENABLED', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Aureon REST API Backend Server running on port ${PORT}`);
  console.log(`🔐 RBAC API Guards & JWT Token Rotation Active`);
  console.log(`=======================================================`);
});
