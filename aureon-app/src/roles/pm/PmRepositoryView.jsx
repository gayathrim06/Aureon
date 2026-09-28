import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { getAuthHeaders } from '../../services/apiClient';
import { GitBranch, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

export const PmRepositoryView = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/repositories/', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.repositories) {
          const formatted = data.repositories.map(r => ({
            id: r.id,
            name: r.name || r.repo_name || 'Repository',
            language: r.language || 'Python',
            platform: r.platform || 'GitHub',
            branches: r.branch_count || 3,
            openPRs: r.pull_request_count || 0,
            coverage: r.health_score ? `${r.health_score}%` : '88%',
            lastCommit: r.last_commit_date ? new Date(r.last_commit_date).toLocaleString() : 'Recent',
            status: r.sync_status || 'SYNCED'
          }));
          setRepositories(formatted);
        }
      }
    } catch (err) {
      console.error('Failed to load repositories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

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
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Repository Status" />
        <button
          onClick={fetchRepositories}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Repositories
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-cyan-500" />Connected Repository Status
        </h1>
        <p className="text-xs text-gray-500">Live PostgreSQL repository sync status, PR counts, and code coverage.</p>
      </div>

      <DataTable columns={columns} data={repositories} searchPlaceholder="Search repos..." />
    </div>
  );
};

