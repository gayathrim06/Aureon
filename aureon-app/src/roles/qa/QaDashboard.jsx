import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { 
  Bug, CheckSquare, ShieldCheck, AlertOctagon, CheckCircle2, 
  RotateCcw, Activity, Plus, FileText, Upload
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { initialBugs, initialTestCases } from '../../services/mockData';

export const QaDashboard = ({ onNavigate }) => {
  const bugSeverityPie = [
    { name: 'Critical', value: 1, color: '#ef4444' },
    { name: 'High', value: 3, color: '#f97316' },
    { name: 'Medium', value: 8, color: '#eab308' },
    { name: 'Low', value: 12, color: '#3b82f6' }
  ];

  const testingProgressData = [
    { day: 'Mon', passed: 12, failed: 1, pending: 4 },
    { day: 'Tue', passed: 18, failed: 2, pending: 2 },
    { day: 'Wed', passed: 25, failed: 0, pending: 1 },
    { day: 'Thu', passed: 32, failed: 3, pending: 5 },
    { day: 'Fri', passed: 40, failed: 1, pending: 0 },
  ];

  const widgets = [
    { label: 'Pending Test Cases', value: '3 Pending', sub: 'Sprint 24 test queue', icon: CheckSquare, color: 'border-l-amber-500' },
    { label: 'Completed Test Cases', value: '40 Passed', sub: '97.5% pass rate', icon: CheckCircle2, color: 'border-l-emerald-500' },
    { label: 'Open Bugs', value: '2 Open', sub: 'BUG-401 & BUG-402', icon: Bug, color: 'border-l-rose-500' },
    { label: 'Critical Bugs', value: '1 Critical', sub: 'JWT Concurrency flaw', icon: AlertOctagon, color: 'border-l-rose-600' },
    { label: 'Resolved Bugs', value: '14 Resolved', sub: 'Verified & closed', icon: ShieldCheck, color: 'border-l-indigo-500' },
    { label: 'Regression Tests', value: '100% Run', sub: 'Automated suite', icon: RotateCcw, color: 'border-l-purple-500' },
    { label: 'Bug Severity Index', value: 'High Priority', sub: 'Requires Dev hotfix', icon: Activity, color: 'border-l-cyan-500' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Dashboard" title="QA Engineering Command Center" />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950 via-pink-950 to-purple-950 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] uppercase font-bold border border-rose-500/30">
              Quality Assurance & Defect Tracking
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">QA & Defect Prevention Workspace</h1>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Execute automated test suites, log bugs with screenshot/log evidence, verify developer hotfixes, and generate regression reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('BugTracker')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Log Bug Defect
          </button>
          <button
            onClick={() => onNavigate('TestCases')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Test Suite
          </button>
        </div>
      </div>

      {/* 7 KPI Widgets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span className="text-[11px] font-semibold">{w.label}</span>
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{w.value}</div>
              <div className="text-[10px] text-gray-400 mt-1">{w.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Pie Chart */}
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Bug Severity Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bugSeverityPie} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                  {bugSeverityPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {bugSeverityPie.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testing Execution Trend Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Sprint 24 Test Suite Pass / Fail Rate</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={testingProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Line type="monotone" dataKey="passed" stroke="#10b981" strokeWidth={3} name="Test Cases Passed" />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Test Failures" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
