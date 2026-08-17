import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialTasks } from '../../services/mockData';
import { ClipboardList } from 'lucide-react';

export const LeadTaskAllocation = () => {
  const priorityColors = { CRITICAL: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300', MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' };
  const statusColors = { TODO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' };

  const columns = [
    { key: 'id', label: 'ID', render: (val) => <span className="font-mono text-[10px] font-bold text-blue-600">{val}</span> },
    { key: 'title', label: 'Task Title', render: (val) => <span className="font-semibold text-gray-900 dark:text-gray-100">{val}</span> },
    { key: 'projectKey', label: 'Project' },
    { key: 'assignee', label: 'Assignee', render: (val) => <span className="text-blue-600 dark:text-blue-400 font-semibold">{val}</span> },
    { key: 'priority', label: 'Priority', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityColors[val]}`}>{val}</span> },
    { key: 'status', label: 'Status', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[val]}`}>{val.replace('_',' ')}</span> },
    { key: 'loggedHours', label: 'Effort', render: (val, row) => <span className="font-mono text-[11px]">{val}/{row.estimatedHours}h</span> }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Task Allocation" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-indigo-500" />Task Allocation & Assignment Management</h1><p className="text-xs text-gray-500">Reassign tasks, review workload, and manage developer allocations.</p></div>
      <DataTable columns={columns} data={initialTasks} searchPlaceholder="Search tasks by assignee, priority, project..." />
    </div>
  );
};
