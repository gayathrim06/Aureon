import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { FileText, TrendingUp, CheckSquare, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

export const DeliveryReports = () => {
  const velocityData = [
    { sprint: 'S20', velocity: 18, planned: 20 },
    { sprint: 'S21', velocity: 22, planned: 22 },
    { sprint: 'S22', velocity: 19, planned: 24 },
    { sprint: 'S23', velocity: 20, planned: 20 },
    { sprint: 'S24', velocity: 14, planned: 18 }
  ];

  const throughputData = [
    { week: 'W1', created: 15, completed: 12 },
    { week: 'W2', created: 10, completed: 14 },
    { week: 'W3', created: 8, completed: 11 },
    { week: 'W4', created: 12, completed: 9 }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Delivery Reports" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Delivery Reports & Velocity Analytics</h1><p className="text-xs text-gray-500">Sprint velocity trends, task throughput rates, and completion analytics.</p></div>
      <div className="grid grid-cols-4 gap-4">
        {[{ label: 'Avg Velocity', value: '18.6', icon: TrendingUp, color: 'border-l-blue-500' },
          { label: 'Total Completed', value: '94 Tasks', icon: CheckSquare, color: 'border-l-emerald-500' },
          { label: 'Completion Rate', value: '87%', icon: Activity, color: 'border-l-indigo-500' },
          { label: 'On-Time Delivery', value: '92%', icon: FileText, color: 'border-l-purple-500' }
        ].map((w, i) => { const Icon = w.icon; return (
          <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="flex items-center justify-between text-gray-500"><span className="text-[11px] font-semibold">{w.label}</span><Icon className="w-4 h-4 text-gray-400" /></div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{w.value}</div>
          </div>
        ); })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Sprint Velocity Trend</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={velocityData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} /><XAxis dataKey="sprint" stroke="#9ca3af" fontSize={11} /><YAxis stroke="#9ca3af" fontSize={11} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} /><Area type="monotone" dataKey="velocity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} name="Actual Velocity" /><Area type="monotone" dataKey="planned" stroke="#9ca3af" fill="none" strokeDasharray="5 5" strokeWidth={1.5} name="Planned" /></AreaChart></ResponsiveContainer></div>
        </div>
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Weekly Task Throughput</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={throughputData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} /><XAxis dataKey="week" stroke="#9ca3af" fontSize={11} /><YAxis stroke="#9ca3af" fontSize={11} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} /><Bar dataKey="created" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Created" /><Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" /></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
};
