import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { initialProjects } from '../../services/mockData';
import { FolderKanban, Activity, CheckCircle2 } from 'lucide-react';

export const LeadAssignedProjects = () => {
  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Assigned Projects" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><FolderKanban className="w-5 h-5 text-indigo-500" />Assigned Project Portfolio</h1><p className="text-xs text-gray-500">Projects under your technical leadership with health scores and sprint status.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialProjects.map(p => (
          <div key={p.id} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">{p.key}</span>
              <span className={`text-2xl font-black ${p.healthScore >= 90 ? 'text-emerald-600' : p.healthScore >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>{p.healthScore}</span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{p.name}</h3>
            <p className="text-[10px] text-gray-500 mt-1">PM: {p.manager} • Deadline: {p.deadline}</p>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] mb-1"><span className="text-gray-500">Progress</span><span className="font-bold text-blue-600">{p.progress}%</span></div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${p.progress}%` }} /></div>
            </div>
            <div className="mt-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/60 text-[10px]">
              <span className="text-gray-400">Active Sprint: </span><span className="font-semibold text-gray-700 dark:text-gray-300">{p.activeSprint}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
