import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { getAuthHeaders } from '../../services/apiClient';
import { Cpu, Bug, ShieldAlert, Code2, CheckCircle2, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SonarQubeAdmin = () => {
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({
    overallQualityGate: 'PASSED',
    bugs: 0,
    vulnerabilities: 0,
    codeSmells: 0,
    coverage: '0%'
  });
  const [loading, setLoading] = useState(true);

  const fetchQualityData = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/analysis/quality-summary', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProjects(data.projects || []);
          if (data.summary) setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load quality summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, []);

  const safeProjects = Array.isArray(projects) ? projects : [];
  const chartData = safeProjects.slice(0, 10).map(p => ({
    name: p.projectKey || p.projectName?.substring(0, 10),
    bugs: p.bugs || 0,
    smells: parseInt(p.codeSmells) || 0,
    coverage: parseFloat(p.coverage) || 0
  }));

  const columns = [
    { key: 'projectName', label: 'Project', render: (val, row) => (<div><div className="font-bold text-gray-900 dark:text-gray-100">{val}</div><div className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{row.projectKey}</div></div>) },
    { key: 'qualityGate', label: 'Quality Gate', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'PASSED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>{val || 'PASSED'}</span> },
    { key: 'bugs', label: 'Bugs', render: (val) => <span className={`font-bold ${val > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{val || 0}</span> },
    { key: 'codeSmells', label: 'Code Smells' },
    { key: 'coverage', label: 'Coverage', render: (val) => { const n = parseFloat(val); return <span className={`font-bold ${n >= 80 ? 'text-emerald-600' : n >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{val || '0%'}</span>; }},
    { key: 'technicalDebt', label: 'Tech Debt' },
    { key: 'rating', label: 'Rating', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'A' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>{val || 'A'}</span> },
    { key: 'lastScan', label: 'Last Scan' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="SonarQube Admin" />
        <button
          onClick={fetchQualityData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-500" />SonarQube Integration Administration
        </h1>
        <p className="text-xs text-gray-500">Manage SonarQube webhooks, quality gate configurations, and per-project scan results directly from the live database.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Overall Gate', value: summary.overallQualityGate, icon: CheckCircle2, color: 'border-l-emerald-500' },
          { label: 'Total Bugs', value: summary.bugs, icon: Bug, color: 'border-l-rose-500' },
          { label: 'Vulnerabilities', value: summary.vulnerabilities, icon: ShieldAlert, color: 'border-l-amber-500' },
          { label: 'Code Smells', value: summary.codeSmells, icon: Code2, color: 'border-l-purple-500' },
          { label: 'Avg Coverage', value: summary.coverage, icon: Cpu, color: 'border-l-cyan-500' }
        ].map((w, i) => { const Icon = w.icon; return (
          <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="flex items-center justify-between text-gray-500"><span className="text-[11px] font-semibold">{w.label}</span><Icon className="w-4 h-4 text-gray-400" /></div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{w.value}</div>
          </div>
        ); })}
      </div>

      {safeProjects.length > 0 && (
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
      )}

      <DataTable columns={columns} data={safeProjects} searchPlaceholder="Search projects by key, name..." />
    </div>
  );
};

