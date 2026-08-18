import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialTasks } from '../../services/mockData';
import { CheckSquare } from 'lucide-react';

export const TaskBreakdown = () => {
  const priorityColors = { CRITICAL: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300', MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' };
  const statusColors = { TODO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' };

  const columns = [
    { key: 'id', label: 'Task ID', render: (val) => <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">{val}</span> },
    { key: 'title', label: 'Title', render: (val) => <span className="font-semibold text-gray-900 dark:text-gray-100">{val}</span> },
    { key: 'assignee', label: 'Assignee' },
    { key: 'priority', label: 'Priority', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityColors[val]}`}>{val}</span> },
    { key: 'status', label: 'Status', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[val]}`}>{val.replace('_',' ')}</span> },
    { key: 'type', label: 'Type', render: (val) => <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-medium">{val}</span> },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'loggedHours', label: 'Hours', render: (val, row) => <span className="font-mono text-[11px]">{val}/{row.estimatedHours}h</span> }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Task Breakdown" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><CheckSquare className="w-5 h-5 text-indigo-500" />Task Breakdown & Tracking</h1><p className="text-xs text-gray-500">Full task list with status filters, assignee tracking, priority sorting, and time logging.</p></div>
      <div className="grid grid-cols-4 gap-4">
        {['TODO','IN_PROGRESS','REVIEW','DONE'].map(s => { const count = initialTasks.filter(t=>t.status===s).length; const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', REVIEW: 'In Review', DONE: 'Completed' }; const colors = { TODO: 'border-l-slate-500', IN_PROGRESS: 'border-l-blue-500', REVIEW: 'border-l-amber-500', DONE: 'border-l-emerald-500' }; return (
          <div key={s} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${colors[s]} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="text-[11px] font-semibold text-gray-500">{labels[s]}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{count}</div>
          </div>
        ); })}
      </div>
      <DataTable columns={columns} data={initialTasks} searchPlaceholder="Search tasks by ID, title, assignee, status..." />
    </div>
  );
};
