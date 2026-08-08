import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Table, TableRow, TableCell } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ProgressBar } from '../components/common/ProgressBar';
import { mockProjects } from '../mock/mockData';
import { FolderKanban, Plus, Search, Filter, Layers, GitBranch } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Projects = () => {
  const { showToast } = useAuth();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const filtered = mockProjects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === 'All' || p.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Project Management Hub</h2>
          <p className="text-xs text-[#94A3B8] mt-1">Manage roadmap deliverables, repos, and health metrics</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => showToast('Create Project wizard opened', 'info')}>
          Initialize New Project
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2563EB]/15 text-[#2563EB] rounded-[12px] border border-[#2563EB]/30">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Enterprise Project Portfolio</CardTitle>
              <CardDescription>Active sprint containers and compliance health scores</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#111827] text-xs text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-[12px] focus:outline-none"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#111827] text-xs text-[#CBD5E1] border border-[#334155] rounded-[12px] focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </CardHeader>

        <Table headers={['Project', 'Manager', 'Status', 'Priority', 'Sprint Progress', 'Health', 'Deadline']}>
          {filtered.map((proj) => (
            <TableRow key={proj.id} onClick={() => showToast(`Project ${proj.id} selected`, 'info')}>
              <TableCell>
                <div>
                  <span className="text-xs font-mono text-[#38BDF8] font-bold mr-2">{proj.id}</span>
                  <span className="font-semibold text-[#F8FAFC]">{proj.name}</span>
                </div>
              </TableCell>
              <TableCell>{proj.manager}</TableCell>
              <TableCell>
                <Badge variant={proj.status === 'Completed' ? 'success' : 'brand'} size="sm" dot>
                  {proj.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={proj.priority === 'Urgent' ? 'error' : 'warning'} size="sm">
                  {proj.priority}
                </Badge>
              </TableCell>
              <TableCell className="w-36">
                <ProgressBar progress={proj.progress} showPercentage={true} height="h-1.5" />
              </TableCell>
              <TableCell>
                <span className="text-xs font-bold text-[#10B981]">{proj.health}%</span>
              </TableCell>
              <TableCell className="text-xs text-[#94A3B8]">{proj.deadline}</TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>
    </div>
  );
};
