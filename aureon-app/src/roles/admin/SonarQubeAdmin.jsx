import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { sonarQubePerProject, initialSonarQube } from '../../services/mockData';
import { Cpu, Bug, ShieldAlert, Code2, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SonarQubeAdmin = () => {
  const chartData = sonarQubePerProject.map(p => ({ name: p.projectKey, bugs: p.bugs, smells: parseInt(p.codeSmells)||p.codeSmells, coverage: parseFloat(p.coverage) }));

  const columns = [
    { key: 'projectName', label: 'Project', render: (val, row) => (<div><div className="font-bold text-gray-900 dark:text-gray-100">{val}</div><div className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{row.projectKey}</div></div>) },
    { key: 'qualityGate', label: 'Quality Gate', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'PASSED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>{val}</span> },
    { key: 'bugs', label: 'Bugs', render: (val) => <span className={`font-bold ${val > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{val}</span> },
    { key: 'codeSmells', label: 'Code Smells' },
    { key: 'coverage', label: 'Coverage', render: (val) => { const n = parseFloat(val); return <span className={`font-bold ${n >= 80 ? 'text-emerald-600' : n >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{val}</span>; }},
    { key: 'technicalDebt', label: 'Tech Debt' },
    { key: 'rating', label: 'Rating', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'A' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>{val}</span> },
    { key: 'lastScan', label: 'Last Scan' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="SonarQube Admin" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Cpu className="w-5 h-5 text-blue-500" />SonarQube Integration Administration</h1><p className="text-xs text-gray-500">Manage SonarQube webhooks, quality gate configurations, and per-project scan results.</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Overall Gate', value: initialSonarQube.overallQualityGate, icon: CheckCircle2, color: 'border-l-emerald-500' },
          { label: 'Total Bugs', value: initialSonarQube.bugs, icon: Bug, color: 'border-l-rose-500' },
          { label: 'Vulnerabilities', value: initialSonarQube.vulnerabilities, icon: ShieldAlert, color: 'border-l-amber-500' },
          { label: 'Code Smells', value: initialSonarQube.codeSmells, icon: Code2, color: 'border-l-purple-500' },
          { label: 'Avg Coverage', value: initialSonarQube.coverage, icon: Cpu, color: 'border-l-cyan-500' }
        ].map((w, i) => { const Icon = w.icon; return (
          <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="flex items-center justify-between text-gray-500"><span className="text-[11px] font-semibold">{w.label}</span><Icon className="w-4 h-4 text-gray-400" /></div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{w.value}</div>
          </div>
        ); })}
      </div>
      <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Bugs & Code Smells Per Project</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
              <Bar dataKey="bugs" fill="#ef4444" radius={[4, 4, 0, 0]} name="Bugs" />
              <Bar dataKey="smells" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Code Smells" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <DataTable columns={columns} data={sonarQubePerProject} searchPlaceholder="Search projects by key, name..." />
    </div>
  );
};
