import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { sonarQubePerProject, initialCodeSmells } from '../../services/mockData';
import { Code2, Bug, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const CodeQualityHub = () => {
  const smellsBySeverity = [ { name: 'MINOR', value: initialCodeSmells.filter(s=>s.severity==='MINOR').length, color: '#3b82f6' }, { name: 'MAJOR', value: initialCodeSmells.filter(s=>s.severity==='MAJOR').length, color: '#f59e0b' }, { name: 'INFO', value: initialCodeSmells.filter(s=>s.severity==='INFO').length, color: '#10b981' } ];
  const debtData = sonarQubePerProject.map(p => ({ name: p.projectKey, debt: parseFloat(p.technicalDebt) || 0, smells: parseInt(p.codeSmells) || 0 }));

  const smellColumns = [
    { key: 'file', label: 'File', render: (val) => <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{val}</span> },
    { key: 'line', label: 'Line', render: (val) => <span className="font-mono font-bold">{val}</span> },
    { key: 'rule', label: 'Rule', render: (val) => <span className="font-mono text-[10px] text-gray-500">{val}</span> },
    { key: 'message', label: 'Issue', render: (val) => <span className="text-[11px] text-gray-700 dark:text-gray-300">{val}</span> },
    { key: 'severity', label: 'Severity', render: (val) => { const c = { MINOR: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', MAJOR: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', INFO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' }; return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c[val]}`}>{val}</span>; }},
    { key: 'effort', label: 'Fix Effort' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Code Quality" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Code2 className="w-5 h-5 text-purple-500" />Code Quality & Technical Debt Hub</h1><p className="text-xs text-gray-500">SonarQube analysis: code smells, technical debt, bugs, and quality gate status.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Code Smell Distribution</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={smellsBySeverity} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{smellsBySeverity.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Technical Debt Per Project</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={debtData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} /><XAxis dataKey="name" stroke="#9ca3af" fontSize={11} /><YAxis stroke="#9ca3af" fontSize={11} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} /><Bar dataKey="smells" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Code Smells" /></BarChart></ResponsiveContainer></div>
        </div>
      </div>
      <DataTable columns={smellColumns} data={initialCodeSmells} searchPlaceholder="Search code smells by file, rule, message..." />
    </div>
  );
};
