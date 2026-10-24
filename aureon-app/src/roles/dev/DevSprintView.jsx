import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import { Layers, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const DevSprintView = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/developer/my-tasks`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.tasks) {
          setTasks(data.tasks);
        }
      }
    } catch (err) {
      console.error('Failed to load developer sprint tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];
  const statusLabels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', COMPLETED: 'Done' };
  const statusColors = { TODO: 'border-l-slate-500', IN_PROGRESS: 'border-l-blue-500', IN_REVIEW: 'border-l-amber-500', COMPLETED: 'border-l-emerald-500' };

  const remaining = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'DONE').length;
  const completed = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'DONE').length;

  const taskStatusDistribution = [
    { status: 'To Do', count: tasks.filter(t => t.status === 'TODO').length },
    { status: 'In Progress', count: tasks.filter(t => t.status === 'IN_PROGRESS').length },
    { status: 'In Review', count: tasks.filter(t => t.status === 'IN_REVIEW' || t.status === 'REVIEW').length },
    { status: 'Completed', count: completed }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="My Sprint" />
        <button
          onClick={fetchMyTasks}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Sprint
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />My Sprint Overview
        </h1>
        <p className="text-xs text-gray-500">Your personal sprint progress, assigned tasks, and workload status from PostgreSQL.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statuses.map(s => {
          const count = tasks.filter(t => t.status === s || (s === 'COMPLETED' && t.status === 'DONE') || (s === 'IN_REVIEW' && t.status === 'REVIEW')).length;
          const isActive = statusFilter === s;
          return (
            <button
              key={s} 
              type="button"
              onClick={() => setStatusFilter(prev => prev === s ? 'ALL' : s)}
              className={`p-4 rounded-xl border-l-4 ${statusColors[s]} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 text-left cursor-pointer group flex flex-col justify-between ${
                isActive ? 'ring-2 ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20' : 'bg-white dark:bg-gray-800'
              }`}
            >
              <div>
                <div className="text-[11px] font-semibold text-gray-500 uppercase">{statusLabels[s]}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{count}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {isActive ? 'Showing filtered (click to reset)' : `Filter ${statusLabels[s]} →`}
              </div>
            </button>
          );
        })}
      </div>

      {tasks.length > 0 && (
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Assigned Tasks by Status</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStatusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="status" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Task Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {loading && tasks.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">Loading your sprint tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          No sprint tasks currently assigned to you in the database.
        </div>
      ) : (
        <div className="space-y-3">
          {(statusFilter === 'ALL' ? tasks : tasks.filter(t => t.status === statusFilter || (statusFilter === 'COMPLETED' && t.status === 'DONE') || (statusFilter === 'IN_REVIEW' && t.status === 'REVIEW'))).map(t => (
            <div key={t.id} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  {t.ticket_code || t.id.substring(0, 8)}
                </span>
                <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">{t.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                  t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {t.priority}
                </span>
                <span className="text-[10px] text-gray-500">{t.due_date || 'No due date'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

