import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { initialUsers, initialTestCases, initialBugs, initialTestSuites } from '../../services/mockData';
import { User, Mail, Shield, Bug, CheckSquare, TestTube2, Activity, FileText } from 'lucide-react';

export const QaProfile = () => {
  const { user } = useAuth();
  const userData = user || { name: 'QA Engineer', email: 'qa@aureon.com', title: 'QA Specialist', department: 'Quality Assurance', role: 'ROLE_QA', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' };
  const passedCount = (initialTestCases || []).filter(t => t.status === 'PASSED').length;
  const bugsLogged = (initialBugs || []).length;
  const passRate = (initialTestCases && initialTestCases.length > 0) ? Math.round((passedCount / initialTestCases.length) * 100) : 100;

  const activityTimeline = [
    { time: '30 mins ago', action: 'Executed Test Suite', detail: 'Sprint 24 Security Regression — 10 pass, 1 fail, 1 pending', icon: TestTube2, color: 'text-blue-500' },
    { time: '2 hours ago', action: 'Logged Bug', detail: 'BUG-401: JWT Refresh Token concurrency race condition', icon: Bug, color: 'text-rose-500' },
    { time: '3 hours ago', action: 'Verified Fix', detail: 'BUG-402: Audit log CSV header row in Safari', icon: CheckSquare, color: 'text-emerald-500' },
    { time: '5 hours ago', action: 'Created Test Case', detail: 'TC-808: Kanban card drag updates task status', icon: FileText, color: 'text-indigo-500' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="My Profile" />
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950 via-pink-950 to-purple-950 text-white shadow-xl flex items-center gap-6">
        <img src={userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={userData.name || 'QA'} className="w-20 h-20 rounded-full object-cover border-4 border-white/20" />
        <div>
          <h1 className="text-2xl font-black">{userData.name || userData.full_name || 'QA Engineer'}</h1>
          <p className="text-xs text-rose-200">{userData.title || userData.designation || 'QA Specialist'} • {userData.department || 'Quality Assurance'}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px]">
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{userData.email}</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{userData.role?.code || userData.role || 'ROLE_QA'}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{ label: 'Tests Passed', value: passedCount, icon: CheckSquare, color: 'border-l-emerald-500' },
          { label: 'Bugs Logged', value: bugsLogged, icon: Bug, color: 'border-l-rose-500' },
          { label: 'Suites Run', value: (initialTestSuites || []).length, icon: TestTube2, color: 'border-l-blue-500' },
          { label: 'Pass Rate', value: passRate + '%', icon: Activity, color: 'border-l-purple-500' }
        ].map((w,i) => { const Icon = w.icon; return (
          <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <Icon className="w-4 h-4 text-gray-400 mb-1" />
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{w.value}</div>
            <div className="text-[10px] text-gray-500">{w.label}</div>
          </div>
        ); })}
      </div>
      <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Recent QA Activity</h3>
        <div className="space-y-4">
          {activityTimeline.map((a,i) => { const Icon = a.icon; return (
            <div key={i} className="flex items-start gap-3">
              <div className={`p-1.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 ${a.color}`}><Icon className="w-4 h-4" /></div>
              <div className="flex-1"><div className="text-xs font-semibold text-gray-900 dark:text-gray-100">{a.action}: <span className="font-normal text-gray-500">{a.detail}</span></div><span className="text-[10px] text-gray-400">{a.time}</span></div>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
};
