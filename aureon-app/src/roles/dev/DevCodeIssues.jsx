import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialCodeSmells } from '../../services/mockData';
import { Code2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const DevCodeIssues = () => {
  const severityData = [
    { name: 'MINOR', value: initialCodeSmells.filter(s=>s.severity==='MINOR').length, color: '#3b82f6' },
    { name: 'MAJOR', value: initialCodeSmells.filter(s=>s.severity==='MAJOR').length, color: '#f59e0b' },
    { name: 'INFO', value: initialCodeSmells.filter(s=>s.severity==='INFO').length, color: '#10b981' }
  ];

  const smellColumns = [
    { key: 'file', label: 'File', render: (val) => <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{val}</span> },
    { key: 'line', label: 'Line', render: (val) => <span className="font-mono font-bold">{val}</span> },
    { key: 'message', label: 'Issue', render: (val) => <span className="text-[11px] text-gray-700 dark:text-gray-300">{val}</span> },
    { key: 'severity', label: 'Severity', render: (val) => { const c = { MINOR: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', MAJOR: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', INFO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' }; return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c[val]}`}>{val}</span>; }},
    { key: 'effort', label: 'Fix Effort' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Code Issues" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Code2 className="w-5 h-5 text-amber-500" />My Code Issues & Smells</h1><p className="text-xs text-gray-500">SonarQube-flagged code issues in your committed files with fix effort estimates.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Severity Breakdown</h3>
          <div className="h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={severityData} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{severityData.map((e,i)=><Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="grid grid-cols-3 gap-3">
            {severityData.map(s => (
              <div key={s.name} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 text-center">
                <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-gray-500 font-semibold">{s.name}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-500">Total issues: <span className="font-bold text-gray-900 dark:text-gray-100">{initialCodeSmells.length}</span> • Estimated fix time: <span className="font-bold text-amber-600">60 min</span></div>
        </div>
      </div>
      <DataTable columns={smellColumns} data={initialCodeSmells} searchPlaceholder="Search issues by file, rule, severity..." />
    </div>
  );
};
