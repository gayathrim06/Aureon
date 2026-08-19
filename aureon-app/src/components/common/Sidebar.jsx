import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Building, Users, Shield, Users2, FolderKanban, GitBranch, 
  Activity, FileText, Server, Bell, Settings, Calendar, Award, Code2, 
  CheckSquare, GitPullRequest, AlertCircle, User, Cpu, Bug, FileCheck, Layers, Sparkles
} from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab }) => {
  const { user } = useAuth();

  const getNormalizedRole = (u) => {
    if (!u) return 'ROLE_ADMIN';
    const r = (typeof u.role === 'string' ? u.role : u.role?.code || u.role_code || u.role_name || '').toUpperCase();
    if (r.includes('ADMIN')) return 'ROLE_ADMIN';
    if (r.includes('PM') || r.includes('MANAGER')) return 'ROLE_PM';
    if (r.includes('LEAD')) return 'ROLE_LEAD';
    if (r.includes('QA')) return 'ROLE_QA';
    return 'ROLE_DEV';
  };

  const role = getNormalizedRole(user);

  // Role Navigation Mapping strictly specified by enterprise specification
  const roleNavigations = {
    ROLE_ADMIN: [
      { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'Organization', label: 'Organization', icon: Building },
      { id: 'Users', label: 'Users', icon: Users },
      { id: 'RolesPermissions', label: 'Roles & Permissions', icon: Shield },
      { id: 'Teams', label: 'Teams', icon: Users2 },
      { id: 'Projects', label: 'Projects', icon: FolderKanban },
      { id: 'Repositories', label: 'Repositories', icon: GitBranch },
      { id: 'SonarQube', label: 'SonarQube', icon: Cpu },
      { id: 'AuditLogs', label: 'Audit Logs', icon: FileText },
      { id: 'SystemLogs', label: 'System Logs', icon: Server },
      { id: 'Reports', label: 'Reports', icon: Activity },
      { id: 'Notifications', label: 'Notifications', icon: Bell },
      { id: 'Profile', label: 'My Profile', icon: User },
      { id: 'Settings', label: 'Settings', icon: Settings },
    ],

    ROLE_PM: [
      { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'Projects', label: 'Projects', icon: FolderKanban },
      { id: 'Sprints', label: 'Sprints', icon: Layers },
      { id: 'Tasks', label: 'Tasks', icon: CheckSquare },
      { id: 'Milestones', label: 'Milestones', icon: Award },
      { id: 'TeamMembers', label: 'Team Members', icon: Users },
      { id: 'Repository', label: 'Repository', icon: GitBranch },
      { id: 'ProjectHealth', label: 'Project Health', icon: Activity },
      { id: 'Reports', label: 'Reports', icon: FileText },
      { id: 'Calendar', label: 'Calendar', icon: Calendar },
      { id: 'Notifications', label: 'Notifications', icon: Bell },
      { id: 'Profile', label: 'My Profile', icon: User },
    ],

    ROLE_LEAD: [
      { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'AssignedProjects', label: 'Assigned Projects', icon: FolderKanban },
      { id: 'SprintBoard', label: 'Sprint Board', icon: Layers },
      { id: 'Tasks', label: 'Tasks', icon: CheckSquare },
      { id: 'Developers', label: 'Developers', icon: Users },
      { id: 'Repository', label: 'Repository', icon: GitBranch },
      { id: 'CodeQuality', label: 'Code Quality', icon: Cpu },
      { id: 'ProjectHealth', label: 'Project Health', icon: Activity },
      { id: 'Reports', label: 'Reports', icon: FileText },
      { id: 'Profile', label: 'My Profile', icon: User },
    ],

    ROLE_DEV: [
      { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'MyTasks', label: 'My Tasks', icon: CheckSquare },
      { id: 'Sprint', label: 'Sprint', icon: Layers },
      { id: 'Repository', label: 'Repository', icon: GitBranch },
      { id: 'PullRequests', label: 'Pull Requests', icon: GitPullRequest },
      { id: 'CodeIssues', label: 'Code Issues', icon: AlertCircle },
      { id: 'Profile', label: 'Profile', icon: User },
      { id: 'Notifications', label: 'Notifications', icon: Bell },
    ],

    ROLE_QA: [
      { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'BugTracker', label: 'Bug Tracker', icon: Bug },
      { id: 'TestSuites', label: 'Test Suites', icon: Layers },
      { id: 'TestCases', label: 'Test Cases', icon: CheckSquare },
      { id: 'Projects', label: 'Projects', icon: FolderKanban },
      { id: 'Repository', label: 'Repository', icon: GitBranch },
      { id: 'Reports', label: 'Reports', icon: FileText },
      { id: 'Profile', label: 'Profile', icon: User },
    ]
  };

  const navItems = roleNavigations[role] || roleNavigations.ROLE_ADMIN;

  const roleTitleMap = {
    ROLE_ADMIN: 'System Admin App',
    ROLE_PM: 'Project Manager App',
    ROLE_LEAD: 'Team Lead App',
    ROLE_DEV: 'Developer Workspace',
    ROLE_QA: 'QA Quality App'
  };

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f17] flex flex-col justify-between h-screen sticky top-0 transition-colors z-20 shadow-xs">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              A
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                Aureon <span className="text-indigo-600 text-xs font-semibold">SaaS</span>
              </h1>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
                {roleTitleMap[role]}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation ({navItems.length} modules)
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold border-l-4 border-indigo-600 dark:border-indigo-500 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 status-pulse" />
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            RBAC Governance: ACTIVE
          </span>
        </div>
      </div>
    </aside>
  );
};


