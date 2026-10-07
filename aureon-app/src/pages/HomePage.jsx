import React from 'react';
import { LogIn, Sun, Moon, Coffee, Sparkles, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const HomePage = ({ onNavigateLogin }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] warm:bg-[#f3e8d2] text-slate-900 dark:text-slate-100 warm:text-[#342314] font-sans transition-colors duration-200 relative flex flex-col justify-between">
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 dark:bg-indigo-600 warm:bg-[#b45309] text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-6 max-w-5xl mx-auto text-center space-y-6 flex-1 flex flex-col justify-center items-center">
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

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800/80 warm:border-[#cbb68e] text-center text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
        © 2026 Aureon. Software Engineering Intelligence Platform.
      </footer>
    </div>
  );
};
