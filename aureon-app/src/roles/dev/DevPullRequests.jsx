import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialPullRequests } from '../../services/mockData';
import { GitPullRequest, GitMerge, CheckCircle2, Clock, Plus, Minus, MessageSquare } from 'lucide-react';

export const DevPullRequests = () => {
  const statusColors = { OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', MERGED: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', CLOSED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
  const statusIcons = { OPEN: <CheckCircle2 className="w-3 h-3" />, REVIEW: <Clock className="w-3 h-3" />, MERGED: <GitMerge className="w-3 h-3" />, CLOSED: null };

  const columns = [
    { key: 'id', label: 'PR', render: (val) => <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">{val}</span> },
    { key: 'title', label: 'Title', render: (val) => <span className="font-semibold text-gray-900 dark:text-gray-100 text-[11px]">{val}</span> },
    { key: 'repo', label: 'Repository', render: (val) => <span className="font-mono text-[10px] text-gray-500">{val}</span> },
    { key: 'status', label: 'Status', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${statusColors[val]}`}>{statusIcons[val]}{val}</span> },
    { key: 'branch', label: 'Branch', render: (val) => <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold">{val}</span> },
    { key: 'additions', label: 'Changes', render: (val, row) => (<div className="flex items-center gap-2 text-[10px] font-mono"><span className="text-emerald-600 font-bold">+{val}</span><span className="text-rose-600 font-bold">-{row.deletions}</span></div>) },
    { key: 'comments', label: 'Comments', render: (val) => <span className="flex items-center gap-1 text-gray-500"><MessageSquare className="w-3 h-3" />{val}</span> },
    { key: 'checks', label: 'CI', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'PASSING' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700'}`}>{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Pull Requests" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><GitPullRequest className="w-5 h-5 text-purple-500" />My Pull Requests</h1><p className="text-xs text-gray-500">Track your PRs: status, reviewer comments, CI checks, and merge conflicts.</p></div>
      <div className="grid grid-cols-4 gap-4">
        {['OPEN','REVIEW','MERGED','CLOSED'].map(s => (
          <div key={s} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${s==='OPEN'?'border-l-emerald-500':s==='REVIEW'?'border-l-amber-500':s==='MERGED'?'border-l-purple-500':'border-l-gray-500'} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="text-[11px] font-semibold text-gray-500">{s}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{initialPullRequests.filter(p=>p.status===s).length}</div>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={initialPullRequests} searchPlaceholder="Search PRs by title, branch, repo..." />
    </div>
  );
};
