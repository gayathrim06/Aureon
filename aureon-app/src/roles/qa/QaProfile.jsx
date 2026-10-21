import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import { User, Mail, Shield, Bug, CheckSquare, TestTube2, Activity, FileText } from 'lucide-react';

export const QaProfile = ({ onNavigate }) => {
  const { user } = useAuth();
  const [bugsCount, setBugsCount] = useState(0);

  useEffect(() => {
    const fetchQaData = async () => {
      try {
        const res = await apiClient.get('/bugs/');
        if (res?.success && Array.isArray(res?.data)) {
          setBugsCount(res.data.length);
        }
      } catch (e) {}
    };
    fetchQaData();
  }, []);

  const userData = user || { name: 'QA Engineer', email: 'qa@aureon.com', title: 'QA Specialist', department: 'Quality Assurance', role: 'ROLE_QA' };
  const passedCount = 0;
  const bugsLogged = bugsCount;
  const passRate = 100;

  const activityTimeline = [
    { time: '30 mins ago', action: 'Executed Test Suite', detail: 'Sprint 24 Security Regression — 10 pass, 1 fail, 1 pending', icon: TestTube2, color: 'text-blue-500' },
    { time: '2 hours ago', action: 'Logged Bug', detail: 'BUG-401: JWT Refresh Token concurrency race condition', icon: Bug, color: 'text-rose-500' },
    { time: '3 hours ago', action: 'Verified Fix', detail: 'BUG-402: Audit log CSV header row in Safari', icon: CheckSquare, color: 'text-emerald-500' },
    { time: '5 hours ago', action: 'Created Test Case', detail: 'TC-808: Kanban card drag updates task status', icon: FileText, color: 'text-indigo-500' }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="My Profile" />

      {/* Theme-Aware Header Banner */}
      <div className="relative p-6 rounded-2xl aureon-theme-banner overflow-hidden transition-all duration-300 shadow-xl flex items-center gap-6 border border-white/20">
        <div className="w-20 h-20 rounded-2xl bg-white/20 text-white font-black text-3xl flex items-center justify-center border-2 border-white/30 shadow-md ring-4 ring-white/10 relative z-10">
          {(userData.name || 'QA').charAt(0).toUpperCase()}
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white">{userData.name || userData.full_name || 'QA Engineer'}</h1>
          <p className="text-xs banner-subtext mt-0.5">{userData.title || userData.designation || 'QA Specialist'} • {userData.department || 'Quality Assurance'}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-white/90">
            <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-white/80" />{userData.email}</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-white/80" />{userData.role?.code || userData.role || 'ROLE_QA'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tests Passed', value: passedCount, icon: CheckSquare, color: 'border-l-emerald-500', tab: 'TestExecution', hint: 'View test runs →' },
          { label: 'Bugs Logged', value: bugsLogged, icon: Bug, color: 'border-l-rose-500', tab: 'BugTracker', hint: 'Inspect tracked bugs →' },
          { label: 'Suites Run', value: (initialTestSuites || []).length, icon: TestTube2, color: 'border-l-blue-500', tab: 'TestExecution', hint: 'View suites →' },
          { label: 'Pass Rate', value: passRate + '%', icon: Activity, color: 'border-l-purple-500', tab: 'QualityMetrics', hint: 'Inspect metrics →' }
        ].map((w, i) => { 
          const Icon = w.icon; 
          return (
            <button 
              key={i} 
              type="button"
              onClick={() => onNavigate && onNavigate(w.tab)}
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 ${w.color} border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all text-left cursor-pointer group flex flex-col justify-between`}
            >
              <div>
                <Icon className="w-4 h-4 text-slate-400 warm:text-[#69523c] mb-1 group-hover:text-indigo-500 transition-colors" />
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 warm:text-[#342314] mt-1">{w.value}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] uppercase font-semibold">{w.label}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {w.hint}
              </div>
            </button>
          ); 
        })}
      </div>

      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white warm:text-[#342314] mb-4">Recent QA Activity</h3>
        <div className="space-y-4">
          {activityTimeline.map((a,i) => { const Icon = a.icon; return (
            <div key={i} className="flex items-start gap-3">
              <div className={`p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 warm:bg-[#f3e8d2] ${a.color}`}><Icon className="w-4 h-4" /></div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 warm:text-[#342314]">{a.action}: <span className="font-normal text-slate-500 dark:text-slate-400 warm:text-[#69523c]">{a.detail}</span></div>
                <span className="text-[10px] text-slate-400">{a.time}</span>
              </div>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
};
