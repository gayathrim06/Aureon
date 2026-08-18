import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckSquare, Clock, AlertTriangle, CheckCircle2, GitPullRequest, 
  GitCommit, Activity, Layers, Plus, Code2
} from 'lucide-react';

export const DevDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'Developer';

  const widgets = [
    { label: 'Developer', value: userName, sub: user?.email || 'Active Session', icon: Code2, color: 'border-l-emerald-500' },
    { label: 'Assigned Tasks', value: '0 Tasks', sub: 'Queue clear', icon: CheckSquare, color: 'border-l-blue-500' },
    { label: 'Overdue Tasks', value: '0 Overdue', sub: '100% on schedule', icon: AlertTriangle, color: 'border-l-emerald-600' },
    { label: 'Pull Requests', value: '0 Open', sub: 'No active PRs', icon: GitPullRequest, color: 'border-l-purple-500' },
    { label: 'Workspace Health', value: 'Operational', sub: 'Connected to Django', icon: Activity, color: 'border-l-cyan-500' },
  ];

  return (
    <div className="space-y-6 font-sans">
      <Breadcrumb activeTab="Dashboard" title="Developer IDE Workspace" />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] uppercase font-bold border border-emerald-500/30">
              Developer Workspace - {userName}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">{userName}'s Developer Hub</h1>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            {user?.email ? `Authenticated as ${user.email}` : 'Focus on active tasks, manage Kanban cards, commit code, and submit Pull Requests.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('MyTasks')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Open Kanban Board
          </button>
          <button
            onClick={() => onNavigate('PullRequests')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            <GitPullRequest className="w-3.5 h-3.5" /> Create Pull Request
          </button>
        </div>
      </div>

      {/* Real Summary Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span className="text-[11px] font-semibold">{w.label}</span>
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-2 truncate">{w.value}</div>
              <div className="text-[10px] text-gray-400 mt-1">{w.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

