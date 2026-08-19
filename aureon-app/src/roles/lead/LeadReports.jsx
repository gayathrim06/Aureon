import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { developerMetrics } from '../../services/mockData';
import { FileText, TrendingUp, CheckSquare, GitCommit, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const LeadReports = () => {
  const safeDevs = Array.isArray(developerMetrics) ? developerMetrics : [];
  const chartData = safeDevs.map(d => ({ name: (d.name||'Dev').split(' ')[0], velocity: d.velocity||0, completed: d.tasksCompleted||0, commits: d.commits||0 }));

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Team Reports" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Team Performance Reports</h1><p className="text-xs text-gray-500">Team productivity scores, task completion rates, and developer velocity analytics.</p></div>
      <div className="grid grid-cols-4 gap-4">
        {[{ label: 'Team Avg Velocity', value: (safeDevs.length > 0 ? Math.round(safeDevs.reduce((a,d)=>a+(d.velocity||0),0)/safeDevs.length) : 100) + '%', icon: TrendingUp, color: 'border-l-blue-500' },
          { label: 'Total Tasks Done', value: safeDevs.reduce((a,d)=>a+(d.tasksCompleted||0),0), icon: CheckSquare, color: 'border-l-emerald-500' },
          { label: 'Total Commits', value: safeDevs.reduce((a,d)=>a+(d.commits||0),0), icon: GitCommit, color: 'border-l-purple-500' },
          { label: 'Team Members', value: safeDevs.length, icon: Users, color: 'border-l-indigo-500' }
        ].map((w, i) => { const Icon = w.icon; return (
          <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="flex items-center justify-between text-gray-500"><span className="text-[11px] font-semibold">{w.label}</span><Icon className="w-4 h-4 text-gray-400" /></div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{w.value}</div>
          </div>
        ); })}
      </div>
      <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Developer Velocity Comparison</h3>
        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} /><XAxis dataKey="name" stroke="#9ca3af" fontSize={11} /><YAxis stroke="#9ca3af" fontSize={11} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} /><Bar dataKey="velocity" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Velocity %" /><Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Tasks Completed" /></BarChart></ResponsiveContainer></div>
      </div>
    </div>
  );
};
