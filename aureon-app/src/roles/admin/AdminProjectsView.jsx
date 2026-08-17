import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialProjects } from '../../services/mockData';
import { FolderKanban, Cpu } from 'lucide-react';

export const AdminProjectsView = () => {
  const columns = [
    { key: 'name', label: 'Project', render: (val, row) => (<div><div className="font-bold text-gray-900 dark:text-gray-100">{val}</div><div className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{row.key}</div></div>) },
    { key: 'manager', label: 'Manager' },
    { key: 'lead', label: 'Tech Lead' },
    { key: 'status', label: 'Status', render: (val) => {
      const c = val === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : val === 'PLANNING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c}`}>{val.replace('_',' ')}</span>;
    }},
    { key: 'progress', label: 'Progress', render: (val) => (<div className="w-28"><div className="flex justify-between text-[10px] mb-1 font-semibold"><span>{val}%</span></div><div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${val}%` }} /></div></div>) },
    { key: 'healthScore', label: 'Health', render: (val) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${val >= 90 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'}`}>{val}/100</span> },
    { key: 'deadline', label: 'Deadline' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Projects Directory" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><FolderKanban className="w-5 h-5 text-indigo-500" />Global Projects Directory</h1><p className="text-xs text-gray-500">Platform-wide view of all projects, health scores, budgets, and delivery timelines.</p></div>
      <DataTable columns={columns} data={initialProjects} searchPlaceholder="Search projects..." />
    </div>
  );
};
