import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, CheckSquare, Activity, Cpu, Clock, GitPullRequest, Layers, 
  GitBranch, CheckCircle2, AlertTriangle, ArrowRight, UserCheck, Code2
} from 'lucide-react';

export const LeadDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'Team Lead';

  const widgets = [
    { label: 'Logged-in Lead', value: userName, sub: user?.email || 'Authenticated', icon: Users, color: 'border-l-blue-500' },
    { label: 'Active Tasks', value: '0 Tasks', sub: 'Queue clear', icon: CheckSquare, color: 'border-l-indigo-500' },
    { label: 'Code Quality Gate', value: 'PASSED', sub: 'SonarQube Ready', icon: Cpu, color: 'border-l-purple-500' },
    { label: 'Pending Code Reviews', value: '0 PRs', sub: 'No open PRs', icon: GitPullRequest, color: 'border-l-amber-500' },
    { label: 'Sprint Progress', value: '100%', sub: 'Operational', icon: Layers, color: 'border-l-emerald-600' },
  ];

  return (
    <div className="space-y-6 font-sans">
      <Breadcrumb activeTab="Dashboard" title="Team Lead Workstation" />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-900 via-stone-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] uppercase font-bold border border-amber-500/30">
              Tech Lead: {userName}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">{userName}'s Lead Execution Hub</h1>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Oversee code quality, review pull requests, allocate tasks to team developers, and manage sprint deliverables.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('SprintBoard')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Layers className="w-3.5 h-3.5" /> Sprint Kanban Board
          </button>
        </div>
      </div>

      {/* Summary Widgets Grid */}
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

