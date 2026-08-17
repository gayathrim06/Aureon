import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialCommitHistory } from '../../services/mockData';
import { GitCommit, Plus, Minus } from 'lucide-react';

export const LeadRepositoryView = () => {
  const columns = [
    { key: 'hash', label: 'Hash', render: (val) => <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">{val}</span> },
    { key: 'message', label: 'Commit Message', render: (val) => <span className="font-semibold text-gray-900 dark:text-gray-100 text-[11px]">{val}</span> },
    { key: 'author', label: 'Author', render: (val) => <span className="text-blue-600 dark:text-blue-400 font-semibold">{val}</span> },
    { key: 'repo', label: 'Repository', render: (val) => <span className="font-mono text-[10px] text-gray-500">{val}</span> },
    { key: 'branch', label: 'Branch', render: (val) => <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold">{val}</span> },
    { key: 'additions', label: 'Changes', render: (val, row) => (
      <div className="flex items-center gap-2 text-[10px] font-mono">
        <span className="text-emerald-600 font-bold flex items-center gap-0.5"><Plus className="w-3 h-3" />{val}</span>
        <span className="text-rose-600 font-bold flex items-center gap-0.5"><Minus className="w-3 h-3" />{row.deletions}</span>
      </div>
    )},
    { key: 'timestamp', label: 'Time' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Repository Activity" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><GitCommit className="w-5 h-5 text-cyan-500" />Team Repository & Commit History</h1><p className="text-xs text-gray-500">Commit timeline, branch activity, code changes, and author tracking.</p></div>
      <DataTable columns={columns} data={initialCommitHistory} searchPlaceholder="Search commits by hash, message, author..." />
    </div>
  );
};
