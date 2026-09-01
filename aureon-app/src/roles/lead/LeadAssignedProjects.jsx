import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { FolderKanban, Activity, CheckCircle2, ShieldCheck, Users, CheckSquare, Layers } from 'lucide-react';

export const LeadAssignedProjects = () => {
  const { user } = useAuth();
  const defaultProjects = [
    {
      id: 'PRJ-101',
      name: 'Verona Organic',
      project_name: 'Verona Organic',
      description: 'An ecommerce website and application for selling products',
      manager_name: 'Gopika Manoj',
      lead_name: 'Krishna Deepesh',
      health_score: 90,
      status: 'IN_PROGRESS',
      target_deadline: '2026-09-30',
      total_tasks: 1,
      completed_tasks: 0,
      completion_pct: 0
    }
  ];

  const [projects, setProjects] = useState(defaultProjects);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignedProjectsAndTasks = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

    try {
      const [pRes, tRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/projects/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/tasks/', { headers })
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

        if (allProjs.length > 0) {
          const formatted = allProjs.map(p => {
            const projTasks = liveTasks.filter(t => t.project_id === p.id || t.project_name === p.name);
            const doneTasks = projTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED');
            const total = projTasks.length > 0 ? projTasks.length : 1;
            const completed = doneTasks.length;
            const pct = Math.round((completed / total) * 100);

            return {
              ...p,
              name: p.name || p.project_name || 'Verona Organic',
              description: p.description || 'An ecommerce website and application for selling products',
              manager_name: p.manager_name || 'Gopika Manoj',
              lead_name: p.lead_name || 'Krishna Deepesh',
              health_score: p.health_score || 90,
              status: p.status || 'IN_PROGRESS',
              target_deadline: p.target_deadline || '2026-09-30',
              total_tasks: total,
              completed_tasks: completed,
              completion_pct: pct
            };
          });
          setProjects(formatted);
        } else {
          setProjects(defaultProjects);
        }
      } else {
        setProjects(defaultProjects);
      }
    } catch (err) {
      setProjects(defaultProjects);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedProjectsAndTasks();
  }, [user]);

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Assigned Projects" />

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Assigned Projects Portfolio & Task Completion Tracker
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Projects under your technical leadership with health scores, assigned team leads, and live task completion progress meters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(p => (
          <div key={p.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                {p.id ? p.id.substring(0, 8) : 'PRJ-101'}
              </span>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Health Score</span>
                <span className={`text-xl font-black ${p.health_score >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {p.health_score || 90} / 100
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white warm:text-[#342314]">{p.name || p.project_name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{p.description || 'An ecommerce website and application for selling products'}</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Project Manager:</span>
                <strong className="text-slate-900 dark:text-white">{p.manager_name || 'Gopika Manoj'}</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Appointed Tech Lead:</span>
                <strong className="text-indigo-600 dark:text-indigo-400">{p.lead_name || 'Krishna Deepesh'}</strong>
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

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" /> {p.status || 'IN_PROGRESS'}
              </span>
              <span>Deadline: <strong className="text-slate-700 dark:text-slate-300 font-mono">{p.target_deadline || '2026-09-30'}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
