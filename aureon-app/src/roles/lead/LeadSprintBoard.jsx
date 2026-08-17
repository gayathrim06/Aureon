import React, { useState } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { initialTasks } from '../../services/mockData';
import { logAuditEvent } from '../../services/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { Layers, CheckCircle2, ArrowRight } from 'lucide-react';

export const LeadSprintBoard = ({ onShowToast }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(initialTasks);
  const columns = [
    { key: 'TODO', label: 'Backlog', color: 'border-t-slate-500 bg-slate-500/5' },
    { key: 'IN_PROGRESS', label: 'Active', color: 'border-t-blue-500 bg-blue-500/5' },
    { key: 'REVIEW', label: 'Review / Approve', color: 'border-t-amber-500 bg-amber-500/5' },
    { key: 'DONE', label: 'Completed', color: 'border-t-emerald-500 bg-emerald-500/5' }
  ];

  const moveTask = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    logAuditEvent({ user, role: user?.role, action: 'LEAD_TASK_APPROVE', resource: `Task ${taskId} → ${newStatus}`, status: 'SUCCESS' });
    onShowToast && onShowToast({ type: 'info', title: 'Board Updated', message: `${taskId} moved to ${newStatus}` });
  };

  const approveTask = (taskId) => {
    moveTask(taskId, 'DONE');
    onShowToast && onShowToast({ type: 'success', title: 'Task Approved', message: `${taskId} approved and moved to Done.` });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Sprint Board" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-500" />Lead Sprint Board & Task Approvals</h1><p className="text-xs text-gray-500">Review, approve, or reassign tasks across sprint phases.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className={`p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm border-t-4 ${col.color} flex flex-col min-h-[400px]`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700"><span className="text-xs font-bold text-gray-800 dark:text-gray-200">{col.label}</span><span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 font-mono text-[10px] font-bold">{colTasks.length}</span></div>
              <div className="mt-3 space-y-3 flex-1">
                {colTasks.map(t => (
                  <div key={t.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="flex items-center justify-between"><span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">{t.id}</span><span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{t.priority}</span></div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{t.title}</h4>
                    <span className="text-[10px] text-gray-400">{t.assignee}</span>
                    <div className="flex gap-1">
                      {col.key === 'REVIEW' && <button onClick={() => approveTask(t.id)} className="px-2 py-0.5 rounded text-[9px] bg-emerald-600 text-white font-bold hover:bg-emerald-500">✓ Approve</button>}
                      {col.key !== 'DONE' && <button onClick={() => moveTask(t.id, col.key === 'TODO' ? 'IN_PROGRESS' : col.key === 'IN_PROGRESS' ? 'REVIEW' : 'DONE')} className="px-2 py-0.5 rounded text-[9px] bg-blue-600 text-white font-medium hover:bg-blue-500">→ Next</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
