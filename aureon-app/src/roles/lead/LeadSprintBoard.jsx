import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { Layers, CheckCircle2, ArrowRight, GitBranch } from 'lucide-react';

export const LeadSprintBoard = ({ onShowToast }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSprintTasks = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/tasks/', { headers });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprintTasks();
  }, []);

  const columns = [
    { key: 'TODO', label: '📋 Backlog / To Do', color: 'border-t-slate-500 bg-slate-500/5' },
    { key: 'IN_PROGRESS', label: '🚀 Active Execution', color: 'border-t-blue-500 bg-blue-500/5' },
    { key: 'REVIEW', label: '🔍 Code Review', color: 'border-t-amber-500 bg-amber-500/5' },
    { key: 'DONE', label: '✅ Approved / Done', color: 'border-t-emerald-500 bg-emerald-500/5' }
  ];

  const moveTask = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      await fetch(`http://127.0.0.1:8000/api/v1/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {}

    logAuditEvent({ user, role: user?.role, action: 'LEAD_TASK_APPROVE', resource: `Task ${taskId} → ${newStatus}`, status: 'SUCCESS' });
    if (onShowToast) onShowToast({ type: 'info', title: 'Sprint Board Updated', message: `Ticket ${taskId} moved to ${newStatus}` });
  };

  const approveTask = (taskId) => {
    moveTask(taskId, 'DONE');
    if (onShowToast) onShowToast({ type: 'success', title: 'Code Review Approved', message: `Ticket ${taskId} approved and moved to Done.` });
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Sprint Board" />

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Team Lead: Sprint Kanban & Task Approvals
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review work tickets assigned by PMs, approve pull requests, and manage active sprint deliverables.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className={`p-4 rounded-3xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm border-t-4 ${col.color} flex flex-col min-h-[450px] space-y-3`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">{col.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs italic">
                    No tickets in this stage
                  </div>
                ) : (
                  colTasks.map(t => (
                    <div key={t.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{t.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {t.priority || 'MEDIUM'}
                        </span>
                      </div>

                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">{t.title}</h4>

                      <div className="text-[10px] text-slate-500 font-medium">
                        📁 {t.project_name || 'Verona Organic'}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          👤 {t.assignee_name || t.assignee || 'Unassigned'}
                        </span>
                        <div className="flex gap-1">
                          {col.key === 'REVIEW' && (
                            <button
                              onClick={() => approveTask(t.id)}
                              className="px-2 py-1 rounded-lg text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs"
                            >
                              ✓ Approve
                            </button>
                          )}
                          {col.key !== 'DONE' && (
                            <button
                              onClick={() => moveTask(t.id, col.key === 'TODO' ? 'IN_PROGRESS' : col.key === 'IN_PROGRESS' ? 'REVIEW' : 'DONE')}
                              className="px-2 py-1 rounded-lg text-[9px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xs"
                            >
                              → Next
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
