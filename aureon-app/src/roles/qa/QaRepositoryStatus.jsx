import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import { GitBranch, CheckCircle2, Clock, Rocket, RefreshCw } from 'lucide-react';

export const QaRepositoryStatus = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/repositories/`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.repositories) {
          const formatted = data.repositories.map(r => ({
            id: r.id,
            name: r.name || r.repo_name || 'Repository',
            language: r.language || 'Other',
            platform: r.platform || 'GitHub',
            coverage: r.health_score != null ? `${r.health_score}%` : 'N/A',
            buildStatus: 'No CI Data',
            lastCommit: r.last_commit_date ? new Date(r.last_commit_date).toLocaleString() : 'Recent',
            openPRs: r.pull_request_count || 0
          }));
          setRepositories(formatted);
        }
      }
    } catch (err) {
      console.error('Failed to load QA repositories status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const columns = [
    { key: 'name', label: 'Repository', render: (val, row) => (<div><div className="font-bold text-gray-900 dark:text-gray-100">{val}</div><div className="text-[10px] text-gray-500">{row.language} • {row.platform}</div></div>) },
    { key: 'coverage', label: 'Test Coverage', render: (val) => {
      if (!val || val === 'N/A') return <span className="text-gray-400 font-mono text-xs">N/A</span>;
      const n = parseFloat(val);
      return <span className={`font-bold ${n >= 80 ? 'text-emerald-600' : n >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{val}</span>;
    }},
    { key: 'buildStatus', label: 'Build Status', render: (val) => (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${val === 'PASSING' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
        <Clock className="w-3 h-3" />{val || 'No CI Data'}
      </span>
    )},
    { key: 'lastCommit', label: 'Last Commit' },
    { key: 'openPRs', label: 'Open PRs', render: (val) => <span className="font-bold">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Build & Deploy Status" />
        <button
          onClick={fetchRepos}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-emerald-500" />Repository Build & Deploy Status
        </h1>
        <p className="text-xs text-gray-500">Live PostgreSQL repository pipeline status, deployment health, and test coverage.</p>
      </div>

      <DataTable columns={columns} data={repositories} searchPlaceholder="Search repos..." />
    </div>
  );
};

