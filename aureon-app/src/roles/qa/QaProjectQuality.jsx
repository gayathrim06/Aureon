import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { initialBugs, initialTestCases, sonarQubePerProject } from '../../services/mockData';
import { Activity, Bug, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const QaProjectQuality = () => {
  const severityData = [
    { name: 'CRITICAL', value: initialBugs.filter(b=>b.severity==='CRITICAL').length, color: '#ef4444' },
    { name: 'HIGH', value: initialBugs.filter(b=>b.severity==='HIGH').length||0, color: '#f97316' },
    { name: 'MEDIUM', value: initialBugs.filter(b=>b.severity==='MEDIUM').length, color: '#f59e0b' },
    { name: 'LOW', value: initialBugs.filter(b=>b.severity==='LOW').length, color: '#3b82f6' }
  ];

  const testStatusData = [
    { name: 'Passed', value: initialTestCases.filter(t=>t.status==='PASSED').length, color: '#10b981' },
    { name: 'Failed', value: initialTestCases.filter(t=>t.status==='FAILED').length, color: '#ef4444' },
    { name: 'Pending', value: initialTestCases.filter(t=>t.status==='PENDING').length, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Quality Overview" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500" />Project Quality Overview</h1><p className="text-xs text-gray-500">Bug severity heatmap, test pass rate trends, and quality gate summaries.</p></div>
      <div className="grid grid-cols-4 gap-4">
        {[{ label: 'Open Bugs', value: initialBugs.filter(b=>b.status==='OPEN').length, color: 'border-l-rose-500' },
          { label: 'Tests Passed', value: initialTestCases.filter(t=>t.status==='PASSED').length, color: 'border-l-emerald-500' },
          { label: 'Tests Failed', value: initialTestCases.filter(t=>t.status==='FAILED').length, color: 'border-l-red-500' },
          { label: 'Coverage Avg', value: Math.round(sonarQubePerProject.reduce((a,p)=>a+parseFloat(p.coverage),0)/sonarQubePerProject.length) + '%', color: 'border-l-blue-500' }
        ].map((w,i) => (
          <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="text-[11px] font-semibold text-gray-500">{w.label}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{w.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Bug Severity Heatmap</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{severityData.map((e,i)=><Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Test Case Status Distribution</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={testStatusData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} /><XAxis dataKey="name" stroke="#9ca3af" fontSize={11} /><YAxis stroke="#9ca3af" fontSize={11} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} /><Bar dataKey="value" radius={[4, 4, 0, 0]} name="Count">{testStatusData.map((e,i)=><Cell key={i} fill={e.color} />)}</Bar></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
};
