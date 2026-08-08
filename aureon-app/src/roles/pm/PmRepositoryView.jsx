import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialRepositories } from '../../services/mockData';
import { GitBranch, CheckCircle2, Clock } from 'lucide-react';

export const PmRepositoryView = () => {
  const columns = [
    { key: 'name', label: 'Repository', render: (val, row) => (<div><div className="font-bold text-gray-900 dark:text-gray-100">{val}</div><div className="text-[10px] text-gray-500">{row.language} • {row.platform}</div></div>) },
    { key: 'branches', label: 'Branches' },
    { key: 'openPRs', label: 'Open PRs', render: (val) => <span className={`font-bold ${val > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{val}</span> },
    { key: 'coverage', label: 'Coverage', render: (val) => { const n = parseFloat(val); return <span className={`font-bold ${n >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{val}</span>; }},
    { key: 'lastCommit', label: 'Last Commit' },
    { key: 'status', label: 'Sync', render: (val) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${val === 'SYNCED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-600'}`}>{val === 'SYNCED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Repository Status" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><GitBranch className="w-5 h-5 text-cyan-500" />Connected Repository Status</h1><p className="text-xs text-gray-500">Monitor repository sync, PR counts, code coverage, and recent commit activity.</p></div>
      <DataTable columns={columns} data={initialRepositories} searchPlaceholder="Search repos..." />
    </div>
  );
};
