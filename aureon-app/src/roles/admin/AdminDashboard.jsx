import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../services/apiClient';
import { 
  Users, ShieldCheck, Activity, Globe, FileText, Database, ShieldAlert,
  Terminal, Server, Cpu, RefreshCw, AlertTriangle, Layers, CheckSquare, Plus
} from 'lucide-react';

export const AdminDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const userName = user?.name || user?.full_name || 'System Administrator';

  const [metrics, setMetrics] = useState({
    total_users: 0,
    active_users: 0,
    total_projects: 0,
    active_projects: 0,
    completed_projects: 0,
    total_teams: 0,
    pending_approvals: 0,
    system_alerts: 0,
    overall_project_health: null
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdminDashboard = async () => {
    setIsLoading(true);
    const rawToken = sessionStorage.getItem('aureon_jwt_access_token') || localStorage.getItem('aureon_jwt_access_token') || sessionStorage.getItem('aureon_access_token');
    const isRealJwt = rawToken && rawToken.startsWith('ey') && rawToken.split('.').length === 3;
    const headers = isRealJwt ? { 'Authorization': `Bearer ${rawToken}` } : {};

    try {
      const res = await fetch(`${API_BASE_URL}/dashboards/admin`, { headers });
      if (res.ok) {
        const data = await res.json();
        const metricsData = data.metrics || data.dashboard?.metrics || data;
        setMetrics({
          total_users: metricsData.total_users ?? 0,
          active_users: metricsData.active_users ?? 0,
          total_projects: metricsData.total_projects ?? 0,
          active_projects: metricsData.active_projects ?? 0,
          completed_projects: metricsData.completed_projects ?? 0,
          total_teams: metricsData.total_teams ?? 0,
          pending_approvals: metricsData.pending_approvals ?? (metricsData.pending_tasks ?? 0),
          system_alerts: metricsData.system_alerts ?? 0,
          overall_project_health: metricsData.overall_project_health ?? null
        });

        if (Array.isArray(data.recent_activities)) {
          setRecentActivities(data.recent_activities.map(a => ({
            id: a.id || a.uuid || Math.random(),
            action: a.action || 'AUDIT_LOG',
            details: a.details || a.description || `${a.action || 'Action'} by ${a.user || 'system'}`,
            timestamp: a.timestamp ? new Date(a.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent',
            type: a.type || 'info'
          })));
        }
      }
    } catch (err) {
      console.error("Failed to load admin dashboard metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <div className="flex justify-between items-center">
        <Breadcrumb activeTab="System Admin Overview" />
        <button
          onClick={fetchAdminDashboard}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] text-slate-800 dark:text-slate-200 warm:text-[#342314] text-xs font-bold border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm transition-all hover:scale-105 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} /> Refresh Analytics
        </button>
      </div>

      {/* Theme-Aware Command Header Banner */}
      <div className="relative p-6 rounded-2xl aureon-theme-banner overflow-hidden transition-all duration-300">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] uppercase font-black tracking-wider">
                Root System Monitor
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1.5">{userName}'s Admin Console</h1>
            <p className="text-xs banner-subtext mt-1 max-w-xl text-white/90">
              System Admin Workspace. Verified metrics for user accounts, teams allocation, project states, and system audit logs directly from PostgreSQL.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('Users')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/30 shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              <Users className="w-4 h-4 text-white" /> Provision Users
            </button>
            <button
              onClick={() => onNavigate('AuditLogs')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-400" /> System Audit Logs
            </button>
          </div>
        </div>
      </div>

      {/* Overview KPI Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Users */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('Users')}
          className="w-full text-left p-5 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-indigo-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Total Users</span>
              <Users className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-3">{metrics.total_users}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
            <span>Manage accounts</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* 2. Active Users */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('Users')}
          className="w-full text-left p-5 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-emerald-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Active Users</span>
              <ShieldCheck className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3">{metrics.active_users}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Active directory</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* 3. Total Projects */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('Projects')}
          className="w-full text-left p-5 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-blue-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Total Projects</span>
              <Database className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-3">{metrics.total_projects}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
            <span>Projects directory</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* 4. Active Projects */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('Projects')}
          className="w-full text-left p-5 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-blue-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Active Projects</span>
              <Layers className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-3">{metrics.active_projects}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
            <span>Filter in progress</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* 5. Completed Projects */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('Projects')}
          className="w-full text-left p-5 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-emerald-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Completed Projects</span>
              <CheckSquare className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3">{metrics.completed_projects}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>View completed</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* 6. Total Teams */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('Teams')}
          className="w-full text-left p-5 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-cyan-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-cyan-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Total Teams</span>
              <Globe className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-3">{metrics.total_teams}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center justify-between">
            <span>Departmental guilds</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* 7. Pending Tasks */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('Tasks')}
          className="w-full text-left p-5 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-amber-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Pending Tasks</span>
              <Cpu className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-3">{metrics.pending_approvals}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span>Inspect all tasks</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* 8. System Alerts */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('Reports')}
          className="w-full text-left p-5 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-rose-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-rose-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 warm:text-[#69523c]">System Alerts</span>
              <AlertTriangle className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3">{metrics.system_alerts}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between">
            <span>Security reports</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>
      </div>

      {/* Recent System Activities Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white warm:text-[#342314] flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" /> Recent System Audit Activities
          </h3>
          <span className="text-[10px] font-mono text-emerald-500">live_audit_stream</span>
        </div>

        {recentActivities.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl">
            No system audit logs recorded in PostgreSQL yet.
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((act) => (
              <button 
                key={act.id} 
                type="button"
                onClick={() => onNavigate && onNavigate('AuditLogs')}
                className="w-full text-left p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-700 warm:border-[#b8a074] hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group focus:outline-hidden"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] group-hover:underline">{act.action}</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 warm:text-[#342314] mt-0.5">{act.details}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{act.timestamp}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
