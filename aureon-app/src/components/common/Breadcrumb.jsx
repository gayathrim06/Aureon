import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Breadcrumb = ({ activeTab, title, onNavigate }) => {
  const { user } = useAuth();
  const roleName = user?.role?.replace('ROLE_', '') || 'ADMIN';

  return (
    <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4 select-none">
      <button
        onClick={() => onNavigate && onNavigate('Dashboard')}
        type="button"
        className="flex items-center gap-1 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        title="Go to Dashboard"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Aureon</span>
      </button>
      <ChevronRight className="w-3 h-3 text-gray-400" />
      <button
        onClick={() => onNavigate && onNavigate('Dashboard')}
        type="button"
        className="font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px] bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
        title="Role Dashboard"
      >
        {roleName}
      </button>
      <ChevronRight className="w-3 h-3 text-gray-400" />
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        {title || activeTab}
      </span>
    </nav>
  );
};
