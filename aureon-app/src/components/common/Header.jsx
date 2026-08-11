import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Sun, Moon, Shield, Bell, Search, User, LogOut, ChevronDown, 
  Key, Activity
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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 transition-colors">
      {/* Left side: Search & Context */}
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search workspace..."
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-1.5 pl-9 pr-3 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Center: Isolated User Role Indicator */}
      <div className="hidden lg:flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 status-pulse" />
          Workspace: <strong className="text-gray-900 dark:text-gray-100">{user?.role?.replace('ROLE_', '')} Portal</strong>
        </span>
      </div>

      {/* Right side: Session Timer, Theme, Profile */}
      <div className="flex items-center gap-3">
        {/* JWT Session Expire Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700">
          <Key className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono text-[11px]">JWT Session: {formatTimer(sessionExpiry)}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => onSelectTab && onSelectTab('Notifications')}
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
            />
            <div className="hidden md:block text-left text-xs">
              <div className="font-semibold text-gray-900 dark:text-gray-100">{user?.name}</div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                {user?.role?.replace('ROLE_', '')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-xl z-50">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono">
                  {user?.role}
                </span>
              </div>
              <div className="py-1 space-y-1">
                <button
                  onClick={() => { setShowProfileMenu(false); onSelectTab && onSelectTab('Profile'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md"
                >
                  <User className="w-4 h-4 text-gray-400" /> My Profile
                </button>


                <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => logout('USER_LOGOUT')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
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
