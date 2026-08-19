import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { sonarQubePerProject, initialProjects } from '../../services/mockData';
import { Activity, Shield, Cpu, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const LeadProjectHealth = () => {
  const coverageTrend = [
    { sprint: 'S20', coverage: 85 },
    { sprint: 'S21', coverage: 87 },
    { sprint: 'S22', coverage: 89 },
    { sprint: 'S23', coverage: 91 },
    { sprint: 'S24', coverage: 92 }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Project Health" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500" />Technical Health Analytics</h1><p className="text-xs text-gray-500">Code coverage trends, quality gate history, and technical debt ratio analysis.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Array.isArray(sonarQubePerProject) ? sonarQubePerProject : []).map(p => (
          <div key={p.projectKey} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2"><span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">{p.projectKey}</span><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.qualityGate === 'PASSED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700'}`}>{p.qualityGate}</span></div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-3">{p.projectName}</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded bg-gray-50 dark:bg-gray-900/60"><span className="text-gray-400 block">Coverage</span><span className="font-bold text-emerald-600">{p.coverage}</span></div>
              <div className="p-2 rounded bg-gray-50 dark:bg-gray-900/60"><span className="text-gray-400 block">Tech Debt</span><span className="font-bold text-amber-600">{p.technicalDebt}</span></div>
              <div className="p-2 rounded bg-gray-50 dark:bg-gray-900/60"><span className="text-gray-400 block">Bugs</span><span className="font-bold text-rose-600">{p.bugs}</span></div>
              <div className="p-2 rounded bg-gray-50 dark:bg-gray-900/60"><span className="text-gray-400 block">Rating</span><span className={`font-bold ${p.rating === 'A' ? 'text-emerald-600' : 'text-amber-600'}`}>{p.rating}</span></div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Code Coverage Trend Over Sprints</h3>
        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={coverageTrend}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} /><XAxis dataKey="sprint" stroke="#9ca3af" fontSize={11} /><YAxis domain={[70, 100]} stroke="#9ca3af" fontSize={11} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} /><Line type="monotone" dataKey="coverage" stroke="#10b981" strokeWidth={3} name="Coverage %" dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>
      </div>
    </div>
  );
};
