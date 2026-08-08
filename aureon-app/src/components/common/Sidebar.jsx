import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Building, Users, Shield, Users2, FolderKanban, GitBranch, 
  Activity, FileText, Server, Bell, Settings, Calendar, Award, Code2, 
  CheckSquare, GitPullRequest, AlertCircle, User, Cpu, Bug, FileCheck, Layers
} from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab }) => {
  const { user } = useAuth();
  const role = user?.role || 'ROLE_ADMIN';

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
    ],

    ROLE_DEV: [
      { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'MyTasks', label: 'My Tasks', icon: CheckSquare },
      { id: 'Sprint', label: 'Sprint', icon: Layers },
      { id: 'Repository', label: 'Repository', icon: GitBranch },
      { id: 'PullRequests', label: 'Pull Requests', icon: GitPullRequest },
      { id: 'Issues', label: 'Issues', icon: AlertCircle },
      { id: 'Profile', label: 'Profile', icon: User },
      { id: 'Notifications', label: 'Notifications', icon: Bell },
    ],

    ROLE_QA: [
      { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'AssignedTesting', label: 'Assigned Testing', icon: FileCheck },
      { id: 'BugTracker', label: 'Bug Tracker', icon: Bug },
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
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col justify-between h-screen sticky top-0 transition-colors z-20">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              A
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-none">
                Aureon <span className="text-blue-600 text-xs font-semibold">SaaS</span>
              </h1>
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                {roleTitleMap[role]}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Navigation ({navItems.length} pages)
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold border-l-4 border-blue-600 dark:border-blue-500'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 status-pulse" />
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
            RBAC Enforcement: ACTIVE
          </span>
        </div>
      </div>
    </aside>
  );
};
