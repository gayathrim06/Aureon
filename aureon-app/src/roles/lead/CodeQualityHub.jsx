import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import { Code2, Bug, ShieldAlert, RefreshCw, Play, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const CodeQualityHub = () => {
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanTargetFile, setScanTargetFile] = useState('config.py');
  const [scanMessage, setScanMessage] = useState(null);

  const fetchQualityData = async () => {
    try {
      setLoading(true);
      const [qualRes, issueRes] = await Promise.all([
        fetch(`${API_BASE_URL}/analysis/quality-summary`, {
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
        }),
        fetch(`${API_BASE_URL}/analysis/results`, {
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

  const handleRunScan = async () => {
    try {
      setScanning(true);
      setScanMessage(null);
      const res = await fetch(`${API_BASE_URL}/analysis/scan-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ file_path: scanTargetFile })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setScanMessage({ type: 'success', text: `Scan completed on ${scanTargetFile}! Radon Complexity score: ${data.result.score}/10. Found ${data.result.issues_count} findings.` });
        fetchQualityData();
      } else {
        setScanMessage({ type: 'error', text: data.error || 'Scan failed.' });
      }
    } catch (err) {
      setScanMessage({ type: 'error', text: err.message || 'Execution error during static scan.' });
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, []);

  const smellsBySeverity = [
    { name: 'HIGH', value: issues.filter(s => s.severity === 'HIGH').length, color: '#ef4444' },
    { name: 'MEDIUM', value: issues.filter(s => s.severity === 'MEDIUM' || s.severity === 'MAJOR').length, color: '#f59e0b' },
    { name: 'LOW', value: issues.filter(s => s.severity === 'LOW' || s.severity === 'MINOR' || s.severity === 'INFO').length, color: '#10b981' }
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
        HIGH: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
        MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        MINOR: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        MAJOR: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        INFO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      };
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c[val] || c.INFO}`}>{val}</span>;
    }},
    { key: 'effort', label: 'Fix Effort', render: (val, row) => row.effort || (row.severity === 'CRITICAL' ? '1 hr' : row.severity === 'MAJOR' ? '30 min' : row.severity === 'MINOR' ? '15 min' : '5 min') }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Code Quality" />
        <button
          onClick={fetchQualityData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition cursor-pointer"
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

      {/* Honest Engine Status Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Static Analysis Engine: Radon & Pylint Active</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold">
              SonarQube Server: Offline / Unconfigured
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Static code analysis is executed via host Radon (Cyclomatic Complexity & Maintainability Index) and Pylint engines against actual repository source files. All findings, severity classifications, and debt metrics are stored directly in PostgreSQL.
        </p>

        {/* Live Scan Trigger */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <FileCode className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-300">Run Real Code Scan on Source File:</span>
          <select
            value={scanTargetFile}
            onChange={(e) => setScanTargetFile(e.target.value)}
            className="p-1 px-2 text-xs rounded bg-slate-800 border border-slate-700 text-white font-mono cursor-pointer"
          >
            <option value="config.py">config.py (Application Config)</option>
            <option value="app.py">app.py (Flask Entrypoint)</option>
            <option value="models.py">models.py (Database Models)</option>
            <option value="services/static_analysis_service.py">services/static_analysis_service.py</option>
            <option value="services/task_recommendation_service.py">services/task_recommendation_service.py</option>
            <option value="services/project_health_service.py">services/project_health_service.py</option>
            <option value="services/rbac_service.py">services/rbac_service.py</option>
            <option value="seed.py">seed.py (Database Seeder)</option>
          </select>
          <button
            type="button"
            onClick={handleRunScan}
            disabled={scanning}
            className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Play className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Analyzing Source...' : 'Execute Static Scan'}
          </button>
        </div>

        {scanMessage && (
          <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${scanMessage.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-rose-950/60 text-rose-300 border border-rose-800'}`}>
            {scanMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {scanMessage.text}
          </div>
        )}
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

