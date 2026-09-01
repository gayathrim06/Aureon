export const mockUserProfile = {
  name: "Gayathri Ramesh",
  email: "gayathri@aureon.engineering",
  role: "Project Manager",
  roleCode: "project_manager",
  department: "Platform Engineering",
  organization: "Aureon Core Enterprise",
  avatar: "GR",
  joinedDate: "March 2024",
  stats: {
    projectsManaged: 8,
    teamsLed: 4,
    codeReviewsCount: 142,
    healthCompliance: "99.4%"
  }
};

export const mockMetrics = [
  {
    id: "active_projects",
    title: "Active Projects",
    value: "14",
    trend: "+12%",
    isPositive: true,
    description: "2 shipping this week",
    iconName: "FolderKanban",
  },
  {
    id: "completed_projects",
    title: "Completed Projects",
    value: "42",
    trend: "+8%",
    isPositive: true,
    description: "Across 4 quarters",
    iconName: "CheckCircle2",
  },
  {
    id: "pending_tasks",
    title: "Pending Tasks",
    value: "28",
    trend: "-5%",
    isPositive: true,
    description: "4 critical priority",
    iconName: "ListTodo",
  },
  {
    id: "connected_repos",
    title: "Connected Repositories",
    value: "19",
    trend: "100%",
    isPositive: true,
    description: "All webhooks healthy",
    iconName: "GitBranch",
  },
  {
    id: "developers",
    title: "Active Developers",
    value: "36",
    trend: "+4",
    isPositive: true,
    description: "6 engineering squads",
    iconName: "Users",
  },
  {
    id: "health_score",
    title: "Project Health Score",
    value: "94%",
    trend: "+3.2%",
    isPositive: true,
    description: "Optimal stability score",
    iconName: "Activity",
  },
  {
    id: "quality_score",
    title: "Code Quality Index",
    value: "91/100",
    trend: "Grade A",
    isPositive: true,
    description: "0 security vulnerabilities",
    iconName: "ShieldCheck",
  },
  {
    id: "reports_generated",
    title: "Reports Generated",
    value: "128",
    trend: "+14",
    isPositive: true,
    description: "Audit compliance target met",
    iconName: "FileText",
  },
];

export const mockProjects = [];

export const mockTeamBreakdown = {
  administrators: { count: 4, label: "Administrators", status: "Full Control", bgBadge: "bg-purple-500/20 text-purple-400" },
  projectManagers: { count: 8, label: "Project Managers", status: "Sprint Planning", bgBadge: "bg-blue-500/20 text-blue-400" },
  teamLeads: { count: 12, label: "Team Leads", status: "Architecture & PRs", bgBadge: "bg-emerald-500/20 text-emerald-400" },
  developers: { count: 36, label: "Software Engineers", status: "Active Sprint", bgBadge: "bg-cyan-500/20 text-cyan-400" },
};

export const mockTaskCounts = {
  completed: 142,
  inProgress: 19,
  pending: 28,
  overdue: 3,
};

export const mockRecentTasks = [
  { id: "TSK-892", title: "Migrate JWT token validation to Rust micro-crate", project: "Aureon Core API Gateway", assignee: "Gayathri Ramesh", priority: "Urgent", status: "In Progress" },
  { id: "TSK-891", title: "Optimize SonarQube static analysis webhooks", project: "Static Code Analysis Engine", assignee: "Alex Rivera", priority: "High", status: "Completed" },
  { id: "TSK-890", title: "Setup Docker multi-stage build caching", project: "Cloud Telemetry Mesh", assignee: "David Vance", priority: "Medium", status: "Pending" },
  { id: "TSK-889", title: "Implement WCAG 2.1 accessible dialog modals", project: "Enterprise Auth & OAuth2", assignee: "Sarah Chen", priority: "High", status: "Completed" },
  { id: "TSK-888", title: "Fix memory leak in websocket broadcast listener", project: "Cloud Telemetry Mesh", assignee: "Elena Rostova", priority: "Overdue", status: "Overdue" },
];

export const mockRepositories = [
  { id: "repo-1", name: "aureon-core-service", branch: "main", lastCommit: "f8a92b1 (2 mins ago)", status: "Active", connection: "Healthy", ciPipeline: "Passed" },
  { id: "repo-2", name: "aureon-telemetry-engine", branch: "release/v2.4", lastCommit: "c4129e0 (15 mins ago)", status: "Active", connection: "Healthy", ciPipeline: "Passed" },
  { id: "repo-3", name: "aureon-auth-provider", branch: "main", lastCommit: "e9021a4 (1 hour ago)", status: "Synced", connection: "Healthy", ciPipeline: "Passed" },
  { id: "repo-4", name: "aureon-static-analyzer", branch: "feature/cyclomatic-rules", lastCommit: "b773821 (3 hours ago)", status: "Building", connection: "Healthy", ciPipeline: "Building" },
  { id: "repo-5", name: "aureon-web-console", branch: "main", lastCommit: "d193021 (4 hours ago)", status: "Synced", connection: "Healthy", ciPipeline: "Passed" },
];

export const mockCodeQuality = {
  maintainabilityIndex: { score: 92, grade: "A", status: "Excellent" },
  cyclomaticComplexity: { score: 14.2, status: "Low Risk (< 15)" },
  codeSmells: { count: 3, severity: "Minor" },
  issuesFound: { count: 12, resolvedThisWeek: 48 },
  staticAnalysisStatus: "Passed (100% Rule Compliance)",
  vulnerabilities: 0,
  duplicationRate: "1.4%",
  testCoverage: "94.8%"
};

export const mockActivities = [
  { id: "act-1", title: "Project PROJ-101 updated", user: "Gayathri Ramesh", type: "project", time: "10 minutes ago", detail: "Added 2 new sprint deliverables for Gateway API" },
  { id: "act-2", title: "Task TSK-891 marked completed", user: "Alex Rivera", type: "task", time: "25 minutes ago", detail: "Static analysis rule updates verified with 100% tests" },
  { id: "act-3", title: "Repository connected: aureon-web-console", user: "David Vance", type: "repo", time: "1 hour ago", detail: "GitHub Webhook v2 handshake verified" },
  { id: "act-4", title: "Code Quality Analysis Completed", user: "System Worker", type: "quality", time: "2 hours ago", detail: "0 vulnerability flags across 45,000 LOC" },
  { id: "act-5", title: "Quarterly Audit Report Generated", user: "Gayathri Ramesh", type: "report", time: "4 hours ago", detail: "PDF report exported for Platform Engineering leads" }
];

export const mockReportsList = [
  { id: "REP-2026-001", name: "Monthly Code Quality & Health Compliance", format: "PDF", size: "2.4 MB", generatedBy: "Gayathri Ramesh", date: "2026-07-25" },
  { id: "REP-2026-002", name: "Developer Velocity & Sprint Metrics Q2", format: "CSV", size: "840 KB", generatedBy: "David Vance", date: "2026-07-24" },
  { id: "REP-2026-003", name: "Repository Dependency Vulnerability Scan", format: "PDF", size: "1.8 MB", generatedBy: "System Auditor", date: "2026-07-20" },
  { id: "REP-2026-004", name: "Architecture Complexity Matrix", format: "CSV", size: "1.2 MB", generatedBy: "Alex Rivera", date: "2026-07-15" }
];
