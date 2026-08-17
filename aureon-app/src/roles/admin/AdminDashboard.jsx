import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, ShieldCheck, Activity, Globe, FileText, Database, ShieldAlert,
  Terminal, Server, Cpu, RefreshCw, AlertTriangle, Layers, CheckSquare, Plus
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

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
    overall_project_health: 100
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminDashboard = async () => {
    setIsLoading(true);
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/dashboards/admin', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setRecentActivities(data.recent_activities);
      }
    } catch (err) {
      console.error("Failed to load admin dashboard statistics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const healthScore = metrics.overall_project_health;
  
  // Color configuration based on health score
  const getHealthStatusColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/25';
    if (score >= 50) return 'text-amber-400 border-amber-500/25';
    return 'text-rose-400 border-rose-500/25';
  };

  const getHealthLabel = (score) => {
    if (score >= 80) return 'OPTIMAL HEALTH';
    if (score >= 50) return 'NEEDS REVIEW';
    return 'CRITICAL STATE';
  };

  return (
    <div className="space-y-6 font-sans text-slate-100 selection:bg-purple-500/35">
      <div className="flex justify-between items-center">
        <Breadcrumb activeTab="System Admin Overview" />
        <button
          onClick={fetchAdminDashboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition-all hover:scale-105"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
        </button>
      </div>

      {/* Cyberpunk Command Header Banner */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 text-white shadow-2xl border border-purple-500/30 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-mono text-[10px] uppercase font-black border border-purple-400/40 tracking-wider">
                Root System Monitor
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1.5">{userName}'s Admin Console</h1>
            <p className="text-xs text-indigo-200 mt-1 max-w-xl">
              System Admin Workspace. Overview metrics for user accounts, teams allocation, project states, and system audit logs.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('Users')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
            >
              <Users className="w-4 h-4" /> Provision Users
            </button>
            <button
              onClick={() => onNavigate('AuditLogs')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition-all hover:scale-105"
            >
              <FileText className="w-4 h-4" /> System Audit Logs
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs text-slate-500">Loading system metrics telemetry...</div>
      ) : (
        <>
          {/* Essential Overview KPI Widgets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Total Users */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-purple-500/20 shadow-md hover:border-purple-500/40 transition-all">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">Total Users</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2 font-mono">{metrics.total_users}</div>
              <div className="text-[9px] text-slate-500 mt-1">Registered Platform Accounts</div>
            </div>

            {/* 2. Active Users */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/20 shadow-md hover:border-emerald-500/40 transition-all">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">Active Users</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">{metrics.active_users}</div>
              <div className="text-[9px] text-slate-500 mt-1">Users marked ACTIVE status</div>
            </div>

            {/* 3. Total Projects */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-blue-500/20 shadow-md hover:border-blue-500/40 transition-all">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">Total Projects</span>
                <Database className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2 font-mono">{metrics.total_projects}</div>
              <div className="text-[9px] text-slate-500 mt-1">Projects tracked in database</div>
            </div>

            {/* 4. Active Projects */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/20 shadow-md hover:border-indigo-500/40 transition-all">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">Active Projects</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-400 mt-2 font-mono">{metrics.active_projects}</div>
              <div className="text-[9px] text-slate-500 mt-1">Status set to IN PROGRESS</div>
            </div>

            {/* 5. Completed Projects */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-teal-500/20 shadow-md hover:border-teal-500/40 transition-all">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">Completed Projects</span>
                <CheckSquare className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-teal-400 mt-2 font-mono">{metrics.completed_projects}</div>
              <div className="text-[9px] text-slate-500 mt-1">Projects successfully finished</div>
            </div>

            {/* 6. Total Teams */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/20 shadow-md hover:border-cyan-500/40 transition-all">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">Total Teams</span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2 font-mono">{metrics.total_teams}</div>
              <div className="text-[9px] text-slate-500 mt-1">Active departmental guilds</div>
            </div>

            {/* 7. Pending Approvals */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/20 shadow-md hover:border-amber-500/40 transition-all">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">Pending Approvals</span>
                <Cpu className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 mt-2 font-mono">{metrics.pending_approvals}</div>
              <div className="text-[9px] text-slate-500 mt-1">Tasks requiring code verification</div>
            </div>

            {/* 8. System Alerts */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-rose-500/20 shadow-md hover:border-rose-500/40 transition-all">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">System Alerts</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-500 mt-2 font-mono">{metrics.system_alerts}</div>
              <div className="text-[9px] text-rose-400 font-semibold mt-1">Open security risk triggers</div>
            </div>

          </div>

          {/* Section: Project Health & System Activity logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            {/* 10. Overall Project Health Summary */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs uppercase font-black tracking-wider text-slate-400">Overall Project Health Summary</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Aggregate engine health algorithm</p>
              </div>

              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center bg-slate-950 font-mono shadow-inner ${getHealthStatusColor(healthScore)}`}>
                  <span className="text-3xl font-black">{healthScore}%</span>
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500 mt-1">Score</span>
                </div>
                <div className="text-center">
                  <span className={`px-2.5 py-1 rounded bg-slate-950 text-[10px] font-black tracking-widest border border-slate-850 ${getHealthStatusColor(healthScore)}`}>
                    {getHealthLabel(healthScore)}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center leading-relaxed px-2 border-t border-slate-950 pt-3">
                Health rating calculated based on scheduled milestone limits, code warning counts, and task delays.
              </div>
            </div>

            {/* 9. Recent System Activities */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-850 shadow-xl lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                  <h3 className="text-xs uppercase font-black tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" /> Recent System Activities
                  </h3>
                  <span className="text-[9px] font-mono text-slate-500">live_audit_stream</span>
                </div>

                <div className="space-y-3 font-mono text-[10.5px] leading-relaxed max-h-60 overflow-y-auto pr-1">
                  {recentActivities.length === 0 ? (
                    <div className="text-slate-500 italic py-10 text-center">No platform activities recorded in DB yet.</div>
                  ) : (
                    recentActivities.map((log, idx) => (
                      <div key={idx} className="border-l-2 border-indigo-500/60 pl-3.5 space-y-0.5 py-1 bg-slate-900/40 rounded-r pr-2">
                        <div className="flex justify-between text-indigo-300">
                          <span className="font-bold">{log.action}</span>
                          <span className="text-slate-500 text-[9px]">
                            {log.timestamp ? log.timestamp.split('T')[0] : ''} {log.timestamp ? log.timestamp.split('T')[1].substring(0, 8) : ''}
                          </span>
                        </div>
                        <p className="text-slate-300">{log.details}</p>
                        <div className="text-slate-500 text-[9px] flex gap-2">
                          <span>User: <strong className="text-slate-400">{log.user_email || 'system'}</strong></span>
                          <span>•</span>
                          <span>Role: <strong className="text-slate-400">{(log.role_name || 'SYSTEM').replace('ROLE_', '')}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-between items-center text-[10px]">
                <span className="text-slate-500">Showing last 8 logged user requests.</span>
                <button
                  onClick={() => onNavigate('AuditLogs')}
                  className="font-bold text-indigo-400 hover:text-indigo-300 underline"
                >
                  Inspect Full Audit Database
                </button>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};
export default AdminDashboard;
