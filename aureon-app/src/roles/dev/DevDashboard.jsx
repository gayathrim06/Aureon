import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { 
  CheckSquare, Clock, AlertTriangle, CheckCircle2, GitPullRequest, 
  GitCommit, Activity, Layers, Plus, Code2, MessageSquare, Paperclip
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { initialTasks } from '../../services/mockData';

export const DevDashboard = ({ onNavigate }) => {
  const commitTimelineData = [
    { day: 'Mon', commits: 6, prs: 1 },
    { day: 'Tue', commits: 9, prs: 2 },
    { day: 'Wed', commits: 14, prs: 1 },
    { day: 'Thu', commits: 8, prs: 3 },
    { day: 'Fri', commits: 11, prs: 2 },
  ];

  const taskProgressData = [
    { name: 'Completed', count: 12, fill: '#10b981' },
    { name: 'In Review', count: 3, fill: '#f59e0b' },
    { name: 'In Progress', count: 4, fill: '#3b82f6' },
    { name: 'To Do', count: 2, fill: '#9ca3af' },
  ];

  const widgets = [
    { label: 'Assigned Tasks', value: '6 Tasks', sub: 'Sprint 24 active queue', icon: CheckSquare, color: 'border-l-blue-500' },
    { label: "Today's Tasks", value: '2 Due', sub: 'TSK-101 & TSK-102', icon: Clock, color: 'border-l-indigo-500' },
    { label: 'Overdue Tasks', value: '0 Overdue', sub: '100% on schedule', icon: AlertTriangle, color: 'border-l-emerald-500' },
    { label: 'Completed Tasks', value: '12 Tasks', sub: 'Merged to main', icon: CheckCircle2, color: 'border-l-emerald-600' },
    { label: 'Pull Requests', value: '2 Open', sub: 'PR #142 (Token rotation)', icon: GitPullRequest, color: 'border-l-purple-500' },
    { label: 'Latest Commits', value: '48 Commits', sub: 'Branch: feature/jwt-argon2', icon: GitCommit, color: 'border-l-cyan-500' },
    { label: 'Repository Activity', value: 'High', sub: 'aureon/core-backend', icon: Activity, color: 'border-l-blue-600' },
    { label: 'Sprint Progress', value: '82%', sub: 'Sprint 24 (OAuth2)', icon: Layers, color: 'border-l-slate-500' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Dashboard" title="Developer IDE Workspace" />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] uppercase font-bold border border-emerald-500/30">
              Developer Workspace & Kanban
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">Full Stack Development Hub</h1>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Focus on your active tasks, manage interactive Kanban cards, commit code, and submit Pull Requests.
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

      {/* 8 KPI Widgets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span className="text-[11px] font-semibold">{w.label}</span>
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{w.value}</div>
              <div className="text-[10px] text-gray-400 mt-1">{w.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts & Interactive Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commit Timeline Chart */}
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Weekly Commit & Pull Request Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commitTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Bar dataKey="commits" fill="#10b981" radius={[4, 4, 0, 0]} name="Git Commits" />
                <Bar dataKey="prs" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Pull Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assigned Task Quick View */}
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">My Priority Assigned Tasks</h3>
            <div className="space-y-3">
              {initialTasks.slice(0, 3).map((tsk) => (
                <div key={tsk.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">{tsk.id}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        {tsk.priority}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-1">{tsk.title}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    {tsk.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('MyTasks')}
            className="w-full mt-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Launch Interactive Kanban Board
          </button>
        </div>
      </div>
    </div>
  );
};
