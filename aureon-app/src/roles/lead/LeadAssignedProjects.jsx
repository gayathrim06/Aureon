import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { FolderKanban, Activity, CheckCircle2, ShieldCheck, Users } from 'lucide-react';

export const LeadAssignedProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignedProjects = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/projects/', { headers });
      if (res.ok) {
        const data = await res.json();
        const allProjs = data.projects || [];
        // Filter projects assigned to logged-in lead or show portfolio
        const leadProjs = allProjs.filter(p => {
          const leadName = (p.lead_name || '').toLowerCase();
          const uName = (user?.full_name || user?.name || user?.username || '').toLowerCase();
          return !leadName || leadName.includes('unassigned') || leadName.includes(uName) || uName.includes(leadName) || p.lead_id === user?.id;
        });
        setProjects(leadProjs.length > 0 ? leadProjs : allProjs);
      } else {
        setProjects([]);
      }
    } catch (err) {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedProjects();
  }, [user]);

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Assigned Projects" />

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Assigned Projects Portfolio
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Projects under your technical leadership with health scores, assigned team leads, and sprint deliverables.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
            No active projects assigned yet.
          </div>
        ) : (
          projects.map(p => (
            <div key={p.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                  {p.id ? p.id.substring(0, 8) : 'PRJ-101'}
                </span>
                <span className={`text-2xl font-black ${p.health_score >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {p.health_score || 90}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white warm:text-[#342314]">{p.name || p.project_name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{p.description || 'Enterprise software project'}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Project Manager:</span>
                  <strong className="text-slate-900 dark:text-white">{p.manager_name || 'Gopika Manoj'}</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Appointed Tech Lead:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400">{p.lead_name || 'Krishna Deepesh'}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-bold text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" /> {p.status || 'IN_PROGRESS'}
                </span>
                <span>Deadline: <strong className="text-slate-700 dark:text-slate-300">{p.target_deadline || p.start_date || '2026-09-30'}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
