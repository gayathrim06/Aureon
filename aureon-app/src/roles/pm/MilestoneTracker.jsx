import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { initialMilestones } from '../../services/mockData';
import { Award, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export const MilestoneTracker = () => {
  const statusIcons = { ON_TRACK: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, AT_RISK: <AlertTriangle className="w-4 h-4 text-amber-500" />, DELAYED: <Clock className="w-4 h-4 text-rose-500" /> };
  const statusColors = { ON_TRACK: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', AT_RISK: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', DELAYED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' };

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Milestone Tracker" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" />Milestone Delivery Tracker</h1><p className="text-xs text-gray-500">Track milestone progress, delivery dates, and risk indicators across all projects.</p></div>
      <div className="space-y-4">
        {initialMilestones.map(m => (
          <div key={m.id} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {statusIcons[m.status]}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{m.name}</h3>
                  <span className="text-[10px] text-gray-500">Due: {m.dueDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[m.status]}`}>{m.status.replace('_',' ')}</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{m.progress}%</span>
              </div>
            </div>
            <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${m.status === 'AT_RISK' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : m.status === 'DELAYED' ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`} style={{ width: `${m.progress}%` }} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
              <span>{m.completedTasks}/{m.tasks} tasks completed</span>
              <span>{m.tasks - m.completedTasks} remaining</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
