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
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Dashboard" title="Team Lead Workstation" />

      {/* Theme-Aware Header Banner */}
      <div className="relative p-6 rounded-2xl aureon-theme-banner overflow-hidden transition-all duration-300 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] uppercase font-bold tracking-wider">
              Tech Lead: {userName}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5">{userName}'s Lead Execution Hub</h1>
          <p className="text-xs banner-subtext mt-1 max-w-xl">
            Oversee code quality, review pull requests, allocate tasks to team developers, and manage sprint deliverables.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 relative z-10">
          <button
            onClick={() => onNavigate('SprintBoard')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/30 shadow-md transition-all hover:scale-105"
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
            <div key={i} className={`p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 ${w.color} border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
                <span className="text-[11px] font-semibold">{w.label}</span>
                <Icon className="w-4 h-4 text-slate-400 warm:text-[#69523c]" />
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 warm:text-[#342314] mt-2 truncate">{w.value}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1">{w.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
