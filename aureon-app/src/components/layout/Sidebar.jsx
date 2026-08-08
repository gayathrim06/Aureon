import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckSquare,
  GitBranch,
  ShieldCheck,
  Activity,
  FileBarChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Repositories', path: '/repositories', icon: GitBranch },
    { name: 'Code Quality', path: '/code-quality', icon: ShieldCheck },
    { name: 'Project Health', path: '/project-health', icon: Activity },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarWidth = collapsed ? 'w-20' : 'w-64';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[#020617]/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen bg-[#020617] border-r border-[#334155]/60
          transition-all duration-300 flex flex-col justify-between
          ${sidebarWidth}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header Branding */}
        <div>
          <div className="flex items-center justify-between h-16 px-4 border-b border-[#334155]/60">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-[12px] bg-gradient-to-tr from-[#2563EB] to-[#38BDF8] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#2563EB]/25 shrink-0">
                A
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg text-[#F8FAFC] tracking-wider">AUREON</span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-[#38BDF8]">
                    Engineering Intelligence
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1F2937] transition-colors"
              aria-label="Toggle Sidebar"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-2 overflow-y-auto max-h-[calc(100vh-140px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) => `
                    relative flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-sm font-medium transition-all duration-200 group
                    ${isActive
                      ? 'bg-[#2563EB]/15 text-[#F8FAFC] font-semibold border border-[#2563EB]/30'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1F2937]/70'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active Left Indicator Pill */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 w-1 h-6 bg-[#2563EB] rounded-r-full"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-[#2563EB]' : 'text-[#94A3B8] group-hover:text-white'}`} />
                      {!collapsed && <span>{item.name}</span>}

                      {/* Tooltip on collapsed mode */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#1F2937] text-white text-xs rounded-md shadow-lg border border-[#334155] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                          {item.name}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer User Profile & Logout */}
        <div className="p-3 border-t border-[#334155]/60 bg-[#020617]">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-[12px] bg-[#111827] border border-[#334155]/60">
              <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center">
                {user?.avatar || 'GR'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#F8FAFC] truncate">{user?.name || 'Gayathri Ramesh'}</p>
                <p className="text-[10px] text-[#38BDF8] truncate">{user?.role || 'Project Manager'}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-[12px] text-xs font-medium text-[#EF4444]
              hover:bg-[#EF4444]/10 border border-transparent hover:border-[#EF4444]/30 transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
