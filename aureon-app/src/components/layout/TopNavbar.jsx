import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Coffee,
  Menu,
  Check,
  User,
  Shield,
  Settings as SettingsIcon,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

export const TopNavbar = ({ onOpenMobileSidebar, onOpenSearchModal }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    { id: 1, title: 'Static Analysis Scan Completed', text: '0 high severity vulnerabilities found in PROJ-101', time: '5m ago', unread: true },
    { id: 2, title: 'New Pull Request Assigned', text: 'Sarah Chen assigned PR #204 for auth-provider', time: '22m ago', unread: true },
    { id: 3, title: 'Deployment Pipeline Passed', text: 'aureon-core-service v2.4.1 deployed to staging', time: '1h ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/88 dark:bg-[#120c1e]/88 backdrop-blur-md border-b border-purple-100 dark:border-purple-950/70 px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
      {/* Left: Mobile Toggle & Search Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-purple-600 dark:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/60"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input Trigger */}
        <button
          onClick={onOpenSearchModal}
          className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 bg-purple-50/60 dark:bg-[#191128] text-purple-950/70 dark:text-purple-200/70 border border-purple-200/80 dark:border-purple-900/60 rounded-[12px] hover:border-purple-500/60 dark:hover:border-fuchsia-500/60 transition-all text-xs w-64 lg:w-80 group"
        >
          <Search className="w-4 h-4 text-purple-400 dark:text-purple-400 group-hover:text-purple-600 dark:group-hover:text-fuchsia-400 transition-colors" />
          <span className="flex-1 text-left">Search repositories, projects, tasks...</span>
          <kbd className="px-1.5 py-0.5 bg-white dark:bg-purple-950/80 text-[10px] font-mono text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-md shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Notifications, Dark Mode Toggle, Profile */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/60 rounded-full text-xs">
          <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-fuchsia-400" />
          <span className="text-purple-950 dark:text-purple-200 font-semibold">{user?.role?.replace('ROLE_', '') || 'Project Manager'}</span>
        </div>

        {/* Theme Toggle Button (Dark -> Light -> Warm Eye-Care) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-[12px] text-purple-600 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all duration-200 shadow-xs"
          title={`Current Theme: ${theme === 'dark' ? 'Dark Obsidian' : theme === 'warm' ? 'Warm Eye-Care Sepia' : 'Clean Light'} (Click to switch)`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' && <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />}
          {theme === 'light' && <Coffee className="w-4 h-4 text-amber-700 hover:scale-110 transition-transform" />}
          {theme === 'warm' && <Moon className="w-4 h-4 text-purple-300 hover:-rotate-12 transition-transform" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-[12px] border border-transparent hover:border-purple-200 dark:hover:border-purple-900/60 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full ring-2 ring-white dark:ring-purple-950" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#191128] border border-purple-200 dark:border-purple-900/60 rounded-[16px] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between p-4 border-b border-purple-100 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/40">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-purple-950 dark:text-purple-100">Notifications</h4>
                  <Badge variant="brand" size="sm">{unreadCount} New</Badge>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-purple-600 dark:text-fuchsia-400 hover:underline font-medium"
                >
                  Mark all read
                </button>
              </div>

              <div className="divide-y divide-purple-100 dark:divide-purple-950/60 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 hover:bg-purple-50/60 dark:hover:bg-purple-950/40 transition-colors cursor-pointer ${n.unread ? 'bg-purple-50/80 dark:bg-purple-900/20' : ''}`}
                  >
                    <div className="flex justify-between text-xs font-semibold text-purple-950 dark:text-purple-100">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-purple-400 dark:text-purple-400">{n.time}</span>
                    </div>
                    <p className="text-xs text-purple-900/70 dark:text-purple-200/70 mt-1">{n.text}</p>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-purple-100 dark:border-purple-900/60 text-center bg-purple-50/60 dark:bg-purple-950/40">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/reports');
                  }}
                  className="text-xs text-purple-600 dark:text-fuchsia-400 hover:underline font-semibold"
                >
                  View All Platform Events →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-[12px] hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors"
          >
            <Avatar name={user?.name || 'User'} size="sm" status="online" />
            <span className="hidden sm:block text-xs font-semibold text-purple-950 dark:text-purple-100">
              {user?.name || 'User'}
            </span>
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#191128] border border-purple-200 dark:border-purple-900/60 rounded-[16px] shadow-2xl overflow-hidden z-50 p-1.5 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-purple-100 dark:border-purple-900/60 mb-1">
                <p className="text-xs font-bold text-purple-950 dark:text-purple-100">{user?.name || 'User Profile'}</p>
                <p className="text-[11px] text-purple-400 dark:text-purple-400 truncate">{user?.email || 'user@aureon.engineering'}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-[8px] transition-colors"
              >
                <User className="w-4 h-4 text-purple-600 dark:text-fuchsia-400" />
                <span>Profile & Account</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-[8px] transition-colors"
              >
                <SettingsIcon className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                <span>Workspace Settings</span>
              </button>

              <div className="my-1 border-t border-purple-100 dark:border-purple-900/60" />

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-[8px] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
