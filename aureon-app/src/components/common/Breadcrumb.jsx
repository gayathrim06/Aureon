import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Breadcrumb = ({ activeTab, title }) => {
  const { user } = useAuth();
  const roleName = user?.role?.replace('ROLE_', '') || 'ADMIN';

  return (
    <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
      <div className="flex items-center gap-1 font-medium hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span>Aureon</span>
      </div>
      <ChevronRight className="w-3 h-3 text-gray-400" />
      <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
        {roleName}
      </span>
      <ChevronRight className="w-3 h-3 text-gray-400" />
      <span className="font-medium text-gray-900 dark:text-gray-100">
        {title || activeTab}
      </span>
    </nav>
  );
};
