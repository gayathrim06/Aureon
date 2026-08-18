import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialRepositories } from '../../services/mockData';
import { GitBranch, CheckCircle2, Clock, Rocket } from 'lucide-react';

export const QaRepositoryStatus = () => {
  const columns = [
    { key: 'name', label: 'Repository', render: (val, row) => (<div><div className="font-bold text-gray-900 dark:text-gray-100">{val}</div><div className="text-[10px] text-gray-500">{row.language} • {row.platform}</div></div>) },
    { key: 'coverage', label: 'Test Coverage', render: (val) => { const n = parseFloat(val); return <span className={`font-bold ${n >= 80 ? 'text-emerald-600' : n >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{val}</span>; }},
    { key: 'status', label: 'Build Status', render: () => <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" />PASSING</span> },
    { key: 'lastCommit', label: 'Last Commit' },
    { key: 'openPRs', label: 'Open PRs', render: (val) => <span className="font-bold">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Build & Deploy Status" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Rocket className="w-5 h-5 text-emerald-500" />Repository Build & Deploy Status</h1><p className="text-xs text-gray-500">Build pipeline status, deployment history, and test coverage per repository.</p></div>
      <DataTable columns={columns} data={initialRepositories} searchPlaceholder="Search repos..." />
    </div>
  );
};
