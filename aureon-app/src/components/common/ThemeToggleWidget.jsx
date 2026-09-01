import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Coffee, Palette } from 'lucide-react';

export const ThemeToggleWidget = () => {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const themeOptions = [
    { id: 'dark', label: 'Dark Obsidian', icon: Moon, bg: 'bg-slate-900 text-slate-100 border-slate-700' },
    { id: 'light', label: 'Clean Light', icon: Sun, bg: 'bg-white text-slate-900 border-slate-300 shadow-sm' },
    { id: 'warm', label: 'Warm Eye-Care Sepia', icon: Coffee, bg: 'bg-[#e4d5b2] text-[#342314] border-[#cbb68e]' },
  ];

  return (
    <div className="fixed top-3 right-4 z-[9999] flex items-center gap-1.5 bg-slate-900/90 dark:bg-slate-900/90 warm:bg-[#e3d3b0]/90 backdrop-blur-md p-1.5 rounded-full border border-slate-700/80 warm:border-[#cbb68e] shadow-2xl transition-all duration-300">
      {/* Current Theme Quick Toggle Pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all duration-200"
        title="Developer Theme Control: Click to expand options"
      >
        <Palette className="w-3.5 h-3.5" />
        <span className="capitalize">{theme} Theme</span>
      </button>

      {/* Expanded Theme Selection Options */}
      {expanded ? (
        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
          {themeOptions.map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setExpanded(false);
                }}
                className={`
                  flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200
                  ${isSelected ? 'ring-2 ring-indigo-400 font-extrabold scale-105' : 'opacity-80 hover:opacity-100'}
                  ${t.bg}
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.id}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-full text-slate-200 hover:bg-slate-800 transition-all duration-200"
          title="Quick cycle theme (Dark -> Light -> Warm Sepia)"
        >
          {theme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
          {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
          {theme === 'warm' && <Coffee className="w-4 h-4 text-amber-800" />}
        </button>
      )}
    </div>
  );
};
