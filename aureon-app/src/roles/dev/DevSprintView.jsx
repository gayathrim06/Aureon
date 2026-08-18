import React, { useState } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { initialTasks } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { Layers, CheckCircle2, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const DevSprintView = () => {
  const { user } = useAuth();
  const myTasks = initialTasks.filter(t => t.assignee === (user?.name || 'Marcus Brody'));
  const burnData = [{ day: 'Mon', tasks: myTasks.length }, { day: 'Tue', tasks: Math.max(myTasks.length - 1, 0) }, { day: 'Wed', tasks: Math.max(myTasks.length - 2, 0) }, { day: 'Thu', tasks: Math.max(myTasks.length - 3, 0) }];

  const statuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  const statusLabels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', REVIEW: 'In Review', DONE: 'Done' };
  const statusColors = { TODO: 'border-l-slate-500', IN_PROGRESS: 'border-l-blue-500', REVIEW: 'border-l-amber-500', DONE: 'border-l-emerald-500' };

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="My Sprint" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-500" />My Sprint Overview</h1><p className="text-xs text-gray-500">Your personal sprint progress, assigned tasks, and workload status.</p></div>
      <div className="grid grid-cols-4 gap-4">
        {statuses.map(s => (
          <div key={s} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${statusColors[s]} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="text-[11px] font-semibold text-gray-500">{statusLabels[s]}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{myTasks.filter(t=>t.status===s).length}</div>
          </div>
        ))}
      </div>
      <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Personal Burndown</h3>
        <div className="h-48"><ResponsiveContainer width="100%" height="100%"><LineChart data={burnData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} /><XAxis dataKey="day" stroke="#9ca3af" fontSize={11} /><YAxis stroke="#9ca3af" fontSize={11} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} /><Line type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={3} name="Tasks Remaining" /></LineChart></ResponsiveContainer></div>
      </div>
      <div className="space-y-3">
        {myTasks.map(t => (
          <div key={t.id} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">{t.id}</span>
              <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">{t.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{t.priority}</span>
              <span className="text-[10px] text-gray-500">{t.dueDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
