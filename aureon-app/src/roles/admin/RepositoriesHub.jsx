import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialRepositories } from '../../services/mockData';
import { GitBranch, GitPullRequest, Star, CheckCircle2, Clock, HardDrive } from 'lucide-react';

export const RepositoriesHub = () => {
  const columns = [
    { key: 'name', label: 'Repository', render: (val, row) => (<div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><GitBranch className="w-4 h-4 text-blue-500" /></div><div><div className="font-bold text-gray-900 dark:text-gray-100">{val}</div><div className="text-[10px] text-gray-500">{row.platform} • {row.language}</div></div></div>) },
    { key: 'branches', label: 'Branches', render: (val) => <span className="font-semibold">{val}</span> },
    { key: 'openPRs', label: 'Open PRs', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>{val} PRs</span> },
    { key: 'coverage', label: 'Coverage', render: (val) => { const n = parseFloat(val); return <span className={`font-bold text-[11px] ${n >= 80 ? 'text-emerald-600' : n >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{val}</span>; }},
    { key: 'lastCommit', label: 'Last Commit', render: (val, row) => (<div><div className="text-[11px] font-semibold text-gray-900 dark:text-gray-100">{val}</div><div className="text-[10px] text-gray-500">{row.commitAuthor}</div></div>) },
    { key: 'status', label: 'Sync', render: (val) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${val === 'SYNCED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'}`}>{val === 'SYNCED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}{val}</span> },
    { key: 'size', label: 'Size' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Repositories Hub" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><GitBranch className="w-5 h-5 text-cyan-500" />Repository Integration Hub</h1><p className="text-xs text-gray-500">Connected GitHub repositories with sync status, branch activity, PR counts, and code coverage.</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Repos', value: initialRepositories.length, icon: GitBranch, color: 'border-l-cyan-500' },
          { label: 'Open PRs', value: initialRepositories.reduce((a,r)=>a+r.openPRs,0), icon: GitPullRequest, color: 'border-l-amber-500' },
          { label: 'Total Stars', value: initialRepositories.reduce((a,r)=>a+r.stars,0), icon: Star, color: 'border-l-yellow-500' },
          { label: 'Total Size', value: initialRepositories.reduce((a,r)=>a+parseFloat(r.size),0).toFixed(1)+' MB', icon: HardDrive, color: 'border-l-slate-500' }
        ].map((w, i) => { const Icon = w.icon; return (
          <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="flex items-center justify-between text-gray-500"><span className="text-[11px] font-semibold">{w.label}</span><Icon className="w-4 h-4 text-gray-400" /></div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{w.value}</div>
          </div>
        ); })}
      </div>
      <DataTable columns={columns} data={initialRepositories} searchPlaceholder="Search repos by name, language, platform..." />
    </div>
  );
};
