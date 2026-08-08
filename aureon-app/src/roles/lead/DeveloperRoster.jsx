import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { developerMetrics } from '../../services/mockData';
import { Users, GitCommit, CheckSquare, Code2, Clock } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export const DeveloperRoster = () => {
  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Developer Roster" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" />Developer Roster & Performance Metrics</h1><p className="text-xs text-gray-500">Individual developer productivity, commit frequency, PR throughput, and velocity scores.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {developerMetrics.map((dev, i) => {
          const radarData = [
            { metric: 'Commits', value: Math.min(dev.commits, 50) * 2 },
            { metric: 'Tasks', value: (dev.tasksCompleted / 20) * 100 },
            { metric: 'PRs', value: dev.prs * 20 },
            { metric: 'Reviews', value: dev.codeReviews * 33 },
            { metric: 'Velocity', value: dev.velocity }
          ];
          return (
            <div key={i} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <img src={dev.avatar} alt={dev.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{dev.name}</h3>
                  <p className="text-[10px] text-gray-500">{dev.role} • Velocity: <span className={`font-bold ${dev.velocity >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{dev.velocity}%</span></p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[{ label: 'Commits', value: dev.commits, icon: GitCommit, color: 'text-blue-600' },
                  { label: 'Tasks Done', value: dev.tasksCompleted, icon: CheckSquare, color: 'text-emerald-600' },
                  { label: 'PRs', value: dev.prs, icon: Code2, color: 'text-purple-600' },
                  { label: 'Reviews', value: dev.codeReviews, icon: Users, color: 'text-amber-600' },
                  { label: 'Avg Time', value: dev.avgTaskTime, icon: Clock, color: 'text-indigo-600' }
                ].map((s, si) => { const Icon = s.icon; return (
                  <div key={si} className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-900/60">
                    <Icon className={`w-3.5 h-3.5 mx-auto ${s.color}`} />
                    <div className={`text-sm font-bold mt-1 ${s.color}`}>{s.value}</div>
                    <div className="text-[8px] text-gray-400">{s.label}</div>
                  </div>
                ); })}
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}><PolarGrid stroke="#374151" /><PolarAngleAxis dataKey="metric" stroke="#9ca3af" fontSize={9} /><PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4b5563" fontSize={8} /><Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} /></RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
