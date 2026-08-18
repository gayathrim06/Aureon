import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { initialProjects, initialSonarQube } from '../../services/mockData';
import { Cpu, Activity, TrendingUp, Shield, Bug, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export const AiHealthInsights = () => {
  const healthFactors = [
    { subject: 'Code Quality', A: 92 },
    { subject: 'Test Coverage', A: 88 },
    { subject: 'Sprint Velocity', A: 85 },
    { subject: 'Bug Resolution', A: 78 },
    { subject: 'Tech Debt', A: 90 },
    { subject: 'Team Capacity', A: 84 }
  ];

  const recommendations = [
    { type: 'success', icon: CheckCircle2, title: 'Code Quality Gate: PASSED', desc: 'All projects maintain SonarQube Grade A or B rating.' },
    { type: 'warning', icon: AlertTriangle, title: 'Sprint Deadline Risk: MODERATE', desc: 'Sprint 12 has 8 tasks remaining with 4 days left. Consider scope reduction.' },
    { type: 'info', icon: Zap, title: 'AI Recommendation: Refactor admin.py', desc: 'Cognitive complexity in admin views exceeds threshold. Suggested: extract helper functions.' },
    { type: 'success', icon: TrendingUp, title: 'Developer Velocity: INCREASING', desc: 'Team velocity increased 12% compared to last sprint. Marcus Brody leads with 94% score.' }
  ];

  const typeStyles = { success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50', warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50', info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50' };

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="AI Project Health" />
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-blue-950 to-purple-950 text-white shadow-xl">
        <div className="flex items-center gap-2"><span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] uppercase font-bold border border-blue-500/30">AI/ML Intelligence Engine</span></div>
        <h1 className="text-2xl font-black tracking-tight mt-2">AI Project Health Diagnostics</h1>
        <p className="text-xs text-gray-300 mt-1 max-w-xl">ML-powered health scoring using code quality metrics, sprint velocity, bug trends, and team capacity analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Cpu className="w-4 h-4 text-blue-500" />Health Factor Radar Analysis</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={healthFactors}><PolarGrid stroke="#374151" /><PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={10} /><PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4b5563" fontSize={9} /><Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} /></RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {initialProjects.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                <div className={`text-3xl font-black ${p.healthScore >= 90 ? 'text-emerald-600' : p.healthScore >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>{p.healthScore}</div>
                <div className="text-[10px] text-gray-500 mt-1 font-semibold">{p.key}</div>
                <div className="text-[10px] text-gray-400 truncate">{p.name}</div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {recommendations.map((r, i) => { const Icon = r.icon; return (
              <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${typeStyles[r.type]}`}>
                <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${r.type === 'success' ? 'text-emerald-600' : r.type === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
                <div><p className="text-xs font-semibold text-gray-900 dark:text-gray-200">{r.title}</p><p className="text-[11px] text-gray-600 dark:text-gray-400">{r.desc}</p></div>
              </div>
            ); })}
          </div>
        </div>
      </div>
    </div>
  );
};
