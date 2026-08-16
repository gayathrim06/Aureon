import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { 
  Bug, CheckSquare, ShieldCheck, AlertOctagon, CheckCircle2, 
  RotateCcw, Activity, Plus, FileText, Upload
} from 'lucide-react';

export const QaDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'QA Engineer';

  const widgets = [
    { label: 'QA Engineer', value: userName, sub: user?.email || 'Active Session', icon: ShieldCheck, color: 'border-l-indigo-500' },
    { label: 'Pending Test Cases', value: '0 Pending', sub: 'Test queue clear', icon: CheckSquare, color: 'border-l-amber-500' },
    { label: 'Test Suite Status', value: 'Ready', sub: 'Automation framework online', icon: CheckCircle2, color: 'border-l-emerald-500' },
    { label: 'Open Bugs', value: '0 Open', icon: Bug, sub: 'Zero defects logged', color: 'border-l-rose-500' },
    { label: 'System Quality', value: 'Optimal', sub: '100% Passed', icon: Activity, color: 'border-l-purple-500' },
  ];

  return (
    <div className="space-y-6 font-sans">
      <Breadcrumb activeTab="Dashboard" title="QA Engineering Workspace" />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950 via-pink-950 to-purple-950 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] uppercase font-bold border border-rose-500/30">
              QA Engineer: {userName}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">{userName}'s Quality Assurance Workspace</h1>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Execute automated test suites, log bugs with screenshot/log evidence, verify developer hotfixes, and generate quality reports.
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

      {/* Real Summary Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span className="text-[11px] font-semibold">{w.label}</span>
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-2 truncate">{w.value}</div>
              <div className="text-[10px] text-gray-400 mt-1">{w.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

