import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../common/Card';
import { Table, TableRow, TableCell } from '../common/Table';
import { Badge } from '../common/Badge';
import { GitBranch, GitCommit, CheckCircle2, RefreshCw } from 'lucide-react';

export const RepositorySection = ({ repositories }) => {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle icon={GitBranch}>Connected Code Repositories</CardTitle>
          <CardDescription>Git branch synchronization & automated pipeline triggers</CardDescription>
        </div>
        <Badge variant="success" dot>Webhooks Active</Badge>
      </CardHeader>

      <Table headers={['Repository', 'Branch', 'Last Commit', 'Pipeline', 'Sync Connection']}>
        {repositories.map((repo) => (
          <TableRow key={repo.id}>
            <TableCell className="font-semibold text-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#2563EB]" />
                <span>{repo.name}</span>
              </div>
            </TableCell>

            <TableCell>
              <span className="px-2 py-0.5 bg-[#111827] border border-[#334155] rounded-md font-mono text-xs text-[#38BDF8]">
                {repo.branch}
              </span>
            </TableCell>

            <TableCell>
              <div className="flex items-center gap-1.5 text-xs text-[#CBD5E1]">
                <GitCommit className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span className="font-mono">{repo.lastCommit}</span>
              </div>
            </TableCell>

            <TableCell>
              <Badge variant={repo.ciPipeline === 'Passed' ? 'success' : repo.ciPipeline === 'Building' ? 'warning' : 'error'} size="sm">
                {repo.ciPipeline}
              </Badge>
            </TableCell>

            <TableCell>
              <span className="inline-flex items-center gap-1 text-xs text-[#10B981] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {repo.connection}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </Card>
  );
};
