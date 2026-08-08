import React from 'react';
import { 
  Shield, Layers, UserCheck, Laptop, Bug, ArrowRight, CheckCircle2, 
  Lock, Key, Activity, Cpu, Users, Building, ChevronRight, Star, Globe, LogIn
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const HomePage = ({ onNavigateLogin, onNavigateRegister }) => {
  const { theme, toggleTheme } = useTheme();

  const rolesFeatures = [
    {
      role: 'System Admin',
      title: 'Global Platform & Security Control',
      desc: 'Full administrative governance over users, organizations, RBAC policies, system logs, and immutable audit trails.',
      icon: Shield,
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      highlights: ['User Provisioning & Role Matrices', 'Immutable Real-Time Audit Logs', 'Argon2 Password Hashing & Rate Limits']
    },
    {
      role: 'Project Manager',
      title: 'Project Delivery & Milestone Tracking',
      desc: 'End-to-end software project management, sprint burndown velocity, budget allocations, and team workload balancing.',
      icon: Layers,
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      highlights: ['Overall Team Growth & Budget Tracking', 'Sprint Burndown Velocity Charts', 'Milestone & Project Health Index']
    },
    {
      role: 'Team Lead',
      title: 'Developer Monitoring & Code Quality',
      desc: 'Coordinate developer execution, review code commits, inspect SonarQube quality gates, and approve task completions.',
      icon: UserCheck,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      highlights: ['Assigned Developer Workload Tracking', 'SonarQube Quality Gate Metrics', 'Pull Request Code Review Approvals']
    },
    {
      role: 'Developer',
      title: 'Focused Development IDE Workspace',
      desc: 'Personalized engineering workspace to manage assigned tasks, move interactive Kanban cards, commit code, and submit PRs.',
      icon: Laptop,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      highlights: ['Personal Task Queue & Commit History', 'Drag-and-Drop Interactive Kanban Board', 'Task Discussions & Attachment Uploads']
    },
    {
      role: 'QA Engineer',
      title: 'Testing & Defect Management Hub',
      desc: 'Execute automated test suites, log software defects with screenshot/log evidence, verify fixes, and run regression tests.',
      icon: Bug,
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      highlights: ['Bug Defect Logging with Log Evidence', 'Automated Test Suite Pass/Fail Charts', 'Defect Fix Verification & Closure']
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
              A
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">Aureon <span className="text-blue-500 text-xs font-semibold">SaaS</span></span>
              <span className="block text-[10px] text-slate-400">Enterprise Role-Based Platform</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Role Architecture</a>
            <a href="#security" className="hover:text-blue-400 transition-colors">Enterprise Security</a>
            <a href="#pricing" className="hover:text-blue-400 transition-colors">Platform Features</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateLogin}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-200 hover:bg-slate-800 transition-colors border border-slate-700"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              onClick={onNavigateLogin}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-colors"
            >
              Launch Portal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" /> True Role-Based Access Control (RBAC) Engine
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            One Enterprise Platform. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              5 Dedicated Role Applications.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Aureon delivers custom-tailored workspaces for System Admins, Project Managers, Team Leads, Developers, and QA Engineers. Each role operates with isolated navigation, permissions, and team analytics.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onNavigateLogin}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              Sign In to Your Role Application <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Role Applications Grid Section */}
      <section id="features" className="py-20 px-6 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">5 Tailored Role Applications</h2>
            <p className="text-xs text-slate-400 mt-2">
              Every team member logs into a custom-built interface engineered specifically for their role and responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rolesFeatures.map((rf, idx) => {
              const Icon = rf.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${rf.badgeColor}`}>
                        {rf.role}
                      </span>
                      <div className="p-2 rounded-xl bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2">{rf.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">{rf.desc}</p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-800/60 text-xs">
                    {rf.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-[11px]">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise Security Banner */}
      <section id="security" className="py-20 px-6">
        <div className="max-w-6xl mx-auto p-8 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-900/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] uppercase font-bold border border-blue-500/30">
              Enterprise Grade Security Standard
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              JWT Token Rotation, Argon2 Hashing & Immutable Audit Logs
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Built with server-side API guards, role permission checking, account lockout protection after 5 failed attempts, and comprehensive CSV audit log export.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button
              onClick={onNavigateLogin}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-colors text-center"
            >
              Access Secure Portal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
