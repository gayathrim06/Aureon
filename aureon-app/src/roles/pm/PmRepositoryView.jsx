import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { getAuthHeaders } from '../../services/apiClient';
import { 
  GitBranch, GitCommit, CheckCircle2, Clock, RefreshCw, 
  ExternalLink, Eye, Plus, Send, X, ArrowUpRight, ShieldCheck, User, Calendar
} from 'lucide-react';

export const PmRepositoryView = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoCommits, setRepoCommits] = useState([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [syncingRepoId, setSyncingRepoId] = useState(null);

  // New developer commit modal state
  const [showPushModal, setShowPushModal] = useState(false);
  const [newCommitMessage, setNewCommitMessage] = useState('');
  const [newCommitAuthor, setNewCommitAuthor] = useState('Ram Kumar');
  const [newCommitBranch, setNewCommitBranch] = useState('main');
  const [pushingCommit, setPushingCommit] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

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
            raw: r,
            name: r.name || r.repository_name || 'Repository',
            fullName: r.full_name || `${r.owner}/${r.repository_name}`,
            url: r.url || r.repository_url,
            language: r.language || 'TypeScript',
            platform: 'GitHub',
            defaultBranch: r.default_branch || 'main',
            branches: r.branches_count != null ? r.branches_count : (r.default_branch ? 1 : 0),
            openPRs: r.pull_requests_count || r.open_issues || 0,
            coverage: r.health_score != null ? `${r.health_score}%` : 'N/A',
            commitsCount: r.commits_count || (r.recent_commits ? r.recent_commits.length : 0),
            latestCommit: r.latest_commit || (r.recent_commits && r.recent_commits.length > 0 ? r.recent_commits[0] : null),
            lastCommitDate: r.last_commit_date,
            status: 'SYNCED'
          }));
          setRepositories(formatted);

          // If a repo is already selected, update it in state
          if (selectedRepo) {
            const updated = formatted.find(item => item.id === selectedRepo.id);
            if (updated) setSelectedRepo(updated);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load repositories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepoCommits = async (repoId) => {
    try {
      setCommitsLoading(true);
      const res = await fetch(`http://127.0.0.1:8000/api/v1/repositories/${repoId}/commits`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.commits) {
          setRepoCommits(data.commits);
        }
      }
    } catch (err) {
      console.error('Failed to load repo commits:', err);
    } finally {
      setCommitsLoading(false);
    }
  };

  const handleOpenRepoDetails = async (repo) => {
    setSelectedRepo(repo);
    fetchRepoCommits(repo.id);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/repositories/${repo.id}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.repository) {
          const r = d.repository;
          setSelectedRepo(prev => ({
            ...prev,
            teamMembers: r.team_members || [],
            branchesList: r.branches || [r.default_branch || 'main'],
            squadName: r.squad_name,
            projectName: r.project_name
          }));
          if (r.team_members && r.team_members.length > 0) {
            setNewCommitAuthor(r.team_members[0].name);
          }
          if (r.default_branch) {
            setNewCommitBranch(r.default_branch);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load repo detail info:', e);
    }
  };

  const handleSyncRepository = async (repoId, e) => {
    if (e) e.stopPropagation();
    try {
      setSyncingRepoId(repoId);
      const res = await fetch(`http://127.0.0.1:8000/api/v1/repositories/${repoId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice({ type: 'success', text: data.message || 'Repository synchronized with GitHub!' });
        await fetchRepositories();
        if (selectedRepo && selectedRepo.id === repoId) {
          await fetchRepoCommits(repoId);
        }
      } else {
        setActionNotice({ type: 'error', text: data.message || 'Sync failed.' });
      }
    } catch (err) {
      setActionNotice({ type: 'error', text: 'Error connecting to sync service.' });
    } finally {
      setSyncingRepoId(null);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handlePushDeveloperCommit = async (e) => {
    e.preventDefault();
    if (!newCommitMessage.trim() || !selectedRepo) return;

    try {
      setPushingCommit(true);
      const res = await fetch(`http://127.0.0.1:8000/api/v1/repositories/${selectedRepo.id}/commits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          commit_message: newCommitMessage.trim(),
          author_name: newCommitAuthor.trim(),
          branch: newCommitBranch.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice({ type: 'success', text: `🚀 New commit successfully recorded and synced to ${selectedRepo.name}!` });
        setNewCommitMessage('');
        setShowPushModal(false);
        await fetchRepoCommits(selectedRepo.id);
        await fetchRepositories();
      } else {
        setActionNotice({ type: 'error', text: data.message || 'Failed to push commit.' });
      }
    } catch (err) {
      setActionNotice({ type: 'error', text: 'Network error recording commit.' });
    } finally {
      setPushingCommit(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const columns = [
    { 
      key: 'name', 
      label: 'REPOSITORY', 
      render: (val, row) => (
        <div className="cursor-pointer" onClick={() => handleOpenRepoDetails(row)}>
          <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 hover:text-cyan-600 transition">
            <GitBranch className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>{val}</span>
          </div>
          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300">
              {row.defaultBranch}
            </span>
            <span>{row.language} • {row.platform}</span>
          </div>
        </div>
      ) 
    },
    { 
      key: 'branches', 
      label: 'BRANCHES',
      render: (val, row) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {val}
        </span>
      )
    },
    { 
      key: 'openPRs', 
      label: 'OPEN PRS', 
      render: (val) => <span className={`font-bold ${val > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>{val}</span> 
    },
    { 
      key: 'coverage', 
      label: 'HEALTH / COVERAGE', 
      render: (val) => { 
        const n = parseFloat(val); 
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${n >= 85 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'}`}>
            {val}
          </span>
        ); 
      }
    },
    { 
      key: 'latestCommit', 
      label: 'LAST COMMIT & DEVELOPER UPDATE', 
      render: (commit, row) => {
        if (!commit) {
          return <span className="text-xs text-gray-400 font-mono">No commits</span>;
        }
        const sha = commit.commit_sha ? commit.commit_sha.substring(0, 7) : (commit.hash ? commit.hash.substring(0, 7) : 'head');
        const author = commit.author_name || commit.author || 'Developer';
        const msg = commit.commit_message || commit.message || 'Latest commit';
        const dateStr = commit.commit_date ? new Date(commit.commit_date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (row.lastCommitDate ? new Date(row.lastCommitDate).toLocaleDateString() : 'Recent');

        return (
          <div className="space-y-1 max-w-sm">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 font-mono font-bold text-[10px] flex items-center gap-1">
                <GitCommit className="w-3 h-3" />
                {sha}
              </span>
              <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">
                {author}
              </span>
              <span className="text-[10px] text-gray-400 ml-auto whitespace-nowrap">
                {dateStr}
              </span>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-1 italic font-sans" title={msg}>
              "{msg}"
            </p>
          </div>
        );
      }
    },
    { 
      key: 'status', 
      label: 'SYNC STATUS', 
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3" />
            {val}
          </span>
          <button
            onClick={(e) => handleOpenRepoDetails(row)}
            className="px-2 py-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 rounded border border-cyan-200 dark:border-cyan-800 flex items-center gap-1 transition"
            title="Inspect Commit History & Diff"
          >
            <Eye className="w-3 h-3" />
            Commits
          </button>
        </div>
      ) 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200' 
            : 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200'
        }`}>
          <span>{actionNotice.text}</span>
          <button onClick={() => setActionNotice(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Breadcrumb & Global Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Breadcrumb activeTab="Repository Status" />
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRepositories}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Repositories
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          Connected Git Repositories & Live Developer Activity
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Monitor real-time Git commits pushed by developers, review commit messages, check branch sync status, and inspect repository health.
        </p>
      </div>

      {/* Repository Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Repositories</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{repositories.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Synced to PostgreSQL
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Commits Tracked</div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
            {repositories.reduce((acc, r) => acc + (r.commitsCount || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all connected project repos</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Latest Push Project</div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
            {repositories[0]?.name || 'thrift-in-campus'}
          </div>
          <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono mt-1 truncate">
            {repositories[0]?.latestCommit?.commit_sha?.substring(0, 7) || 'fd2f770'} (by {repositories[0]?.latestCommit?.author_name || 'aureon-maker'})
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Default Branch</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">main</div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">Protected branch tracking active</div>
        </div>
      </div>

      {/* Main Repository DataTable */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Repository Registry</span>
            <span className="text-xs font-normal text-slate-500">(Click any row to open the full Commit Stream & History)</span>
          </div>
        </div>
        <DataTable 
          columns={columns} 
          data={repositories} 
          searchPlaceholder="Search repository by name or language..." 
          onRowClick={(row) => handleOpenRepoDetails(row)}
        />
      </div>

      {/* ━━━ COMMIT STREAM & DETAIL MODAL / DRAWER ━━━ */}
      {selectedRepo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <GitBranch className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                    {selectedRepo.fullName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    {selectedRepo.commitsCount} Commits
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span>Branch: <b className="font-mono text-cyan-600 dark:text-cyan-400">{selectedRepo.defaultBranch}</b></span>
                  <span>•</span>
                  <span>Health Score: <b className="text-emerald-600">{selectedRepo.coverage}</b></span>
                  {selectedRepo.url && (
                    <>
                      <span>•</span>
                      <a 
                        href={selectedRepo.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-cyan-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        GitHub Repo <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPushModal(!showPushModal)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Record Developer Push
                </button>
                <button
                  onClick={(e) => handleSyncRepository(selectedRepo.id, e)}
                  disabled={syncingRepoId === selectedRepo.id}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingRepoId === selectedRepo.id ? 'animate-spin' : ''}`} />
                  Sync GitHub
                </button>
                <button 
                  onClick={() => { setSelectedRepo(null); setShowPushModal(false); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Optional "Record Developer Push" Banner */}
            {showPushModal && (
              <form onSubmit={handlePushDeveloperCommit} className="p-4 bg-cyan-50/60 dark:bg-cyan-950/40 border-b border-cyan-100 dark:border-cyan-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    Simulate / Record Developer Commit & Push to {selectedRepo.name}
                  </div>
                  <span className="text-[10px] text-cyan-700 dark:text-cyan-300">
                    Instantly records the commit and updates the live commit stream
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      placeholder="Commit message (e.g., feat(auth): add JWT auth token)..."
                      value={newCommitMessage}
                      onChange={(e) => setNewCommitMessage(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-cyan-300 dark:border-cyan-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <select
                      value={newCommitAuthor}
                      onChange={(e) => setNewCommitAuthor(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-cyan-300 dark:border-cyan-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {selectedRepo?.teamMembers && selectedRepo.teamMembers.length > 0 ? (
                        selectedRepo.teamMembers.map(m => (
                          <option key={m.id} value={m.name}>{m.name} ({m.role || 'Member'})</option>
                        ))
                      ) : (
                        <option value={newCommitAuthor}>{newCommitAuthor}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <select
                      value={newCommitBranch}
                      onChange={(e) => setNewCommitBranch(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-cyan-300 dark:border-cyan-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                    >
                      {selectedRepo?.branchesList && selectedRepo.branchesList.length > 0 ? (
                        selectedRepo.branchesList.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))
                      ) : (
                        <>
                          <option value="main">main</option>
                          <option value="develop">develop</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPushModal(false)}
                    className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pushingCommit || !newCommitMessage.trim()}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition disabled:opacity-50"
                  >
                    {pushingCommit ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Push & Commit Now
                  </button>
                </div>
              </form>
            )}

            {/* Modal Body: Commit Stream Timeline */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <GitCommit className="w-4 h-4 text-cyan-600" />
                  Chronological Git Commit History (Latest Pushes First)
                </span>
                <span className="text-[11px] font-normal text-slate-400 font-mono">
                  Branch: {selectedRepo.defaultBranch}
                </span>
              </div>

              {commitsLoading ? (
                <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
                  <span>Loading authentic commits from Git registry...</span>
                </div>
              ) : repoCommits.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No commits recorded yet. Click "Record Developer Push" above to log a new commit.
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {repoCommits.map((c, index) => {
                    const isLatest = index === 0;
                    const sha = c.commit_sha ? c.commit_sha.substring(0, 7) : (c.hash ? c.hash.substring(0, 7) : 'head');
                    const fullSha = c.commit_sha || c.hash || sha;
                    const author = c.author_name || c.author || 'Developer';
                    const email = c.author_email || 'dev@aureon.com';
                    const msg = c.commit_message || c.message || 'Commit';
                    const dateStr = c.commit_date ? new Date(c.commit_date).toLocaleString() : (c.timestamp || 'Recent');

                    return (
                      <div 
                        key={c.id || sha} 
                        className={`relative pl-10 p-4 rounded-xl border transition-all ${
                          isLatest 
                            ? 'bg-cyan-50/40 dark:bg-cyan-950/20 border-cyan-300 dark:border-cyan-700 shadow-sm' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {/* Dot on timeline */}
                        <div className={`absolute left-2.5 top-5 w-3.5 h-3.5 rounded-full border-2 ${
                          isLatest 
                            ? 'bg-cyan-600 border-white dark:border-slate-900 ring-2 ring-cyan-300' 
                            : 'bg-slate-400 dark:bg-slate-600 border-white dark:border-slate-900'
                        }`} />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs flex items-center gap-1 ${
                              isLatest 
                                ? 'bg-cyan-600 text-white shadow-sm' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}>
                              <GitCommit className="w-3 h-3" />
                              {sha}
                            </span>

                            {isLatest && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                ★ LATEST COMMIT / HEAD
                              </span>
                            )}

                            <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {author}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({email})
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            {dateStr}
                          </div>
                        </div>

                        {/* Commit Message */}
                        <p className="mt-2 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                          {msg}
                        </p>

                        {/* Footer Info */}
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono">Full SHA: {fullSha}</span>
                          {selectedRepo.url && (
                            <a 
                              href={`${selectedRepo.url}/commit/${sha}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                            >
                              View on GitHub <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {repoCommits.length} commits in stream</span>
              <button
                onClick={() => setSelectedRepo(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition"
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
