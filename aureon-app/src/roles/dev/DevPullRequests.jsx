import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import { GitPullRequest, GitMerge, CheckCircle2, Clock, Plus, Minus, MessageSquare, RefreshCw } from 'lucide-react';

export const DevPullRequests = () => {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchPRs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/repositories/pull-requests`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.pull_requests) {
          const formatted = data.pull_requests.map(p => ({
            id: `PR-#${p.pr_number || p.github_pr_id || p.id.substring(0, 4)}`,
            title: p.title || 'Pull Request Update',
            repo: p.repo_name || p.repository_name || 'Repository',
            status: (p.status || 'OPEN').toUpperCase(),
            branch: p.source_branch || 'feature',
            author: p.author || 'Engineer',
            additions: p.additions ?? 0,
            deletions: p.deletions ?? 0,
            comments: p.comments_count ?? 0,
            checks: p.review_status === 'APPROVED' ? 'PASSING' : 'PENDING'
          }));
          setPrs(formatted);
        }
      }
    } catch (err) {
      console.error('Failed to load PRs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPRs();
  }, []);

  const statusColors = {
    OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    MERGED: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    CLOSED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  };
  const statusIcons = {
    OPEN: <CheckCircle2 className="w-3 h-3" />,
    REVIEW: <Clock className="w-3 h-3" />,
    MERGED: <GitMerge className="w-3 h-3" />,
    CLOSED: null
  };

  const columns = [
    { key: 'id', label: 'PR', render: (val) => <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">{val}</span> },
    { key: 'title', label: 'Title', render: (val) => <span className="font-semibold text-gray-900 dark:text-gray-100 text-[11px]">{val}</span> },
    { key: 'repo', label: 'Repository', render: (val) => <span className="font-mono text-[10px] text-gray-500">{val}</span> },
    { key: 'author', label: 'Author', render: (val) => <span className="text-[11px] text-gray-700 dark:text-gray-300">{val}</span> },
    { key: 'status', label: 'Status', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${statusColors[val] || statusColors.OPEN}`}>{statusIcons[val]}{val}</span> },
    { key: 'branch', label: 'Branch', render: (val) => <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold">{val}</span> },
    { key: 'additions', label: 'Changes', render: (val, row) => (<div className="flex items-center gap-2 text-[10px] font-mono"><span className="text-emerald-600 font-bold">+{val}</span><span className="text-rose-600 font-bold">-{row.deletions}</span></div>) },
    { key: 'comments', label: 'Comments', render: (val) => <span className="flex items-center gap-1 text-gray-500"><MessageSquare className="w-3 h-3" />{val}</span> },
    { key: 'checks', label: 'CI', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'PASSING' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700'}`}>{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Pull Requests" />
        <button
          onClick={fetchPRs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh PRs
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <GitPullRequest className="w-5 h-5 text-purple-500" />My Pull Requests
        </h1>
        <p className="text-xs text-gray-500">Live pull requests from PostgreSQL: status, branch review, CI checks, and merges.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['OPEN','REVIEW','MERGED','CLOSED'].map(s => {
          const isActive = statusFilter === s;
          const count = prs.filter(p => p.status === s).length;
          return (
            <button 
              key={s} 
              type="button"
              onClick={() => setStatusFilter(prev => prev === s ? 'ALL' : s)}
              className={`p-4 rounded-xl border-l-4 ${
                s==='OPEN' ? 'border-l-emerald-500' : s==='REVIEW' ? 'border-l-amber-500' : s==='MERGED' ? 'border-l-purple-500' : 'border-l-gray-500'
              } border-y border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 text-left cursor-pointer group flex flex-col justify-between ${
                isActive ? 'ring-2 ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20' : 'bg-white dark:bg-gray-800'
              }`}
            >
              <div>
                <div className="text-[11px] font-semibold text-gray-500 uppercase">{s} PRs</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{count}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {isActive ? 'Showing filtered (click to reset)' : `Filter ${s} →`}
              </div>
            </button>
          );
        })}
      </div>

      <DataTable 
        columns={columns} 
        data={statusFilter === 'ALL' ? prs : prs.filter(p => p.status === statusFilter)} 
        searchPlaceholder="Search PRs by title, branch, repo..." 
      />
    </div>
  );
};

