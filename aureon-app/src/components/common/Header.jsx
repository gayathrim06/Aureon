import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Sun, Moon, Coffee, Shield, Bell, Search, User, LogOut, ChevronDown, 
  Key, Activity, Sparkles
} from 'lucide-react';

export const Header = ({ currentTab, onSelectTab, onNavigateHome }) => {
  const { user, logout, sessionExpiry } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getNormalizedRole = (u) => {
    if (!u) return 'ROLE_DEV';
    if (u.email && u.email.toLowerCase() === 'gopika@aureon.com') return 'ROLE_PM';
    const rawRole = (typeof u.role === 'string' ? u.role : u.role?.code || u.role_code || u.role_name || '').toUpperCase();
    const rawTitle = ((u.designation || u.title || '') + ' ' + rawRole).toUpperCase();

    if (rawTitle.includes('PM') || rawTitle.includes('PROJECT MANAGER') || rawTitle.includes('MANAGER')) return 'ROLE_PM';
    if (rawTitle.includes('ADMIN')) return 'ROLE_ADMIN';
    if (rawTitle.includes('LEAD')) return 'ROLE_LEAD';
    if (rawTitle.includes('QA')) return 'ROLE_QA';
    return 'ROLE_DEV';
  };

  const currentRoleCode = getNormalizedRole(user);
  const displayRoleName = currentRoleCode.replace('ROLE_', '');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md px-6 transition-colors shadow-xs">
      {/* Left side: Search & Context */}
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search workspace..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* Center: Isolated User Role Indicator */}
      <div className="hidden lg:flex items-center gap-2">
        <span className="px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 status-pulse" />
          Workspace: <strong className="text-slate-900 dark:text-white font-bold">{displayRoleName} Portal</strong>
        </span>
      </div>

      {/* Right side: Session Timer, Theme, Profile */}
      <div className="flex items-center gap-3">
        {/* JWT Session Expire Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          <Key className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono text-[11px] font-medium">JWT: {formatTimer(sessionExpiry)}</span>
        </div>

        {/* Theme Toggle Button (Dark -> Light -> Warm Eye-Care) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
          title={`Current Theme: ${theme === 'dark' ? 'Dark Obsidian' : theme === 'warm' ? 'Warm Eye-Care Sepia' : 'Clean Light'} (Click to switch)`}
        >
          {theme === 'dark' && <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />}
          {theme === 'light' && <Coffee className="w-4 h-4 text-amber-700 hover:scale-110 transition-transform" />}
          {theme === 'warm' && <Moon className="w-4 h-4 text-indigo-400 hover:-rotate-12 transition-transform" />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => onSelectTab && onSelectTab('Notifications')}
          className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-[#111827]" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-indigo-500/30 shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left text-xs">
              <div className="font-bold text-slate-900 dark:text-white">{user?.name || user?.full_name || 'User'}</div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {displayRoleName}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl z-50 animate-in fade-in duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name || user?.full_name || 'User'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-mono font-semibold border border-indigo-200 dark:border-indigo-800">
                  {currentRoleCode}
                </span>
              </div>
              <div className="py-1 space-y-1 mt-1">
                <button
                  onClick={() => { setShowProfileMenu(false); onSelectTab && onSelectTab('Profile'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" /> My Profile
                </button>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => logout('USER_LOGOUT')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Secure Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


