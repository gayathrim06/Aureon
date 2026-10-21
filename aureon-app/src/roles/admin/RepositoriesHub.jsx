import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { 
  GitBranch, GitPullRequest, GitCommit, CheckCircle2, Clock, HardDrive, 
  RefreshCw, Users, Shield, Plus, X, ArrowUpRight, ExternalLink, Eye, ChevronRight 
} from 'lucide-react';
import { getAuthHeaders } from '../../services/apiClient';

export const RepositoriesHub = ({ onNavigate }) => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('ALL');

  // Selected Repository Drawer / Modal State
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [modalTab, setModalTab] = useState('COMMITS'); // 'COMMITS' | 'BRANCHES' | 'TEAM'
  const [repoCommits, setRepoCommits] = useState([]);
  const [repoBranches, setRepoBranches] = useState([]);
  const [repoTeam, setRepoTeam] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  // New Branch Modal State
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchSource, setNewBranchSource] = useState('main');
  const [creatingBranch, setCreatingBranch] = useState(false);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/repositories/', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const repos = data.repositories || [];
        const formatted = repos.map(r => ({
          id: r.id,
          raw: r,
          name: r.repository_name || r.name || 'Repository',
          fullName: r.full_name || `${r.owner}/${r.repository_name}`,
          platform: r.provider || 'GitHub',
          language: r.language || 'Python / React',
          projectName: r.project_name || 'Enterprise Project',
          squadName: r.squad_name || 'Assigned Squad',
          defaultBranch: r.default_branch || 'main',
          branchesCount: r.branches_count || (r.branches ? r.branches.length : 5),
          openPRs: r.pull_requests_count !== undefined ? r.pull_requests_count : (r.open_issues || 0),
          coverage: `${r.health_score || 92}%`,
          lastCommit: r.last_synced_at ? r.last_synced_at.substring(0, 10) : 'Recent',
          commitAuthor: r.owner || 'aureon-maker',
          status: r.is_active ? 'SYNCED' : 'PENDING',
          url: r.repository_url || r.url || `https://github.com/aureon-maker/${r.repository_name}`
        }));
        setRepositories(formatted);
      }
    } catch (err) {
      console.warn('Failed to fetch repositories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRepoModal = async (repo) => {
    setSelectedRepo(repo);
    setDetailLoading(true);
    setModalTab('COMMITS');
    setShowCreateBranch(false);

    try {
      // 1. Fetch commits
      const cRes = await fetch(`http://127.0.0.1:8000/api/v1/repositories/${repo.id}/commits`, {
        headers: getAuthHeaders()
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        setRepoCommits(cData.commits || []);
      }

      // 2. Fetch branches
      const bRes = await fetch(`http://127.0.0.1:8000/api/v1/repositories/${repo.id}/branches`, {
        headers: getAuthHeaders()
      });
      if (bRes.ok) {
        const bData = await bRes.json();
        setRepoBranches(bData.branches || []);
        if (bData.default_branch) setNewBranchSource(bData.default_branch);
      }

      // 3. Fetch team members
      const tmRes = await fetch(`http://127.0.0.1:8000/api/v1/repositories/${repo.id}/team-members`, {
        headers: getAuthHeaders()
      });
      if (tmRes.ok) {
        const tmData = await tmRes.json();
        setRepoTeam(tmData.members || []);
      }
    } catch (err) {
      console.error('Failed to load repo details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim() || !selectedRepo) return;

    try {
      setCreatingBranch(true);
      const res = await fetch(`http://127.0.0.1:8000/api/v1/repositories/${selectedRepo.id}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          branch_name: newBranchName.trim(),
          source_branch: newBranchSource
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice({ type: 'success', text: `Branch '${newBranchName}' created successfully!` });
        setNewBranchName('');
        setShowCreateBranch(false);
        // Refresh branches
        const bRes = await fetch(`http://127.0.0.1:8000/api/v1/repositories/${selectedRepo.id}/branches`, {
          headers: getAuthHeaders()
        });
        if (bRes.ok) {
          const bData = await bRes.json();
          setRepoBranches(bData.branches || []);
        }
        await fetchRepositories();
      } else {
        setActionNotice({ type: 'error', text: data.message || 'Failed to create branch.' });
      }
    } catch (err) {
      setActionNotice({ type: 'error', text: 'Network error creating branch.' });
    } finally {
      setCreatingBranch(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const handleNav = (tab) => {
    if (typeof onNavigate === 'function') {
      onNavigate(tab);
    }
  };

  const filteredRepos = React.useMemo(() => {
    if (filterMode === 'SYNCED') {
      return repositories.filter(r => r.status === 'SYNCED');
    }
    if (filterMode === 'PRS') {
      return repositories.filter(r => r.openPRs > 0);
    }
    return repositories;
  }, [repositories, filterMode]);

  const columns = [
    { 
      key: 'name', 
      label: 'Repository & Scope', 
      render: (val, row) => (
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleOpenRepoModal(row)}>
          <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 transition group-hover:scale-105">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 group-hover:text-cyan-600 transition">
              <span>{val}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 font-mono font-medium">
                {row.platform}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{row.projectName}</span>
              <span>•</span>
              <span className="text-gray-400">{row.language}</span>
            </div>
          </div>
        </div>
      ) 
    },
    { 
      key: 'squadName', 
      label: 'Assigned Squad', 
      render: (val) => (
        <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 w-fit">
          <Users className="w-3 h-3 text-cyan-600" />
          {val}
        </span>
      ) 
    },
    { 
      key: 'branchesCount', 
      label: 'Branches', 
      render: (val, row) => (
        <button 
          onClick={(e) => { e.stopPropagation(); handleOpenRepoModal(row); setModalTab('BRANCHES'); }}
          className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 transition flex items-center gap-1 cursor-pointer"
        >
          <GitBranch className="w-3 h-3" />
          {val} Branches
        </button>
      ) 
    },
    { 
      key: 'openPRs', 
      label: 'PRs / Issues', 
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
          {val} Open
        </span>
      ) 
    },
    { 
      key: 'coverage', 
      label: 'Health Score', 
      render: (val) => { 
        const n = parseFloat(val); 
        return (
          <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${n >= 80 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-600'}`}>
            {val}
          </span>
        ); 
      }
    },
    { 
      key: 'status', 
      label: 'Sync State', 
      render: (val) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          {val}
        </span>
      ) 
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => handleOpenRepoModal(row)}
          className="px-2.5 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 rounded-lg border border-cyan-200 dark:border-cyan-800 flex items-center gap-1 transition cursor-pointer"
        >
          <Eye className="w-3 h-3" />
          Inspect Activity
        </button>
      )
    }
  ];

  const totalPRs = repositories.reduce((a, r) => a + (parseInt(r.openPRs) || 0), 0);
  const syncedCount = repositories.filter(r => r.status === 'SYNCED').length;
  const totalBranchesCount = repositories.reduce((a, r) => a + (parseInt(r.branchesCount) || 0), 0);

  const statCards = [
    { label: 'Total Repositories', value: repositories.length, icon: GitBranch, color: 'border-l-cyan-500', hint: 'Show all 5 project repos →', action: () => setFilterMode('ALL') },
    { label: 'Active Git Branches', value: totalBranchesCount, icon: GitBranch, color: 'border-l-indigo-500', hint: 'Isolated branch tracking →', action: () => setFilterMode('ALL') },
    { label: 'Open PRs & Issues', value: totalPRs, icon: GitPullRequest, color: 'border-l-amber-500', hint: 'Filter repos with PRs →', action: () => setFilterMode(prev => prev === 'PRS' ? 'ALL' : 'PRS') },
    { label: 'PostgreSQL Synced', value: syncedCount, icon: CheckCircle2, color: 'border-l-emerald-500', hint: '100% synchronized state →', action: () => setFilterMode(prev => prev === 'SYNCED' ? 'ALL' : 'SYNCED') }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Repositories Hub" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-cyan-500" />
            Aureon Git Lite Repository Integration Hub
          </h1>
          <p className="text-xs text-gray-500">
            Enterprise project repositories under <code className="font-mono text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 px-1 py-0.5 rounded">aureon-maker</code> with strict squad isolation, commit history, and branch management.
          </p>
        </div>
        <button
          onClick={fetchRepositories}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title="Refresh Repositories"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((w, i) => { 
          const Icon = w.icon; 
          return (
            <button 
              key={i} 
              type="button"
              onClick={w.action}
              className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 text-left cursor-pointer group flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-[11px] font-semibold uppercase">{w.label}</span>
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{w.value}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {w.hint}
              </div>
            </button>
          ); 
        })}
      </div>

      {/* Main Table */}
      <DataTable 
        columns={columns} 
        data={filteredRepos} 
        searchPlaceholder="Search repos by name, project, language..." 
        onRowClick={(row) => handleOpenRepoModal(row)}
      />

      {/* ━━━ REPOSITORY DETAILS MODAL (COMMITS, BRANCHES & SQUAD MEMBERS) ━━━ */}
      {selectedRepo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                    {selectedRepo.fullName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                    {selectedRepo.projectName}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                  <span>Squad: <b className="text-slate-700 dark:text-slate-300">{selectedRepo.squadName}</b></span>
                  <span>•</span>
                  <span>Default Branch: <b className="font-mono text-cyan-600">{selectedRepo.defaultBranch}</b></span>
                  <span>•</span>
                  <a 
                    href={selectedRepo.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-cyan-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    Git Lite Remote <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateBranch(!showCreateBranch)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Branch
                </button>
                <button 
                  onClick={() => setSelectedRepo(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {actionNotice && (
              <div className={`p-3 text-xs font-semibold flex items-center justify-between border-b ${
                actionNotice.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-200' 
                  : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-200'
              }`}>
                <span>{actionNotice.text}</span>
                <button onClick={() => setActionNotice(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Create Branch Form */}
            {showCreateBranch && (
              <form onSubmit={handleCreateBranch} className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="New branch name (e.g., feature/escrow-vault, bugfix/auth)..."
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <select
                    value={newBranchSource}
                    onChange={(e) => setNewBranchSource(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {repoBranches.map(b => (
                      <option key={b.name} value={b.name}>From: {b.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creatingBranch || !newBranchName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  {creatingBranch ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Create Branch
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateBranch(false)}
                  className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40">
              <button
                onClick={() => setModalTab('COMMITS')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'COMMITS' 
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-900' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                Commit Stream ({repoCommits.length})
              </button>
              <button
                onClick={() => setModalTab('BRANCHES')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'BRANCHES' 
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-900' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                Active Branches ({repoBranches.length})
              </button>
              <button
                onClick={() => setModalTab('TEAM')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'TEAM' 
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-900' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Authorized Squad Members ({repoTeam.length})
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {detailLoading ? (
                <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
                  <span>Loading repository details from Aureon Git Lite...</span>
                </div>
              ) : modalTab === 'COMMITS' ? (
                /* ━━━ TAB 1: COMMITS STREAM ━━━ */
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {repoCommits.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">No commits found for this repository.</div>
                  ) : (
                    repoCommits.map((c, index) => {
                      const isLatest = index === 0;
                      const sha = (c.commit_sha || c.hash || 'head').substring(0, 7);
                      const branch = c.branch || selectedRepo.defaultBranch || 'main';
                      const dateStr = c.commit_date ? new Date(c.commit_date).toLocaleString() : (c.timestamp || 'Recent');

                      return (
                        <div 
                          key={c.id || sha} 
                          className={`relative pl-10 p-3.5 rounded-xl border transition-all ${
                            isLatest 
                              ? 'bg-cyan-50/40 dark:bg-cyan-950/20 border-cyan-300 dark:border-cyan-700 shadow-sm' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className={`absolute left-2.5 top-4 w-3.5 h-3.5 rounded-full border-2 ${
                            isLatest ? 'bg-cyan-600 border-white ring-2 ring-cyan-300' : 'bg-slate-400 border-white'
                          }`} />

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                <GitCommit className="w-3 h-3 text-cyan-600" />
                                {sha}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                {branch}
                              </span>
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                {c.author_name || c.author || 'Team Member'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{dateStr}</span>
                          </div>

                          <p className="mt-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
                            {c.commit_message || c.message || 'Commit message'}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : modalTab === 'BRANCHES' ? (
                /* ━━━ TAB 2: BRANCHES ━━━ */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>All active branches strictly configured for <b className="text-slate-800 dark:text-slate-200">{selectedRepo.fullName}</b></span>
                    <button
                      onClick={() => setShowCreateBranch(true)}
                      className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create new branch
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {repoBranches.map(b => (
                      <div 
                        key={b.name} 
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${b.protected ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600' : 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600'}`}>
                            <GitBranch className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-mono text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{b.name}</span>
                              {b.protected && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  Default / Protected
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {b.last_commit_message || 'Active branch tracking'} • {b.last_commit_author || 'Squad Member'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {b.short_sha || (b.commit_sha ? b.commit_sha.substring(0, 7) : 'head')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* ━━━ TAB 3: AUTHORIZED SQUAD MEMBERS ━━━ */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-900 dark:text-cyan-200 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-600" />
                    <span><b>Team Isolation Active:</b> Only the {repoTeam.length} members listed below possess commit authorization for this repository. Cross-project commits are strictly rejected with 403 Forbidden.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {repoTeam.map(m => (
                      <div key={m.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs">
                            {m.name ? m.name.substring(0, 2).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{m.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{m.email}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {m.role || 'MEMBER'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono">Repository ID: {selectedRepo.id}</span>
              <button
                onClick={() => setSelectedRepo(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
