import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Unauthorized403 = ({ requiredPermission, onBack }) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 ring-8 ring-rose-500/5 animate-pulse">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-mono text-xs font-bold mb-2">
        HTTP 403 FORBIDDEN
      </span>

      <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
        Access Denied by Aureon RBAC Engine
      </h2>

      <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mt-2 leading-relaxed">
        Your current role (<span className="font-semibold text-rose-600 dark:text-rose-400">{user?.role}</span>) does not possess the explicit permission required to perform or view this resource.
      </p>

      {requiredPermission && (
        <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-[11px] text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>Required Permission Token: <strong className="text-rose-600 dark:text-rose-400">{requiredPermission}</strong></span>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Authorized Workspace
        </button>
      </div>
    </div>
  );
};
