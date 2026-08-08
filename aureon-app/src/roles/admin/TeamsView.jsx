import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialTeams } from '../../services/mockData';
import { Users2, UserCheck, FolderKanban, Activity } from 'lucide-react';

export const TeamsView = () => {
  const columns = [
    { key: 'name', label: 'Team Name', render: (val) => <span className="font-bold text-gray-900 dark:text-gray-100">{val}</span> },
    { key: 'lead', label: 'Team Lead', render: (val) => <span className="text-blue-600 dark:text-blue-400 font-semibold">{val}</span> },
    { key: 'members', label: 'Members', render: (val) => (
      <div className="flex flex-wrap gap-1">{val.map((m,i) => <span key={i} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-medium">{m}</span>)}</div>
    )},
    { key: 'department', label: 'Department' },
    { key: 'projectCount', label: 'Projects', render: (val) => <span className="font-bold text-indigo-600 dark:text-indigo-400">{val}</span> },
    { key: 'capacity', label: 'Capacity', render: (val) => {
      const pct = parseInt(val);
      return (
        <div className="w-24">
          <div className="flex justify-between text-[10px] mb-1 font-semibold"><span>{val}</span></div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${pct >= 85 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: val }} />
          </div>
        </div>
      );
    }}
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Teams Configuration" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Users2 className="w-5 h-5 text-blue-500" />Teams Configuration & Allocation</h1><p className="text-xs text-gray-500">Manage engineering teams, member assignments, capacity, and cross-project allocation.</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Teams', value: initialTeams.length, icon: Users2, color: 'border-l-blue-500' },
          { label: 'Total Members', value: initialTeams.reduce((a,t)=>a+t.members.length,0), icon: UserCheck, color: 'border-l-emerald-500' },
          { label: 'Active Projects', value: initialTeams.reduce((a,t)=>a+t.projectCount,0), icon: FolderKanban, color: 'border-l-indigo-500' },
          { label: 'Avg Capacity', value: Math.round(initialTeams.reduce((a,t)=>a+parseInt(t.capacity),0)/initialTeams.length) + '%', icon: Activity, color: 'border-l-amber-500' }
        ].map((w, i) => { const Icon = w.icon; return (
          <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="flex items-center justify-between text-gray-500"><span className="text-[11px] font-semibold">{w.label}</span><Icon className="w-4 h-4 text-gray-400" /></div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{w.value}</div>
          </div>
        ); })}
      </div>
      <DataTable columns={columns} data={initialTeams} searchPlaceholder="Search teams by name, lead, department..." />
    </div>
  );
};
