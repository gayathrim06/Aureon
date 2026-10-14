import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Table, TableRow, TableCell } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { apiClient } from '../services/apiClient';
import { GitBranch, GitCommit, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Repositories = () => {
  const { showToast } = useAuth();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/repositories/');
      const list = Array.isArray(res?.repositories) ? res.repositories : (Array.isArray(res?.data) ? res.data : []);
      setRepositories(list);
    } catch (e) {
      console.error('Error fetching repositories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Connected Repositories</h2>
          <p className="text-xs text-[#94A3B8] mt-1">Synchronized GitHub repositories linked to Aureon projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchRepos} isLoading={loading}>
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => showToast('Connect a GitHub repository via Repositories Hub or Project Settings', 'info')}>
            New Repository
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle icon={GitBranch}>Repository Health & GitHub Synchronization</CardTitle>
          <Badge variant="success" dot font-semibold>{repositories.length} Active Repositories</Badge>
        </CardHeader>

        {repositories.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No GitHub repositories connected yet. Connect repositories via Repositories Hub or Project Settings.
          </div>
        ) : (
          <Table headers={['Repository Name', 'Default Branch', 'Latest Commit & Developer Update', 'Status', 'Visibility']}>
            {repositories.map(r => {
              const lc = r.latest_commit;
              const sha = lc ? (lc.commit_sha ? lc.commit_sha.substring(0, 7) : (lc.short_sha || (lc.commit_hash ? lc.commit_hash.substring(0, 7) : 'head'))) : 'Active';
              const author = lc ? (lc.author_name || lc.author || 'Developer') : '';
              const msg = lc ? (lc.commit_message || lc.message || '') : '';
              
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-[#F8FAFC]">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-[#2563EB]" />
                      <span>{r.name || r.repository_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-[#38BDF8] px-2 py-0.5 bg-[#111827] rounded border border-[#334155]">{r.default_branch || 'main'}</span>
                  </TableCell>
                  <TableCell className="text-xs text-[#CBD5E1]">
                    {lc ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                            {sha}
                          </span>
                          <span className="text-gray-300 font-semibold">{author}</span>
                        </div>
                        {msg && <p className="text-[11px] text-gray-400 italic line-clamp-1">"{msg}"</p>}
                      </div>
                    ) : (
                      <span className="font-mono text-gray-500">No commits</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" size="sm">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-[#10B981] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {r.visibility || 'Public'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
};
