import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { 
  FolderKanban, Layers, CheckSquare, Clock, Calendar, Activity, 
  GitBranch, Bug, Users, Plus, FileText, AlertCircle, TrendingUp, Cpu, BarChart2
} from 'lucide-react';

export const PmDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'Project Manager';

  const [counts, setCounts] = useState({ projects: 0, sprints: 0, tasks: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const token = sessionStorage.getItem('aureon_jwt_access_token');
      try {
        const [resP, resS, resT] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/v1/projects/', { headers: { Authorization: token ? `Bearer ${token}` : '' } }),
          fetch('http://127.0.0.1:8000/api/v1/sprints/', { headers: { Authorization: token ? `Bearer ${token}` : '' } }),
          fetch('http://127.0.0.1:8000/api/v1/tasks/', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
        ]);
        let p = 0, s = 0, t = 0;
        if (resP.ok) { const d = await resP.json(); p = d.count ?? (d.projects ? d.projects.length : 0); }
        if (resS.ok) { const d = await resS.json(); s = d.count ?? (d.sprints ? d.sprints.length : 0); }
        if (resT.ok) { const d = await resT.json(); t = d.count ?? (d.tasks ? d.tasks.length : 0); }
        setCounts({ projects: p, sprints: s, tasks: t });
      } catch (err) {
        setCounts({ projects: 0, sprints: 0, tasks: 0 });
      }
    };
    fetchCounts();
  }, []);

  const widgets = [
    { label: 'Projects', value: `${counts.projects} Projects`, sub: counts.projects > 0 ? 'Database synchronized' : 'No active projects', icon: FolderKanban, color: 'border-l-blue-500' },
    { label: 'Active Sprints', value: `${counts.sprints} Running`, sub: counts.sprints > 0 ? 'Sprints active' : 'No active sprints', icon: Layers, color: 'border-l-indigo-500' },
    { label: 'Assigned Tasks', value: `${counts.tasks} Tasks`, sub: counts.tasks > 0 ? 'In progress' : 'No assigned tasks', icon: CheckSquare, color: 'border-l-emerald-500' },
    { label: 'Project Health', value: counts.projects > 0 ? '94.5%' : '100%', icon: Cpu, sub: 'Workspace Operational', color: 'border-l-emerald-600' },
    { label: 'Repository Status', value: 'Connected', icon: GitBranch, sub: 'Aureon REST Backend', color: 'border-l-blue-600' },
    { label: 'Open Bugs', value: '0 Open', icon: Bug, sub: 'Zero critical issues', color: 'border-l-rose-600' },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Dashboard" title="Project Manager Workspace" />

      {/* Theme-Aware Header Banner */}
      <div className="relative p-6 rounded-2xl aureon-theme-banner overflow-hidden transition-all duration-300 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] uppercase font-bold tracking-wider">
              PM Workspace - {userName}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5">{userName}'s Project Management Hub</h1>
          <p className="text-xs banner-subtext mt-1 max-w-xl">
            Track active project deliverables, manage sprint planning, allocate tasks, and oversee release milestones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 relative z-10">
          <button
            onClick={() => onNavigate('Projects')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/30 shadow-md transition-all hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" /> Initialize Project
          </button>
        </div>
      </div>

      {/* Summary Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
