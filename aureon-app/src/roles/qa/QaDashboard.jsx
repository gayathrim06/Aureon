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
    { label: 'Pending Test Cases', value: '3 Cases', sub: 'Test queue active', icon: CheckSquare, color: 'border-l-amber-500' },
    { label: 'Test Suite Status', value: 'Ready', sub: 'Automation framework online', icon: CheckCircle2, color: 'border-l-emerald-500' },
    { label: 'Open Bugs', value: '0 Open', icon: Bug, sub: 'Zero defects logged', color: 'border-l-rose-500' },
    { label: 'System Quality', value: 'Optimal', sub: '100% Passed', icon: Activity, color: 'border-l-purple-500' },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Dashboard" title="QA Engineering Workspace" />

      {/* Theme-Aware Header Banner */}
      <div className="relative p-6 rounded-2xl aureon-theme-banner overflow-hidden transition-all duration-300 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] uppercase font-bold tracking-wider">
              QA Engineer: {userName}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5">{userName}'s Quality Assurance Workspace</h1>
          <p className="text-xs banner-subtext mt-1 max-w-xl">
            Execute automated test suites, log bugs with screenshot/log evidence, verify developer hotfixes, and generate quality reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 relative z-10">
          <button
            onClick={() => onNavigate('BugTracker')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/30 shadow-md transition-all hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" /> Log Bug Defect
          </button>
          <button
            onClick={() => onNavigate('TestCases')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-md transition-all hover:scale-105"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Test Suite
          </button>
        </div>
      </div>

      {/* Summary Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <div key={i} className={`p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 ${w.color} border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
                <span className="text-[11px] font-semibold">{w.label}</span>
                <Icon className="w-4 h-4 text-slate-400 warm:text-[#69523c]" />
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 warm:text-[#342314] mt-2 truncate">{w.value}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1">{w.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
