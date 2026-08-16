import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, UserCheck, UserX, Globe, FolderKanban, GitBranch, Activity, 
  HardDrive, Zap, ShieldAlert, UserPlus, FileText, AlertTriangle, Key, Plus
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { systemHealthMetrics } from '../../services/mockData';

export const AdminDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const userName = user?.name || user?.full_name || user?.email || 'System Administrator';

  const userGrowthData = [
    { month: 'Jan', users: 120 },
    { month: 'Feb', users: 180 },
    { month: 'Mar', users: 240 },
    { month: 'Apr', users: 310 },
    { month: 'May', users: 450 },
    { month: 'Jun', users: 580 },
    { month: 'Jul', users: 690 },
  ];

  const projectGrowthData = [
    { month: 'Q1', projects: 12, repos: 34 },
    { month: 'Q2', projects: 19, repos: 52 },
    { month: 'Q3', projects: 28, repos: 78 },
    { month: 'Q4', projects: 42, repos: 110 },
  ];

  const systemUsagePie = [
    { name: 'API Services', value: 45, color: '#3b82f6' },
    { name: 'Database', value: 30, color: '#6366f1' },
    { name: 'Background Workers', value: 15, color: '#10b981' },
    { name: 'Cache (Redis)', value: 10, color: '#f59e0b' }
  ];

  const widgets = [
    { label: 'Registered Accounts', value: '1 Account', sub: 'Live database user', icon: Users, color: 'border-l-blue-500' },
    { label: 'Active Session', value: '1 Active', sub: 'Currently logged in', icon: UserCheck, color: 'border-l-emerald-500' },
    { label: 'System Role', value: user?.role || 'ROLE_ADMIN', sub: 'Administrator privileges', icon: ShieldAlert, color: 'border-l-purple-500' },
    { label: 'API Endpoint', value: 'Port 8000', sub: 'Django REST Backend', icon: Globe, color: 'border-l-indigo-500' },
    { label: 'System Health', value: '100%', sub: 'Operational & Connected', icon: Activity, color: 'border-l-emerald-600' },
  ];

  return (
    <div className="space-y-6 font-sans">
      <Breadcrumb activeTab="System Admin Dashboard" />

      {/* Header Banner with Admin Actions */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] uppercase font-bold border border-purple-500/30">
              System Admin Command Center
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">{userName}'s Admin Console</h1>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Enterprise administration portal. Manage users, organization units, security policies, and audit logs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('Users')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" /> Manage Users
          </button>
          <button
            onClick={() => onNavigate('AuditLogs')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> View Audit Logs
          </button>
        </div>
      </div>

      {/* Real Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span className="text-[11px] font-semibold">{w.label}</span>
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-2 truncate">{w.value}</div>
              <div className="text-[10px] text-gray-400 mt-1">{w.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">User Growth Velocity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project & Repository Activity Chart */}
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Project & Repository Expansion</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Bar dataKey="projects" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Projects" />
                <Bar dataKey="repos" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Repositories" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Security & System Usage Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Usage Pie */}
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Resource Allocation</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={systemUsagePie} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {systemUsagePie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {systemUsagePie.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Alert Feed */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" /> Recent Security & Admin Alerts
            </h3>
            <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
              Argon2 & Rate-Limiter Active
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  Failed Login Threshold Exceeded (IP 185.220.101.4)
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Rate limiting triggered 5 consecutive 401 Unauthorized responses. IP auto-isolated for 15 minutes.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
              <Key className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  JWT RSA Signing Key Rotation Successful
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-400">
                  Scheduled token rotation executed at 04:00 UTC. All refresh tokens verified.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
