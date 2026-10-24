import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { 
  Bug, CheckSquare, ShieldCheck, AlertOctagon, CheckCircle2, 
  RotateCcw, Activity, Plus, FileText, Upload, RefreshCw,
  ArrowRight, FolderKanban, GitBranch, Sparkles
} from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';

export const QaDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'QA Engineer';

  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [testCasesCount, setTestCasesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchQaTelemetry = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [bugRes, projRes] = await Promise.all([
        fetch(`${API_BASE_URL}/bugs/`, { headers }),
        fetch(`${API_BASE_URL}/projects/`, { headers })
      ]);

      if (bugRes.ok) {
        const bData = await bugRes.json();
        setBugs(bData.bugs || []);
      }

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
      }

      // Check stored test cases
      try {
        const saved = localStorage.getItem('aureon_test_cases');
        if (saved) {
          const parsed = JSON.parse(saved);
          setTestCasesCount(Array.isArray(parsed) ? parsed.length : 0);
        } else {
          setTestCasesCount(0);
        }
      } catch (e) {
        setTestCasesCount(0);
      }
    } catch (err) {
      console.warn('Failed to load QA metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQaTelemetry();
  }, []);

  const handleNav = (tab) => {
    if (typeof onNavigate === 'function') {
      onNavigate(tab);
    }
  };

  const openBugs = bugs.filter(b => b.status === 'OPEN' || b.status === 'IN_PROGRESS');
  const criticalBugs = bugs.filter(b => b.severity === 'CRITICAL' || b.severity === 'HIGH');
  const projectsWithScore = projects.filter(p => p.health_score !== null && p.health_score !== undefined);
  const avgHealth = projectsWithScore.length > 0
    ? Math.round(projectsWithScore.reduce((acc, p) => acc + Number(p.health_score), 0) / projectsWithScore.length)
    : null;

  const widgets = [
    { 
      label: 'QA Engineer', 
      value: userName, 
      sub: user?.email || 'Active Session', 
      icon: ShieldCheck, 
      color: 'border-l-indigo-500 hover:border-l-indigo-600',
      tab: 'Profile',
      hint: 'Manage Profile →'
    },
    { 
      label: 'Test Suite Cases', 
      value: `${testCasesCount} Cases`, 
      sub: 'Regression & Smoke Tests', 
      icon: CheckSquare, 
      color: 'border-l-blue-500 hover:border-l-blue-600',
      tab: 'TestCases',
      hint: 'Open Test Cases →'
    },
    { 
      label: 'Active Bug Defects', 
      value: `${openBugs.length} Open`, 
      sub: criticalBugs.length > 0 ? `${criticalBugs.length} High/Critical` : 'No Critical Defects', 
      icon: Bug, 
      color: openBugs.length > 0 ? 'border-l-rose-500 hover:border-l-rose-600' : 'border-l-emerald-500 hover:border-l-emerald-600',
      tab: 'BugTracker',
      hint: 'Inspect Bug Tracker →'
    },
    { 
      label: 'Active QA Projects', 
      value: `${projects.length} Projects`, 
      sub: 'Quality Scopes Tracked', 
      icon: FolderKanban, 
      color: 'border-l-purple-500 hover:border-l-purple-600',
      tab: 'Projects',
      hint: 'View Projects Hub →'
    },
    { 
      label: 'Quality Health Score', 
      value: avgHealth !== null ? `${avgHealth}/100` : 'N/A', 
      sub: 'Test Coverage & Code Health', 
      icon: Activity, 
      color: 'border-l-emerald-500 hover:border-l-emerald-600',
      tab: 'Reports',
      hint: 'View QA Reports →'
    },
  ];

  const quickActions = [
    { label: 'Bug Defect Tracker', tab: 'BugTracker', icon: Bug, desc: 'Log issues with screenshot logs' },
    { label: 'Test Case Library', tab: 'TestCases', icon: CheckSquare, desc: 'Execute automated regression tests' },
    { label: 'Project Health', tab: 'Projects', icon: FolderKanban, desc: 'Project deliverables & quality health' },
    { label: 'Repository Status', tab: 'Repository', icon: GitBranch, desc: 'Git commit & PR branch status' },
    { label: 'Compliance Reports', tab: 'Reports', icon: FileText, desc: 'Export QA execution test summaries' },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Dashboard" title="QA Engineering Workspace" />

      {/* Header Banner */}
      <div className="relative p-6 rounded-2xl aureon-theme-banner overflow-hidden transition-all duration-300 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              QA Specialist: {userName}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5">{userName}'s Quality Assurance Hub</h1>
          <p className="text-xs banner-subtext mt-1 max-w-xl text-white/90">
            Execute automated test suites, log bugs with screenshot/log evidence, verify developer hotfixes, and audit deliverables.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 relative z-10">
          <button
            type="button"
            onClick={() => handleNav('BugTracker')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 active:scale-95 text-slate-900 text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5 text-rose-600" /> Log Bug Defect
          </button>
          <button
            type="button"
            onClick={() => handleNav('TestCases')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white text-xs font-bold border border-white/30 shadow-md transition-all cursor-pointer hover:scale-105"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Test Suite Library
          </button>
          <button
            type="button"
            onClick={fetchQaTelemetry}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Refresh QA Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Widgets Grid - All Interactive Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleNav(w.tab)}
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 ${w.color} border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 text-left cursor-pointer group flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{w.label}</span>
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 group-hover:text-indigo-600 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 warm:text-[#342314] mt-2 truncate">
                  {w.value}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-medium truncate">
                  {w.sub}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                <span>{w.hint}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Action Hub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Quick QA Actions & Test Modules
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">Click any card to open workspace module</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((qa, idx) => {
            const Icon = qa.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleNav(qa.tab)}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 hover:-translate-y-0.5 active:scale-95 transition-all text-left cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {qa.label}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    {qa.desc}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-indigo-600 dark:text-indigo-400">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Defects / QA Activity Stream */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bug className="w-4 h-4 text-rose-500" /> Active Bug Registry & Verification Queue
          </h3>
          <button
            type="button"
            onClick={() => handleNav('BugTracker')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            View all ({bugs.length}) <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {bugs.length > 0 ? (
          <div className="space-y-2.5">
            {bugs.slice(0, 4).map((b) => (
              <button 
                key={b.id}
                type="button"
                onClick={() => handleNav('BugTracker')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer focus:outline-hidden"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400">
                      {b.bug_id || `BUG-${String(b.id).substring(0, 6)}`}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {b.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Assigned: {b.assigned_developer || 'Unassigned'} • Severity: {b.severity || 'HIGH'}
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold self-start sm:self-auto ${
                  b.status === 'RESOLVED' || b.status === 'CLOSED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {b.status || 'OPEN'}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
            No active bugs reported in database. All automated test assertions passing.
          </div>
        )}
      </div>
    </div>
  );
};
