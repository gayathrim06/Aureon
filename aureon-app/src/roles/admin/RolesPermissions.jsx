import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { getAuthHeaders } from '../../services/apiClient';
import { Shield, Lock, CheckCircle2, Users, RefreshCw } from 'lucide-react';

export const RolesPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/users/roles', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.roles) {
          setRoles(data.roles);
        }
      }
    } catch (err) {
      console.error('Failed to load live roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Roles & Permissions" />
        <button
          onClick={fetchRoles}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Roles
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" /> Role-Based Access Control (RBAC) Permission Matrix
        </h1>
        <p className="text-xs text-gray-500">
          Strict authorization definitions enforced by PostgreSQL database tables and backend route guards across all 5 roles.
        </p>
      </div>

      {loading && roles.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">Loading live roles from database...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono">
                    {role.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      <Users className="w-3.5 h-3.5" /> {role.user_count || 0} active users
                    </span>
                    <span className="text-xs text-gray-400 font-medium">Level {role.level}</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-2">{role.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{role.description}</p>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Granted Token Permissions:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(role.permissions || []).map(p => (
                      <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-mono text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

