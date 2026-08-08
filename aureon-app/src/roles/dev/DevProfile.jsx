import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { initialUsers, developerMetrics } from '../../services/mockData';
import { User, Mail, Shield, GitCommit, CheckSquare, Code2, Clock, Activity } from 'lucide-react';

export const DevProfile = () => {
  const { user } = useAuth();
  const userData = initialUsers.find(u => u.role === 'ROLE_DEV') || initialUsers[3];
  const metrics = developerMetrics.find(d => d.name === userData.name) || developerMetrics[0];

  const activityTimeline = [
    { time: '2 mins ago', action: 'Committed', detail: 'JWT refresh interceptor with token queue', icon: GitCommit, color: 'text-blue-500' },
    { time: '30 mins ago', action: 'Updated Task', detail: 'TSK-101 status → IN_PROGRESS', icon: CheckSquare, color: 'text-emerald-500' },
    { time: '1 hour ago', action: 'Opened PR', detail: 'PR-142: JWT token rotation', icon: Code2, color: 'text-purple-500' },
    { time: '3 hours ago', action: 'Posted Comment', detail: 'on TSK-102: RBAC middleware edge case', icon: Activity, color: 'text-amber-500' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="My Profile" />
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 text-white shadow-xl flex items-center gap-6">
        <img src={userData.avatar} alt={userData.name} className="w-20 h-20 rounded-full object-cover border-4 border-white/20" />
        <div>
          <h1 className="text-2xl font-black">{userData.name}</h1>
          <p className="text-xs text-blue-200">{userData.title} • {userData.department}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px]">
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{userData.email}</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{userData.role}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {[{ label: 'Commits', value: metrics.commits, icon: GitCommit, color: 'border-l-blue-500' },
          { label: 'Tasks Done', value: metrics.tasksCompleted, icon: CheckSquare, color: 'border-l-emerald-500' },
          { label: 'PRs Created', value: metrics.prs, icon: Code2, color: 'border-l-purple-500' },
          { label: 'Reviews', value: metrics.codeReviews, icon: User, color: 'border-l-amber-500' },
          { label: 'Velocity', value: metrics.velocity + '%', icon: Activity, color: 'border-l-indigo-500' }
        ].map((w, i) => { const Icon = w.icon; return (
          <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <Icon className="w-4 h-4 text-gray-400 mb-1" />
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{w.value}</div>
            <div className="text-[10px] text-gray-500">{w.label}</div>
          </div>
        ); })}
      </div>
      <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Activity Timeline</h3>
        <div className="space-y-4">
          {activityTimeline.map((a, i) => { const Icon = a.icon; return (
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
