import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Table, TableRow, TableCell } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { mockRepositories } from '../mock/mockData';
import { GitBranch, GitCommit, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Repositories = () => {
  const { showToast } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Connected Repositories</h2>
          <p className="text-xs text-[#94A3B8] mt-1">Git provider webhooks, branch protection rules, and pipeline builds</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => showToast('Connect Repository modal opened', 'info')}>
          Connect Repository
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle icon={GitBranch}>Repository Health & Webhooks</CardTitle>
          <Badge variant="success" dot font-semibold>19 Connected Repos</Badge>
        </CardHeader>

        <Table headers={['Repository Name', 'Default Branch', 'Latest Commit Hash', 'Pipeline Build', 'Sync Webhook']}>
          {mockRepositories.map(r => (
            <TableRow key={r.id}>
              <TableCell className="font-semibold text-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[#2563EB]" />
                  <span>{r.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-[#38BDF8] px-2 py-0.5 bg-[#111827] rounded border border-[#334155]">{r.branch}</span>
              </TableCell>
              <TableCell className="font-mono text-xs text-[#CBD5E1]">{r.lastCommit}</TableCell>
              <TableCell>
                <Badge variant={r.ciPipeline === 'Passed' ? 'success' : 'warning'} size="sm">{r.ciPipeline}</Badge>
              </TableCell>
              <TableCell>
                <span className="text-xs text-[#10B981] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                </span>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>
    </div>
  );
};
