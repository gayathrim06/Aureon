import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { getAuthHeaders } from '../../services/apiClient';
import { Code2, Bug, ShieldAlert, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const CodeQualityHub = () => {
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQualityData = async () => {
    try {
      setLoading(true);
      const [qualRes, issueRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/analysis/quality-summary', {
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
        }),
        fetch('http://127.0.0.1:8000/api/v1/analysis/results', {
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
        })
      ]);

      if (qualRes.ok) {
        const qData = await qualRes.json();
        if (qData.success && qData.projects) {
          setProjects(qData.projects);
        }
      }
      if (issueRes.ok) {
        const iData = await issueRes.json();
        if (iData.success && iData.issues) {
          setIssues(iData.issues);
        }
      }
    } catch (err) {
      console.error('Failed to load code quality data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, []);

  const smellsBySeverity = [
    { name: 'MINOR', value: issues.filter(s => s.severity === 'MINOR').length, color: '#3b82f6' },
    { name: 'MAJOR', value: issues.filter(s => s.severity === 'MAJOR').length, color: '#f59e0b' },
    { name: 'INFO', value: issues.filter(s => s.severity === 'INFO' || s.severity === 'LOW').length, color: '#10b981' }
  ];

  const debtData = projects.slice(0, 10).map(p => ({
    name: p.projectKey || p.projectName?.substring(0, 10),
    debt: parseFloat(p.technicalDebt) || 0,
    smells: parseInt(p.codeSmells) || 0
  }));

  const smellColumns = [
    { key: 'file', label: 'File', render: (val) => <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{val}</span> },
    { key: 'line', label: 'Line', render: (val) => <span className="font-mono font-bold">{val}</span> },
    { key: 'category', label: 'Category', render: (val) => <span className="font-mono text-[10px] text-gray-500">{val || 'Convention'}</span> },
    { key: 'message', label: 'Issue', render: (val, row) => <span className="text-[11px] text-gray-700 dark:text-gray-300">{val || row.description}</span> },
    { key: 'severity', label: 'Severity', render: (val) => {
      const c = {
        MINOR: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        MAJOR: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        INFO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      };
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c[val] || c.INFO}`}>{val}</span>;
    }},
    { key: 'effort', label: 'Fix Effort', render: () => '15 min' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Code Quality" />
        <button
          onClick={fetchQualityData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-purple-500" />Code Quality & Technical Debt Hub
        </h1>
        <p className="text-xs text-gray-500">Live PostgreSQL quality gate analysis: code smells, technical debt, bugs, and scan status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Code Smell Distribution</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={smellsBySeverity} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {smellsBySeverity.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Technical Debt & Smells Per Project</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={debtData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Bar dataKey="smells" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Code Smells" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <DataTable columns={smellColumns} data={issues} searchPlaceholder="Search code smells by file, rule, message..." />
    </div>
  );
};

