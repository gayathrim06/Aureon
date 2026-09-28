import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeaders } from '../../services/apiClient';
import { GitBranch, Plus, Minus, RefreshCw } from 'lucide-react';

export const DevRepositoryView = () => {
  const { user } = useAuth();
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCommits = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/repositories/commits', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.commits) {
          const formatted = data.commits.map(c => ({
            id: c.id,
            hash: c.commit_sha ? c.commit_sha.substring(0, 7) : 'head',
            message: c.commit_message || 'Commit update',
            repo: c.repository_name || 'Repository',
            branch: c.branch || 'main',
            author: c.author_name || c.author || 'Developer',
            additions: c.additions || 0,
            deletions: c.deletions || 0,
            timestamp: c.commit_date ? new Date(c.commit_date).toLocaleString() : 'Recent'
          }));
          setCommits(formatted);
        }
      }
    } catch (err) {
      console.error('Failed to load commits:', err);
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
    { key: 'repo', label: 'Repository', render: (val) => <span className="font-mono text-[10px] text-gray-500">{val}</span> },
    { key: 'author', label: 'Author', render: (val) => <span className="text-[11px] text-gray-700 dark:text-gray-300">{val}</span> },
    { key: 'branch', label: 'Branch', render: (val) => <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold">{val}</span> },
    { key: 'additions', label: 'Changes', render: (val, row) => (<div className="flex items-center gap-2 text-[10px] font-mono"><span className="text-emerald-600 font-bold flex items-center gap-0.5"><Plus className="w-3 h-3" />{val}</span><span className="text-rose-600 font-bold flex items-center gap-0.5"><Minus className="w-3 h-3" />{row.deletions}</span></div>) },
    { key: 'timestamp', label: 'Time' }
  ];

  const totalCommits = commits.length;
  const totalAdditions = commits.reduce((a, c) => a + (c.additions || 0), 0);
  const totalDeletions = commits.reduce((a, c) => a + (c.deletions || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="My Repository" />
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
          <GitBranch className="w-5 h-5 text-cyan-500" />My Code & Commit History
        </h1>
        <p className="text-xs text-gray-500">Live commit timeline, branch activity, and code changes from PostgreSQL repositories.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 border-l-purple-500 border-y border-r border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-[11px] font-semibold text-gray-500">Total Commits</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{totalCommits}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 border-l-emerald-500 border-y border-r border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-[11px] font-semibold text-gray-500">Lines Added</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{totalAdditions}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 border-l-rose-500 border-y border-r border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-[11px] font-semibold text-gray-500">Lines Removed</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{totalDeletions}</div>
        </div>
      </div>

      <DataTable columns={columns} data={commits} searchPlaceholder="Search commits by message, hash, repo..." />
    </div>
  );
};

