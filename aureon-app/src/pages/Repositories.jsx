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
      if (res?.success && Array.isArray(res?.data)) {
        setRepositories(res.data);
      }
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
          <p className="text-xs text-[#94A3B8] mt-1">Live Git repositories hosted on PostgreSQL database</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchRepos} isLoading={loading}>
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => showToast('Create repository via Repositories Hub', 'info')}>
            New Repository
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle icon={GitBranch}>Repository Health & Hosting</CardTitle>
          <Badge variant="success" dot font-semibold>{repositories.length} Active Repositories</Badge>
        </CardHeader>

        {repositories.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No repositories hosted yet. Create one using the Lite Git Repository Hosting module.
          </div>
        ) : (
          <Table headers={['Repository Name', 'Default Branch', 'Latest Commit', 'Status', 'Visibility']}>
            {repositories.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-semibold text-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-[#2563EB]" />
                    <span>{r.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-[#38BDF8] px-2 py-0.5 bg-[#111827] rounded border border-[#334155]">{r.default_branch || 'main'}</span>
                </TableCell>
                <TableCell className="font-mono text-xs text-[#CBD5E1]">
                  {r.latest_commit ? (r.latest_commit.commit_hash ? r.latest_commit.commit_hash.substring(0, 7) : 'Active') : 'Initial'}
                </TableCell>
                <TableCell>
                  <Badge variant="success" size="sm">Active</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-[#10B981] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {r.visibility || 'Private'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
};
