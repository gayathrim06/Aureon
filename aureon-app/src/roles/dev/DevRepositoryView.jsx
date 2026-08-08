import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialCommitHistory } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { GitBranch, Plus, Minus } from 'lucide-react';

export const DevRepositoryView = () => {
  const { user } = useAuth();
  const myCommits = initialCommitHistory.filter(c => c.author === (user?.name || 'Marcus Brody'));

  const columns = [
    { key: 'hash', label: 'Hash', render: (val) => <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">{val}</span> },
    { key: 'message', label: 'Commit Message', render: (val) => <span className="font-semibold text-gray-900 dark:text-gray-100 text-[11px]">{val}</span> },
    { key: 'repo', label: 'Repository', render: (val) => <span className="font-mono text-[10px] text-gray-500">{val}</span> },
    { key: 'branch', label: 'Branch', render: (val) => <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold">{val}</span> },
    { key: 'additions', label: 'Changes', render: (val, row) => (<div className="flex items-center gap-2 text-[10px] font-mono"><span className="text-emerald-600 font-bold flex items-center gap-0.5"><Plus className="w-3 h-3" />{val}</span><span className="text-rose-600 font-bold flex items-center gap-0.5"><Minus className="w-3 h-3" />{row.deletions}</span></div>) },
    { key: 'timestamp', label: 'Time' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="My Repository" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><GitBranch className="w-5 h-5 text-cyan-500" />My Code & Commit History</h1><p className="text-xs text-gray-500">Your personal commit timeline, branch activity, and code changes.</p></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 border-l-purple-500 border-y border-r border-gray-200 dark:border-gray-700 shadow-sm"><div className="text-[11px] font-semibold text-gray-500">Total Commits</div><div className="text-2xl font-bold text-purple-600 mt-1">{myCommits.length}</div></div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 border-l-emerald-500 border-y border-r border-gray-200 dark:border-gray-700 shadow-sm"><div className="text-[11px] font-semibold text-gray-500">Lines Added</div><div className="text-2xl font-bold text-emerald-600 mt-1">{myCommits.reduce((a,c)=>a+c.additions,0)}</div></div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 border-l-rose-500 border-y border-r border-gray-200 dark:border-gray-700 shadow-sm"><div className="text-[11px] font-semibold text-gray-500">Lines Removed</div><div className="text-2xl font-bold text-rose-600 mt-1">{myCommits.reduce((a,c)=>a+c.deletions,0)}</div></div>
      </div>
      <DataTable columns={columns} data={myCommits} searchPlaceholder="Search your commits..." />
    </div>
  );
};
