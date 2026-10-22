import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, CheckSquare, Activity, Cpu, Clock, GitPullRequest, Layers, 
  GitBranch, CheckCircle2, AlertTriangle, ArrowRight, UserCheck, Code2, 
  FolderKanban, FileText, ChevronRight, Sparkles, ExternalLink, Plus
} from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';

export const LeadDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'Team Lead';

  const [rawProjects, setRawProjects] = useState([]);
  const [rawTasks, setRawTasks] = useState([]);
  const [rawSprints, setRawSprints] = useState([]);
  const [rawDevs, setRawDevs] = useState([]);
  const [loading, setLoading] = useState(true);

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
    setLoading(true);
    const headers = getAuthHeaders();

    try {
      const [tRes, pRes, sRes, aRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tasks/`, { headers }),
        fetch(`${API_BASE_URL}/projects/`, { headers }),
        fetch(`${API_BASE_URL}/sprints/`, { headers }),
        fetch(`${API_BASE_URL}/team-lead/my-team/availability`, { headers })
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

      // Scope projects strictly to this Team Lead's assigned project portfolio
      const myProjects = projects.filter(p => {
        if (!user || user.role === 'ROLE_ADMIN') return true;
        const uId = String(user.id || '');
        const uName = (user.name || user.full_name || '').toLowerCase().trim();
        const uEmail = (user.email || '').toLowerCase().trim();
        const pLeadId = String(p.lead_id || '');
        const pLeadName = (p.lead_name || '').toLowerCase().trim();
        const pLeadEmail = (p.lead_email || '').toLowerCase().trim();

        if ((pLeadId && uId && pLeadId === uId) ||
            (pLeadEmail && uEmail && pLeadEmail === uEmail) ||
            (pLeadName && uName && (pLeadName === uName || pLeadName.includes(uName) || uName.includes(pLeadName)))) {
          return true;
        }
        if (p.members && Array.isArray(p.members)) {
          return p.members.some(m => String(m.id || m.user_id) === uId || (m.email && m.email.toLowerCase() === uEmail));
        }
        return false;
      });

      const myProjectIds = myProjects.map(p => String(p.id));
      const myProjectNames = myProjects.map(p => (p.name || '').toLowerCase());

      // Filter tasks to only this Lead's assigned project deliverables
      const myTasks = user?.role === 'ROLE_ADMIN' 
        ? tasks 
        : tasks.filter(t => myProjectIds.includes(String(t.project_id)) || myProjectNames.includes((t.project_name || '').toLowerCase()));

      // Filter sprints to only this Lead's assigned project iterations
      const mySprints = user?.role === 'ROLE_ADMIN'
        ? sprints
        : sprints.filter(s => myProjectIds.includes(String(s.project_id)));

      setRawProjects(myProjects);
      setRawTasks(myTasks);
      setRawSprints(mySprints);
      setRawDevs(devs);

      const activeTasks = myTasks.filter(t => !['COMPLETED', 'DONE', 'CLOSED'].includes(t.status));
      const inReviewCount = myTasks.filter(t => t.status === 'IN_REVIEW' || t.status === 'REVIEW').length;
      
      // Look for any active/in-progress sprints matching database statuses
      const activeSprints = mySprints.filter(s => 
        ['ACTIVE', 'IN_PROGRESS', 'IN PROGRESS', 'STARTED', 'PLANNING'].includes((s.status || '').toUpperCase())
      );
      
      const sprintScores = mySprints
        .map(s => s.sprint_score !== undefined && s.sprint_score !== null ? Number(s.sprint_score) : null)
        .filter(score => score !== null);
      
      const avgScore = sprintScores.length > 0 
        ? Math.round(sprintScores.reduce((a, b) => a + b, 0) / sprintScores.length) 
        : 100;
      
      const availableDevs = devs.filter(d => d.is_available).length;

      setStats({
        activeTasks: activeTasks.length,
        inReviewCount,
        activeProjects: myProjects.length,
        activeSprintsCount: activeSprints.length,
        avgSprintScore: avgScore,
        teamDevsCount: devs.length,
        availableDevsCount: availableDevs
      });
    } catch (err) {
      console.error('Failed to load lead dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleNav = (tab) => {
    if (typeof onNavigate === 'function') {
      onNavigate(tab);
    }
  };

  const widgets = [
    { 
      label: 'Logged-in Tech Lead', 
      value: userName, 
      sub: user?.email || 'Active Session', 
      icon: Users, 
      color: 'border-l-blue-500 hover:border-l-blue-600', 
      tab: 'Profile',
      hint: 'Manage profile'
    },
    { 
      label: 'Scoped Projects', 
      value: `${stats.activeProjects} Project${stats.activeProjects !== 1 ? 's' : ''}`, 
      sub: 'Assigned Portfolio', 
      icon: FolderKanban, 
      color: 'border-l-purple-500 hover:border-l-purple-600', 
      tab: 'AssignedProjects',
      hint: 'View portfolio'
    },
    { 
      label: 'Active Tasks', 
      value: `${stats.activeTasks} Task${stats.activeTasks !== 1 ? 's' : ''}`, 
      sub: `${stats.inReviewCount} Pending Review`, 
      icon: CheckSquare, 
      color: 'border-l-indigo-500 hover:border-l-indigo-600', 
      tab: 'SprintBoard',
      hint: 'Inspect tasks'
    },
    { 
      label: 'Sprint Health Score', 
      value: `${stats.avgSprintScore}/100`, 
      sub: `${stats.activeSprintsCount} Active Sprint${stats.activeSprintsCount !== 1 ? 's' : ''}`, 
      icon: Layers, 
      color: 'border-l-emerald-600 hover:border-l-emerald-700', 
      tab: 'ProjectHealth',
      hint: 'View analytics'
    },
    { 
      label: 'Squad Availability', 
      value: `${stats.availableDevsCount}/${stats.teamDevsCount} Ready`, 
      sub: 'Ready for Next Task', 
      icon: Cpu, 
      color: 'border-l-amber-500 hover:border-l-amber-600', 
      tab: 'Developers',
      hint: 'Manage squad'
    },
  ];

  const quickActions = [
    { label: 'Sprint Kanban Board', tab: 'SprintBoard', icon: Layers, desc: 'Drag-and-drop workflow & deliverables' },
    { label: 'Assigned Projects', tab: 'AssignedProjects', icon: FolderKanban, desc: 'Active project health & task progress' },
    { label: 'Developers Roster', tab: 'Developers', icon: Users, desc: 'Virtual team capacity & task allocation' },
    { label: 'Repository Activity', tab: 'Repository', icon: GitBranch, desc: 'Live commits, branches & code changes' },
    { label: 'Project Health', tab: 'ProjectHealth', icon: Activity, desc: 'Technical health trends & test coverage' },
    { label: 'Team Reports', tab: 'Reports', icon: FileText, desc: 'Developer velocity & completion rates' },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Dashboard" title="Team Lead Workstation" onNavigate={handleNav} />

      {/* Theme-Aware Header Banner */}
      <div className="relative p-6 rounded-2xl aureon-theme-banner overflow-hidden transition-all duration-300 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tech Lead: {userName}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5">{userName}'s Lead Execution Hub</h1>
          <p className="text-xs banner-subtext mt-1 max-w-xl text-white/90">
            Oversee code quality, review pull requests, allocate tasks to team developers, and manage sprint deliverables for PM assigned projects.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 relative z-10">
          <button
            onClick={() => handleNav('SprintBoard')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/35 active:scale-95 text-white text-xs font-bold border border-white/30 shadow-md transition-all duration-150 cursor-pointer hover:shadow-lg"
          >
            <Layers className="w-4 h-4" /> Sprint Kanban Board
          </button>
          <button
            onClick={() => handleNav('Developers')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/25 active:scale-95 text-white text-xs font-bold border border-white/20 shadow-sm transition-all duration-150 cursor-pointer"
          >
            <Users className="w-4 h-4" /> Developer Roster
          </button>
        </div>
      </div>

      {/* Summary Widgets Grid - Interactive Clickable Cards with Rich Hover */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleNav(w.tab)}
              title={`Click to open ${w.tab}`}
              className={`w-full text-left p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 ${w.color} border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:scale-95 cursor-pointer group flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
            >
              <div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
                  <span className="text-[11px] font-semibold">{w.label}</span>
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#dac8a8] text-slate-500 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 warm:text-[#342314] mt-2 truncate">
                  {w.value}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 truncate">
                  {w.sub}
                </div>
              </div>
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                <span className="opacity-75 group-hover:opacity-100 transition-opacity">{w.hint}</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Action Navigation Buttons Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Quick Lead Actions & Workspace Modules
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">Click any card to jump directly</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {quickActions.map((qa, idx) => {
            const Icon = qa.icon;
            return (
              <button
                key={idx}
                onClick={() => handleNav(qa.tab)}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 hover:-translate-y-0.5 active:scale-95 transition-all duration-150 text-left cursor-pointer group flex flex-col justify-between"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {qa.label}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {qa.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Data Section from PostgreSQL Database */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scoped Projects (Real DB Data) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Scoped Projects Portfolio (Database Records)
              </h2>
              <p className="text-[11px] text-slate-500">Live projects assigned in PostgreSQL with calculated progress.</p>
            </div>
            <button
              onClick={() => handleNav('AssignedProjects')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer hover:underline"
            >
              View All ({rawProjects.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {rawProjects.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              {loading ? 'Loading projects from database...' : 'No assigned projects found in database.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rawProjects.slice(0, 4).map((p) => {
                const projTasks = rawTasks.filter(t => t.project_id === p.id || t.project_name === p.name);
                const doneTasks = projTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED');
                const total = projTasks.length > 0 ? projTasks.length : 0;
                const completed = doneTasks.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                          {p.id ? String(p.id).substring(0, 8) : 'PRJ'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'IN_PROGRESS' 
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {p.status || 'ACTIVE'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2 truncate">
                        {p.name || p.project_name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {p.description || 'No description recorded in database.'}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Health Score:</span>
                        <strong className="text-emerald-600 font-bold">{p.health_score || 90}/100</strong>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Task Completion:</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{completed}/{total} ({pct}%)</strong>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => handleNav('SprintBoard')}
                          className="flex-1 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 text-[11px] font-bold transition-all text-center cursor-pointer"
                        >
                          Sprint Board
                        </button>
                        <button
                          onClick={() => handleNav('ProjectHealth')}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                        >
                          Health
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Tasks Table (Real DB Data) */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Active Deliverable Tasks (Live DB)
                </h2>
                <p className="text-[11px] text-slate-500">Real tasks fetched from PostgreSQL database.</p>
              </div>
              <button
                onClick={() => handleNav('SprintBoard')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer hover:underline"
              >
                Kanban View ({rawTasks.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] rounded-2xl border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {rawTasks.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleNav('SprintBoard')}
                    className="w-full text-left p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group focus:outline-hidden"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                          t.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {t.priority || 'NORMAL'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {t.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                        <span>Project: <strong className="text-slate-600 dark:text-slate-300">{t.project_name || t.project || 'General'}</strong></span>
                        <span>Assignee: <strong className="text-indigo-600 dark:text-indigo-400">{t.assignee_name || t.assigned_to || 'Unassigned'}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'DONE' || t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                        t.status === 'IN_REVIEW' || t.status === 'REVIEW' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                        t.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {t.status || 'TODO'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Squad Developers & Sprints */}
        <div className="space-y-6">
          {/* Engineering Squad Live Availability */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Engineering Squad Status
                </h2>
                <p className="text-[11px] text-slate-500">Live availability from database.</p>
              </div>
              <button
                type="button"
                onClick={() => handleNav('Developers')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer hover:underline"
              >
                Roster <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] rounded-2xl border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] divide-y divide-slate-100 dark:divide-slate-800 shadow-xs overflow-hidden">
              {rawDevs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading squad developers...</div>
              ) : (
                rawDevs.slice(0, 5).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleNav('Developers')}
                    className="w-full text-left p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group focus:outline-hidden"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {(d.name || d.full_name || 'D').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {d.name || d.full_name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">{d.designation || 'Engineer'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {d.is_available ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          {d.active_tasks_count || 1} Busy
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 text-center">
                <button
                  type="button"
                  onClick={() => handleNav('Developers')}
                  className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Allocate Task to Developer
                </button>
              </div>
            </div>
          </div>

          {/* Active Sprints Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Active Sprints (Live DB)
                </h2>
                <p className="text-[11px] text-slate-500">Live sprint progress.</p>
              </div>
              <button
                type="button"
                onClick={() => handleNav('SprintBoard')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer hover:underline"
              >
                Sprint Board <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] rounded-2xl border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] divide-y divide-slate-100 dark:divide-slate-800 shadow-xs overflow-hidden">
              {rawSprints.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading sprints...</div>
              ) : (
                rawSprints.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleNav('SprintBoard')}
                    className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group space-y-1.5 focus:outline-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-[180px]">
                        {s.name || s.sprint_name}
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        Score: {s.sprint_score !== undefined ? s.sprint_score : 100}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{s.project_name || s.project || 'Project'}</span>
                      <span>{s.end_date ? `Ends ${s.end_date}` : 'Active'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
