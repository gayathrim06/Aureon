import React, { useState } from 'react';
import { 
  Shield, Layers, UserCheck, Laptop, Bug, ArrowRight, CheckCircle2, 
  Lock, Key, Activity, Cpu, Users, Building, ChevronRight, LogIn,
  Sun, Moon, Coffee, Sparkles, Terminal, Code2, ArrowUpRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const HomePage = ({ onNavigateLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);

  const roles = [
    {
      id: 'dev',
      name: 'Developer',
      title: 'Focused Engineering Workspace',
      tagline: 'Personal task queue, drag-and-drop Kanban, commit history & PRs.',
      icon: Laptop,
      badge: 'DEVELOPER WORKSPACE',
      features: [
        'Interactive drag-and-drop task Kanban',
        'Personal git commit & repository integration',
        'Direct PR submission & code defect tracking'
      ]
    },
    {
      id: 'pm',
      name: 'Project Manager',
      title: 'Project Delivery & Milestone Tracking',
      tagline: 'Burndown velocity, sprint planning, and team workload balancing.',
      icon: Layers,
      badge: 'PROJECT MANAGEMENT',
      features: [
        'Sprint planning & milestone health metrics',
        'Resource workload & budget tracking',
        'Automated delivery progress reports'
      ]
    },
    {
      id: 'lead',
      name: 'Team Lead',
      title: 'Developer Monitoring & Code Quality',
      tagline: 'SonarQube quality gates, code reviews, and developer assignment.',
      icon: UserCheck,
      badge: 'TECH LEAD PORTAL',
      features: [
        'Developer task allocation & capacity view',
        'SonarQube code quality gate monitoring',
        'Pull request review & approval workflow'
      ]
    },
    {
      id: 'qa',
      name: 'QA Engineer',
      title: 'Testing & Defect Management Hub',
      tagline: 'Automated test suite execution and evidence-backed bug tracking.',
      icon: Bug,
      badge: 'QA TESTING HUB',
      features: [
        'Bug defect logging with screenshot evidence',
        'Automated test suite pass/fail analytics',
        'Regression verification & defect closure'
      ]
    },
    {
      id: 'admin',
      name: 'Security & Governance',
      title: 'Enterprise Administration',
      tagline: 'Governance over users, permissions, system logs & audit trails.',
      icon: Shield,
      badge: 'PLATFORM ADMIN',
      features: [
        'User provisioning & role assignment matrix',
        'Real-time immutable audit logs & CSV export',
        'Argon2 password hashing & rate limit protection'
      ]
    }
  ];

  const currentRole = roles[activeRoleIndex];
  const CurrentIcon = currentRole.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] warm:bg-[#f3e8d2] text-slate-900 dark:text-slate-100 warm:text-[#342314] font-sans transition-colors duration-200 relative">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800/80 warm:border-[#cbb68e] bg-white/80 dark:bg-[#090d16]/80 warm:bg-[#e4d5b2]/80 backdrop-blur-md px-6 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-600 warm:bg-[#b45309] flex items-center justify-center text-white font-bold text-base shadow-sm">
              A
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white warm:text-[#342314]">Aureon</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 warm:bg-[#f3e8d2] text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] border border-indigo-200 dark:border-indigo-800 warm:border-[#b8a074]">
                SaaS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 warm:text-[#342314] hover:bg-slate-100 dark:hover:bg-slate-800 warm:hover:bg-[#e8dbbe] transition-colors"
              title={`Current Theme: ${theme === 'dark' ? 'Dark Obsidian' : theme === 'warm' ? 'Warm Eye-Care Sepia' : 'Clean Light'} (Click to switch)`}
            >
              {theme === 'dark' && <Sun className="w-4 h-4 text-amber-400" />}
              {theme === 'light' && <Coffee className="w-4 h-4 text-amber-700" />}
              {theme === 'warm' && <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            <button
              onClick={onNavigateLogin}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 warm:text-[#342314] hover:bg-slate-100 dark:hover:bg-slate-800 warm:hover:bg-[#e8dbbe] transition-colors border border-slate-200 dark:border-slate-700 warm:border-[#cbb68e]"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              onClick={onNavigateLogin}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 dark:bg-indigo-600 warm:bg-[#b45309] text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              Launch Portal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 warm:bg-[#e8dbbe] border border-indigo-200 dark:border-indigo-800 warm:border-[#cbb68e] text-indigo-700 dark:text-indigo-300 warm:text-[#b45309] text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 warm:text-[#b45309]" /> Isolated Workspaces for Engineering Teams
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white warm:text-[#342314] leading-[1.15]">
          Software intelligence <br />
          <span className="text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]">tailored for every role.</span>
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-400 warm:text-[#69523c] max-w-2xl mx-auto leading-relaxed font-normal">
          Aureon delivers dedicated workspaces for Admins, PMs, Leads, Developers, and QA. Every role gets isolated navigation, custom analytics, and precise permissions.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={onNavigateLogin}
            className="px-6 py-3 rounded-lg bg-indigo-600 dark:bg-indigo-600 warm:bg-[#b45309] text-white text-xs font-semibold shadow-md flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            Access Portal <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Interactive Role Showcase */}
      <section className="py-12 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]">Interactive Role Architecture</h2>
          <p className="text-lg font-bold text-slate-900 dark:text-white warm:text-[#342314] mt-1">Select a role to preview its isolated application</p>
        </div>

        {/* Role Tab Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {roles.map((r, idx) => {
            const Icon = r.icon;
            const isActive = idx === activeRoleIndex;
            return (
              <button
                key={r.id}
                onClick={() => setActiveRoleIndex(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 dark:bg-indigo-600 warm:bg-[#b45309] text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] text-slate-600 dark:text-slate-400 warm:text-[#342314] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{r.name}</span>
              </button>
            );
          })}
        </div>

        {/* Role Card Mockup Preview */}
        <div className="p-8 rounded-2xl bg-white dark:bg-[#111827] warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-xl transition-all">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800 warm:border-[#cbb68e]">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 warm:bg-[#f3e8d2] text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] border border-indigo-100 dark:border-indigo-900 warm:border-[#b8a074]">
                <CurrentIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] text-slate-600 dark:text-slate-400 warm:text-[#69523c]">
                  {currentRole.badge}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white warm:text-[#342314] mt-1">{currentRole.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-0.5">{currentRole.tagline}</p>
              </div>
            </div>

            <button
              onClick={onNavigateLogin}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 warm:bg-[#b45309] text-white dark:text-slate-900 warm:text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Sign In as {currentRole.name} <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            {currentRole.features.map((feat, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-[#161e2e] warm:bg-[#f3e8d2] border border-slate-200/60 dark:border-slate-800 warm:border-[#b8a074] flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 warm:text-[#342314] leading-snug">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Infrastructure Footer CTA */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="p-8 rounded-2xl bg-slate-900 dark:bg-slate-900 warm:bg-[#e8dbbe] text-white warm:text-[#342314] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 warm:border-[#cbb68e]">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-indigo-400 warm:text-[#b45309]">Enterprise Ready</span>
            <h3 className="text-xl font-bold text-white warm:text-[#342314]">JWT Authentication, RBAC Policies & Audit Logs</h3>
            <p className="text-xs text-slate-400 warm:text-[#69523c] max-w-md">Comprehensive security layer with rate limiting, lockout protection, and role-based permissions.</p>
          </div>
          <button
            onClick={onNavigateLogin}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-600 warm:bg-[#b45309] text-white text-xs font-semibold shadow-sm shrink-0 hover:opacity-90 transition-opacity"
          >
            Launch Aureon SaaS
          </button>
        </div>
      </section>
    </div>
  );
};
