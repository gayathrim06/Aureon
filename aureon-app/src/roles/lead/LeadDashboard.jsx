import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { 
  Users, CheckSquare, Activity, Cpu, Clock, GitPullRequest, Layers, 
  GitBranch, CheckCircle2, AlertTriangle, ArrowRight, UserCheck, Code2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { initialSonarQube } from '../../services/mockData';

export const LeadDashboard = ({ onNavigate }) => {
  // Specific developers assigned under Team Lead David Chen
  const teamDevelopers = [
    { name: 'Marcus Brody', role: 'Full Stack Dev', tasks: '6 Tasks', completed: '4 Done', commits: 24, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', status: 'ACTIVE' },
    { name: 'James Wilson', role: 'Frontend Dev', tasks: '4 Tasks', completed: '2 Done', commits: 14, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', status: 'ACTIVE' },
    { name: 'Elena Rostova', role: 'QA Automation', tasks: '5 Tasks', completed: '4 Done', commits: 18, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', status: 'ACTIVE' }
  ];

  const devProductivityData = [
    { subject: 'Marcus Brody (Fullstack)', A: 94, fullMark: 100 },
    { subject: 'James Wilson (Frontend)', A: 82, fullMark: 100 },
    { subject: 'Elena Rostova (QA)', A: 96, fullMark: 100 }
  ];

  const widgets = [
    { label: 'Assigned Developers', value: '3 Engineers', sub: 'Marcus, James, Elena', icon: Users, color: 'border-l-blue-500' },
    { label: 'Team Active Tasks', value: '15 Tasks', sub: 'Sprint 24 engineering queue', icon: CheckSquare, color: 'border-l-indigo-500' },
    { label: 'Approved Tasks', value: '10 Approved', sub: 'Passed Team Lead review', icon: CheckCircle2, color: 'border-l-emerald-500' },
    { label: 'Code Quality Gate', value: 'Grade A (92.4%)', sub: 'SonarQube Quality Gate', icon: Cpu, color: 'border-l-purple-500' },
    { label: 'Pending Code Reviews', value: '3 PRs', sub: 'PR #142, PR #143, PR #144', icon: GitPullRequest, color: 'border-l-amber-500' },
    { label: 'Merged PRs', value: '12 Merged', sub: 'Main branch pushes', icon: GitBranch, color: 'border-l-cyan-500' },
    { label: 'Sprint 24 Progress', value: '82%', sub: '4 days remaining', icon: Layers, color: 'border-l-emerald-600' },
    { label: 'Commits (This Week)', value: '56 Commits', sub: 'Across backend & frontend', icon: Activity, color: 'border-l-slate-500' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Dashboard" title="Team Lead Workstation (David Chen)" />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-900 via-stone-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] uppercase font-bold border border-amber-500/30">
              Tech Lead: David Chen • Core Engineering Team
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">Team Developer Monitoring & Execution</h1>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Track individual developer task completion, review commit histories, conduct code reviews, and monitor SonarQube metrics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('SprintBoard')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Layers className="w-3.5 h-3.5" /> Sprint Kanban Board
          </button>
        </div>
      </div>

      {/* 8 KPI Widgets Grid */}
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

      {/* Assigned Developers Workload & Code Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Developer Team Members List */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" /> Assigned Team Developers & Work Progress
          </h3>
          <div className="space-y-3">
            {teamDevelopers.map((dev, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={dev.avatar} alt={dev.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{dev.name}</h4>
                    <p className="text-[11px] text-gray-500">{dev.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Sprint Tasks</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{dev.tasks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Completed</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{dev.completed}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Git Commits</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{dev.commits}</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('Tasks')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
                >
                  Review Work
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SonarQube Code Quality Widget */}
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-500" /> SonarQube Code Quality Gate
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                {initialSonarQube.overallQualityGate}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mb-6">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700">
                <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{initialSonarQube.coverage}</div>
                <div className="text-[10px] text-gray-500">Test Coverage</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700">
                <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{initialSonarQube.bugs}</div>
                <div className="text-[10px] text-gray-500">Code Bugs</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700">
                <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{initialSonarQube.codeSmells}</div>
                <div className="text-[10px] text-gray-500">Code Smells</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs">
            <span className="font-medium text-amber-900 dark:text-amber-200">
              3 Pull Requests awaiting code review.
            </span>
            <button
              onClick={() => onNavigate('Tasks')}
              className="text-amber-700 dark:text-amber-300 font-bold hover:underline flex items-center gap-1"
            >
              Review <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
