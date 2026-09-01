import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { ClipboardList, Plus, UserCheck, CheckCircle2, Clock } from 'lucide-react';

export const LeadTaskAllocation = ({ onShowToast }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeadTasks = async () => {
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
    fetchLeadTasks();
  }, []);

  const handleUpdateStatus = async (taskId, newStatus) => {
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

    if (onShowToast) onShowToast({ type: 'success', title: 'Task Status Updated', message: `Task status updated to ${newStatus}.` });
  };

  const priorityColors = {
    CRITICAL: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold border border-rose-300',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-extrabold border border-orange-300',
    MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold border border-amber-300',
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-extrabold border border-blue-300'
  };

  const columns = [
    {
      key: 'id',
      label: 'Ticket ID',
      render: (val) => <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{val}</span>
    },
    {
      key: 'title',
      label: 'Work Ticket Title & Project',
      render: (val, row) => (
        <div>
          <span className="font-extrabold text-slate-900 dark:text-white block">{val}</span>
          <span className="text-[10px] text-slate-500 font-medium">📁 {row.project_name || 'General Project'}</span>
        </div>
      )
    },
    {
      key: 'assignee_name',
      label: 'Assignee Engineer',
      render: (val, row) => (
        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
          👤 {val || row.assignee || 'Unassigned'}
        </span>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] ${priorityColors[val] || 'bg-slate-100'}`}>{val}</span>
    },
    {
      key: 'status',
      label: 'Execution Status',
      render: (val, row) => (
        <select
          value={val}
          onChange={(e) => handleUpdateStatus(row.id, e.target.value)}
          className="p-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="REVIEW">Code Review</option>
          <option value="DONE">Done</option>
        </select>
      )
    },
    {
      key: 'due_date',
      label: 'Target Due Date',
      render: (val, row) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400 font-bold">{val || row.dueDate || '2026-09-15'}</span>
    }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Task Allocation" />

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Team Lead: Task Allocation & Developer Assignments
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review tasks assigned by PMs, monitor developer task execution, and update ticket statuses.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={tasks}
        searchPlaceholder="Search PM assigned tasks by title, engineer, priority, project..."
      />
    </div>
  );
};
