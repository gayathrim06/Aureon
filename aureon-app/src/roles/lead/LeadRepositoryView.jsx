import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import { GitCommit, Plus, Minus, RefreshCw } from 'lucide-react';

export const LeadRepositoryView = () => {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCommits = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/repositories/commits`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.commits) {
          const formatted = data.commits.map(c => ({
            id: c.id,
            hash: c.commit_sha ? c.commit_sha.substring(0, 7) : 'head',
            message: c.commit_message || 'Commit update',
            author: c.author_name || c.author || 'Team Member',
            repo: c.repository_name || 'Repository',
            branch: c.branch || 'main',
            additions: c.additions || 0,
            deletions: c.deletions || 0,
            timestamp: c.commit_date ? new Date(c.commit_date).toLocaleString() : 'Recent'
          }));
          setCommits(formatted);
        }
      }
    } catch (err) {
      console.error('Failed to load team commits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommits();
  }, []);

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
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Repository Activity" />
        <button
          onClick={fetchCommits}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Commits
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-cyan-500" />Team Repository & Commit History
        </h1>
        <p className="text-xs text-gray-500">Live commit timeline, branch activity, code changes, and author tracking from PostgreSQL.</p>
      </div>

      <DataTable columns={columns} data={commits} searchPlaceholder="Search commits by hash, message, author..." />
    </div>
  );
};

