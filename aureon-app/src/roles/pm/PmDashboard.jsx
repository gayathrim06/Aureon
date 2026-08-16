import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { 
  FolderKanban, Layers, CheckSquare, Clock, Calendar, Activity, 
  GitBranch, Bug, Users, Plus, FileText, AlertCircle, TrendingUp, Cpu
} from 'lucide-react';

export const PmDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'Project Manager';

  const widgets = [
    { label: 'Projects', value: '0 Active', sub: 'Dataset empty', icon: FolderKanban, color: 'border-l-blue-500' },
    { label: 'Active Sprints', value: '0 Running', sub: 'No active sprint', icon: Layers, color: 'border-l-indigo-500' },
    { label: 'Assigned Tasks', value: '0 Tasks', sub: 'Queue clear', icon: CheckSquare, color: 'border-l-emerald-500' },
    { label: 'Project Health', value: '100%', icon: Cpu, sub: 'Workspace Operational', color: 'border-l-emerald-600' },
    { label: 'Repository Status', value: 'Connected', icon: GitBranch, sub: 'Aureon REST Backend', color: 'border-l-blue-600' },
    { label: 'Open Bugs', value: '0 Open', icon: Bug, sub: 'Zero critical issues', color: 'border-l-rose-600' },
  ];

  return (
    <div className="space-y-6 font-sans">
      <Breadcrumb activeTab="Dashboard" title="Project Manager Workspace" />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] uppercase font-bold border border-blue-500/30">
              PM Workspace - {userName}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">{userName}'s Project Management Hub</h1>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Track active project deliverables, manage sprint planning, allocate tasks, and oversee release milestones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('Projects')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Initialize Project
          </button>
          <button
            onClick={() => onNavigate('Sprints')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-blue-300" /> Manage Sprints
          </button>
        </div>
      </div>

      {/* Real Summary Widgets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <div key={i} className={`p-3.5 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span className="text-[10px] font-semibold truncate">{w.label}</span>
                <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </div>
              <div className="text-base font-bold text-gray-900 dark:text-gray-100 mt-1.5">{w.value}</div>
              <div className="text-[9px] text-gray-400 mt-0.5 truncate">{w.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Sprint Burndown & Milestone Progress Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sprint Burndown Chart */}
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Sprint 24 Burndown Velocity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sprintBurndown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Line type="monotone" dataKey="remaining" stroke="#3b82f6" strokeWidth={3} name="Actual Remaining" />
                <Line type="monotone" dataKey="target" stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={2} name="Target Guideline" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Milestone Completion */}
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Milestone Delivery Progress</h3>
          <div className="space-y-4">
            {milestoneProgress.map((m, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{m.name}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{m.completed}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${m.completed}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-2">Bug Resolution Trends</h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bugTrends}>
                  <XAxis dataKey="week" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="open" fill="#ef4444" radius={[3, 3, 0, 0]} name="New Bugs" />
                  <Bar dataKey="resolved" fill="#10b981" radius={[3, 3, 0, 0]} name="Resolved Bugs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
