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
          className="fixed inset-0 z-40 bg-slate-900/60 dark:bg-[#020617]/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen bg-white dark:bg-[#0e0918] border-r border-purple-100 dark:border-purple-950/70
          transition-all duration-300 flex flex-col justify-between
          ${sidebarWidth}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header Branding */}
        <div>
          <div className="flex items-center justify-between h-16 px-4 border-b border-purple-100 dark:border-purple-950/70">
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Logo Icon Badge */}
              <div className="w-10 h-10 rounded-[12px] aureon-glow-btn flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-purple-500/30">
                A
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-black text-lg aureon-gradient-text tracking-wider">AUREON</span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-purple-600 dark:text-fuchsia-400">
                    Intelligence SaaS
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors"
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
                      ? 'bg-purple-100/70 dark:bg-purple-900/30 text-purple-950 dark:text-fuchsia-200 font-semibold border border-purple-200 dark:border-fuchsia-500/30 shadow-xs'
                      : 'text-slate-600 dark:text-purple-200/70 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/40'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active Left Indicator Pill */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 w-1 h-6 bg-gradient-to-b from-purple-600 to-pink-500 rounded-r-full"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-purple-600 dark:text-fuchsia-400' : 'text-purple-400 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-200'}`} />
                      {!collapsed && <span>{item.name}</span>}

                      {/* Tooltip on collapsed mode */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2.5 py-1 bg-purple-950 text-white text-xs rounded-md shadow-lg border border-purple-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
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
        <div className="p-3 border-t border-purple-100 dark:border-purple-950/70 bg-purple-50/40 dark:bg-[#0e0918]">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-[12px] bg-white dark:bg-[#160f24] border border-purple-100 dark:border-purple-900/60 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-purple-300 dark:border-purple-700">
                {user?.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) ? (
                  <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.avatar || (user?.name ? user.name.split(' ').map(n=>n[0]).join('') : 'AU')}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-purple-950 dark:text-purple-100 truncate">{user?.name || 'User Profile'}</p>
                <p className="text-[10px] text-purple-600 dark:text-fuchsia-400 truncate font-medium">{user?.role?.replace('ROLE_', '') || 'Team Member'}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-[12px] text-xs font-medium text-rose-600 dark:text-rose-400
              hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-colors
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
