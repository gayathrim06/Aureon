import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { developerMetrics } from '../../services/mockData';
import { Users, Activity, AlertTriangle, CheckCircle2, GitCommit } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const TeamWorkload = () => {
  const chartData = developerMetrics.map(d => ({ name: d.name.split(' ')[0], tasks: d.tasksCompleted + d.tasksActive, completed: d.tasksCompleted, commits: d.commits }));

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Team Workload" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" />Team Workload & Capacity Planning</h1><p className="text-xs text-gray-500">Monitor team member capacity, workload distribution, and identify overloaded resources.</p></div>
      <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Task Distribution by Team Member</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
              <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed Tasks" stackId="a" />
              <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {developerMetrics.map((d, i) => {
          const utilization = Math.round((d.tasksActive / (d.tasksActive + 2)) * 100);
          return (
            <div key={i} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <img src={d.avatar} alt={d.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                <div><h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{d.name}</h4><p className="text-[10px] text-gray-500">{d.role}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/60"><span className="text-gray-400 block">Active Tasks</span><span className="font-bold text-blue-600 text-sm">{d.tasksActive}</span></div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/60"><span className="text-gray-400 block">Completed</span><span className="font-bold text-emerald-600 text-sm">{d.tasksCompleted}</span></div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/60"><span className="text-gray-400 block">Commits</span><span className="font-bold text-indigo-600 text-sm">{d.commits}</span></div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/60"><span className="text-gray-400 block">Velocity</span><span className="font-bold text-purple-600 text-sm">{d.velocity}%</span></div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] mb-1"><span className="text-gray-500">Workload</span><span className={`font-bold ${utilization >= 80 ? 'text-rose-600' : 'text-emerald-600'}`}>{utilization}%</span></div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${utilization >= 80 ? 'bg-rose-500' : utilization >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${utilization}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
