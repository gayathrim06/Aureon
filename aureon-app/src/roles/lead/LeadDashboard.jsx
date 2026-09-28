import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, CheckSquare, Activity, Cpu, Clock, GitPullRequest, Layers, 
  GitBranch, CheckCircle2, AlertTriangle, ArrowRight, UserCheck, Code2, FolderKanban
} from 'lucide-react';
import { getAuthHeaders } from '../../services/apiClient';

export const LeadDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'Team Lead';

  const [stats, setStats] = useState({
    activeTasks: 0,
    inReviewCount: 0,
    activeProjects: 0,
    activeSprintsCount: 0,
    avgSprintScore: 100,
    teamDevsCount: 0,
    availableDevsCount: 0
  });

  const fetchDashboardStats = async () => {
    const headers = getAuthHeaders();

    try {
      const [tRes, pRes, sRes, aRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/tasks/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/projects/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/sprints/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/team-lead/my-team/availability', { headers })
      ]);

      let tasks = [];
      let projects = [];
      let sprints = [];
      let devs = [];

      if (tRes.ok) {
        const tData = await tRes.json();
        tasks = tData.tasks || [];
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        projects = pData.projects || [];
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        sprints = sData.sprints || [];
      }

      if (aRes.ok) {
        const aData = await aRes.json();
        devs = aData.developers || [];
      }

      const activeTasks = tasks.filter(t => !['COMPLETED', 'DONE', 'CLOSED'].includes(t.status));
      const inReviewCount = tasks.filter(t => t.status === 'IN_REVIEW').length;
      const activeSprints = sprints.filter(s => s.status === 'ACTIVE');
      const sprintScores = sprints.map(s => s.sprint_score !== undefined ? s.sprint_score : 100);
      const avgScore = sprintScores.length > 0 ? Math.round(sprintScores.reduce((a, b) => a + b, 0) / sprintScores.length) : 100;
      const availableDevs = devs.filter(d => d.is_available).length;

      setStats({
        activeTasks: activeTasks.length,
        inReviewCount,
        activeProjects: projects.length,
        activeSprintsCount: activeSprints.length,
        avgSprintScore: avgScore,
        teamDevsCount: devs.length,
        availableDevsCount: availableDevs
      });
    } catch (err) {
      setStats({
        activeTasks: 0,
        inReviewCount: 0,
        activeProjects: 0,
        activeSprintsCount: 0,
        avgSprintScore: 100,
        teamDevsCount: 0,
        availableDevsCount: 0
      });
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const widgets = [
    { label: 'Logged-in Tech Lead', value: userName, sub: user?.email || 'Active Session', icon: Users, color: 'border-l-blue-500' },
    { label: 'Scoped Projects', value: `${stats.activeProjects} Project${stats.activeProjects !== 1 ? 's' : ''}`, sub: 'Assigned Portfolio', icon: FolderKanban, color: 'border-l-purple-500' },
    { label: 'Active Tasks', value: `${stats.activeTasks} Task${stats.activeTasks !== 1 ? 's' : ''}`, sub: `${stats.inReviewCount} Pending Review`, icon: CheckSquare, color: 'border-l-indigo-500' },
    { label: 'Sprint Health Score', value: `${stats.avgSprintScore}/100`, sub: `${stats.activeSprintsCount} Active Sprint${stats.activeSprintsCount !== 1 ? 's' : ''}`, icon: Layers, color: 'border-l-emerald-600' },
    { label: 'Squad Availability', value: `${stats.availableDevsCount}/${stats.teamDevsCount} Ready`, sub: 'Ready for Next Task', icon: Cpu, color: 'border-l-amber-500' },
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
            Oversee code quality, review pull requests, allocate tasks to team developers, and manage sprint deliverables for PM assigned projects.
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
