import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { getAuthHeaders } from '../../services/apiClient';
import { Code2, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const DevCodeIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/analysis/results', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.issues) {
          const formatted = data.issues.map((s, idx) => ({
            id: s.id || `issue-${idx}`,
            file: s.file || 'src/index.js',
            line: s.line || 1,
            message: s.message || s.description || 'Static analysis notification',
            severity: (s.severity || 'MINOR').toUpperCase(),
            effort: s.effort || '15 min'
          }));
          setIssues(formatted);
        }
      }
    } catch (err) {
      console.error('Failed to load code issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const severityData = [
    { name: 'MINOR', value: issues.filter(s => s.severity === 'MINOR').length, color: '#3b82f6' },
    { name: 'MAJOR', value: issues.filter(s => s.severity === 'MAJOR').length, color: '#f59e0b' },
    { name: 'INFO', value: issues.filter(s => s.severity === 'INFO' || s.severity === 'LOW').length, color: '#10b981' }
  ];

  const smellColumns = [
    { key: 'file', label: 'File', render: (val) => <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{val}</span> },
    { key: 'line', label: 'Line', render: (val) => <span className="font-mono font-bold">{val}</span> },
    { key: 'message', label: 'Issue', render: (val) => <span className="text-[11px] text-gray-700 dark:text-gray-300">{val}</span> },
    { key: 'severity', label: 'Severity', render: (val) => {
      const c = {
        MINOR: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        MAJOR: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        INFO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      };
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c[val] || c.INFO}`}>{val}</span>;
    }},
    { key: 'effort', label: 'Fix Effort' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Code Issues" />
        <button
          onClick={fetchIssues}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Issues
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-amber-500" />My Code Issues & Smells
        </h1>
        <p className="text-xs text-gray-500">Live static analysis and code quality issues from PostgreSQL.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Severity Breakdown</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                  {severityData.map((e,i)=><Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
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
          <div className="mt-4 text-xs text-gray-500">
            Total issues: <span className="font-bold text-gray-900 dark:text-gray-100">{issues.length}</span> • Estimated fix time: <span className="font-bold text-amber-600">{issues.length * 15} min</span>
          </div>
        </div>
      </div>

      <DataTable columns={smellColumns} data={issues} searchPlaceholder="Search issues by file, rule, severity..." />
    </div>
  );
};

