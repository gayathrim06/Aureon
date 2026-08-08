import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Check,
  User,
  Shield,
  Settings as SettingsIcon,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

export const TopNavbar = ({ onOpenMobileSidebar, onOpenSearchModal }) => {
  const { user, logout } = useAuth();
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
    <header className="sticky top-0 z-30 h-16 bg-[#0F172A]/90 backdrop-blur-md border-b border-[#334155]/60 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Search Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#1F2937]"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input Trigger */}
        <button
          onClick={onOpenSearchModal}
          className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 bg-[#111827] text-[#94A3B8] border border-[#334155] rounded-[12px] hover:border-[#2563EB]/50 transition-all text-xs w-64 lg:w-80 group"
        >
          <Search className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB] transition-colors" />
          <span className="flex-1 text-left">Search repositories, projects, tasks...</span>
          <kbd className="px-1.5 py-0.5 bg-[#1F2937] text-[10px] font-mono text-[#CBD5E1] border border-[#334155] rounded-md">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Notifications, Dark Mode, Profile */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#1F2937] border border-[#334155] rounded-full text-xs">
          <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="text-[#CBD5E1] font-semibold">{user?.role || 'Project Manager'}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-[#94A3B8] hover:text-white hover:bg-[#1F2937] rounded-[12px] border border-transparent hover:border-[#334155] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2563EB] rounded-full ring-2 ring-[#0F172A]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1F2937] border border-[#334155] rounded-[16px] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between p-4 border-b border-[#334155] bg-[#111827]/70">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#F8FAFC]">Notifications</h4>
                  <Badge variant="brand" size="sm">{unreadCount} New</Badge>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-[#38BDF8] hover:underline"
                >
                  Mark all read
                </button>
              </div>

              <div className="divide-y divide-[#334155]/60 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 hover:bg-[#273549] transition-colors cursor-pointer ${n.unread ? 'bg-[#2563EB]/5' : ''}`}
                  >
                    <div className="flex justify-between text-xs font-semibold text-[#F8FAFC]">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-[#94A3B8]">{n.time}</span>
                    </div>
                    <p className="text-xs text-[#CBD5E1] mt-1">{n.text}</p>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-[#334155] text-center bg-[#111827]/70">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/reports');
                  }}
                  className="text-xs text-[#2563EB] hover:text-[#38BDF8] font-semibold"
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
            className="flex items-center gap-2.5 p-1 rounded-[12px] hover:bg-[#1F2937] transition-colors"
          >
            <Avatar name={user?.name || 'Gayathri Ramesh'} size="sm" status="online" />
            <span className="hidden sm:block text-xs font-semibold text-[#F8FAFC]">
              {user?.name || 'Gayathri'}
            </span>
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#1F2937] border border-[#334155] rounded-[16px] shadow-2xl overflow-hidden z-50 p-1.5 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-[#334155]/60 mb-1">
                <p className="text-xs font-bold text-[#F8FAFC]">{user?.name || 'Gayathri Ramesh'}</p>
                <p className="text-[11px] text-[#94A3B8] truncate">{user?.email || 'gayathri@aureon.engineering'}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#CBD5E1] hover:text-white hover:bg-[#273549] rounded-[8px] transition-colors"
              >
                <User className="w-4 h-4 text-[#2563EB]" />
                <span>Profile & Account</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#CBD5E1] hover:text-white hover:bg-[#273549] rounded-[8px] transition-colors"
              >
                <SettingsIcon className="w-4 h-4 text-[#38BDF8]" />
                <span>Workspace Settings</span>
              </button>

              <div className="my-1 border-t border-[#334155]/60" />

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 rounded-[8px] transition-colors"
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
