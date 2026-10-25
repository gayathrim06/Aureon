import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { FolderKanban, Activity, CheckCircle2, ShieldCheck, Users, CheckSquare, Layers, ArrowRight, Search, RefreshCw } from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';

export const LeadAssignedProjects = ({ onNavigate }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAssignedProjectsAndTasks = async () => {
    setLoading(true);
    const headers = getAuthHeaders();

    try {
      const [pRes, tRes] = await Promise.all([
        fetch(`${API_BASE_URL}/projects/`, { headers }),
        fetch(`${API_BASE_URL}/tasks/`, { headers })
      ]);

      let liveTasks = [];
      if (tRes.ok) {
        const tData = await tRes.json();
        liveTasks = tData.tasks || [];
        setTasks(liveTasks);
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        const allProjs = pData.projects || [];

        // Strictly enforce that Team Leads only see projects under their own technical leadership
        const myAssignedProjs = allProjs.filter(p => {
          if (!user) return false;
          if (user.role === 'ROLE_ADMIN') return true;
          const uId = String(user.id || '');
          const uName = (user.name || user.full_name || '').toLowerCase().trim();
          const uEmail = (user.email || '').toLowerCase().trim();
          const pLeadId = String(p.lead_id || '');
          const pLeadName = (p.lead_name || '').toLowerCase().trim();
          const pLeadEmail = (p.lead_email || '').toLowerCase().trim();

          const isDirectLead = (pLeadId && uId && pLeadId === uId) ||
                               (pLeadEmail && uEmail && pLeadEmail === uEmail) ||
                               (pLeadName && uName && (pLeadName === uName || pLeadName.includes(uName) || uName.includes(pLeadName)));

          if (isDirectLead) return true;

          if (p.members && Array.isArray(p.members)) {
            return p.members.some(m => String(m.id || m.user_id) === uId || (m.email && m.email.toLowerCase() === uEmail));
          }

          return false;
        });

        const formatted = myAssignedProjs.map(p => {
          const projTasks = liveTasks.filter(t => t.project_id === p.id || t.project_name === p.name);
          const doneTasks = projTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED');
          const total = projTasks.length;
          const completed = doneTasks.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            ...p,
            name: p.name || p.project_name || 'Project',
            description: p.description || 'No description recorded in database.',
            manager_name: p.manager_name || 'Unassigned',
            lead_name: p.lead_name || 'Unassigned',
            health_score: p.health_score !== undefined ? p.health_score : 90,
            status: p.status || 'IN_PROGRESS',
            target_deadline: p.target_deadline || p.deadline || 'No deadline set',
            total_tasks: total,
            completed_tasks: completed,
            completion_pct: pct
          };
        });
        setProjects(formatted);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Failed to load assigned projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedProjectsAndTasks();
  }, [user]);

  const handleNav = (tab) => {
    if (typeof onNavigate === 'function') {
      onNavigate(tab);
    }
  };

  const filteredProjects = projects.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.lead_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Assigned Projects" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Assigned Projects Portfolio & Task Completion Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Projects under your technical leadership with health scores, assigned team leads, and live task completion progress meters from PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={fetchAssignedProjectsAndTasks}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Refresh projects"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && projects.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          Loading assigned projects from database...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          No projects matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map(p => (
            <div
              key={p.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-200 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    {p.id ? String(p.id).substring(0, 8) : 'PRJ'}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Health Score</span>
                    <span className={`text-xl font-black ${p.health_score !== null && p.health_score !== undefined ? (p.health_score >= 90 ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-400'}`}>
                      {p.health_score !== null && p.health_score !== undefined ? `${p.health_score} / 100` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white warm:text-[#342314]">{p.name || p.project_name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{p.description}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Project Manager:</span>
                    <strong className="text-slate-900 dark:text-white">{p.manager_name}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Appointed Tech Lead:</span>
                    <strong className="text-indigo-600 dark:text-indigo-400">{p.lead_name}</strong>
                  </div>
                </div>

                {/* TASK COMPLETION METER */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-500" /> Task Completion Meter
                    </span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">
                      {p.completed_tasks} of {p.total_tasks} Finished ({p.completion_pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${p.completion_pct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 text-[10px]">
                    <ShieldCheck className="w-3.5 h-3.5" /> {p.status || 'IN_PROGRESS'}
                  </span>
                  <span>Deadline: <strong className="text-slate-700 dark:text-slate-300 font-mono">{p.target_deadline}</strong></span>
                </div>
              </div>

              {/* Interactive Action Buttons with Hover State */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    sessionStorage.setItem('aureon_active_project_id', String(p.id));
                    handleNav('SprintBoard');
                  }}
                  className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" /> Sprint Board
                </button>
                <button
                  onClick={() => handleNav('ProjectHealth')}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" /> Health
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

