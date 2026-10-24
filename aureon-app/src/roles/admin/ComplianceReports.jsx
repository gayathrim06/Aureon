import React, { useState, useEffect, useMemo } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { fetchLiveAuditLogs, exportAuditLogsCSV } from '../../services/auditLogger';
import { FileText, Shield, Users, Activity, Download, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';

export const ComplianceReports = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchLiveAuditLogs(100);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load compliance audit logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Generate dynamic, genuine compliance reports based on real PostgreSQL audit trail
  const reports = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    const securityEvents = logs.filter(l => 
      String(l.action).includes('SECURITY') || 
      String(l.action).includes('AUTH') || 
      String(l.action).includes('ROLE') ||
      String(l.status).toUpperCase() !== 'SUCCESS'
    );

    const accessEvents = logs.filter(l => 
      String(l.action).includes('LOGIN') || 
      String(l.action).includes('AUTH') ||
      String(l.action).includes('SESSION')
    );

    const latestTs = logs[0]?.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);

    return [
      {
        id: 'rpt_live_audit_trail',
        name: 'Database Security & Audit Trail Report',
        description: `Export of all verified user actions, system events, and state mutations (${logs.length} records)`,
        type: 'SECURITY',
        generatedAt: latestTs,
        status: 'READY',
        size: `${(logs.length * 0.12).toFixed(1)} KB`,
        data: logs
      },
      {
        id: 'rpt_live_rbac_access',
        name: 'RBAC Authorization & Access Verification',
        description: `Role-based access check and permission execution log (${accessEvents.length} events)`,
        type: 'ACCESS',
        generatedAt: latestTs,
        status: accessEvents.length > 0 ? 'READY' : 'EMPTY',
        size: `${(accessEvents.length * 0.12).toFixed(1)} KB`,
        data: accessEvents
      },
      {
        id: 'rpt_live_compliance_anomalies',
        name: 'Compliance Anomaly & Security Incidents',
        description: `Flagged authorization failures, lockouts, or rate limit exceptions (${securityEvents.length} findings)`,
        type: 'COMPLIANCE',
        generatedAt: latestTs,
        status: securityEvents.length > 0 ? 'READY' : 'EMPTY',
        size: `${(securityEvents.length * 0.12).toFixed(1)} KB`,
        data: securityEvents
      }
    ];
  }, [logs]);

  const typeColors = { 
    SECURITY: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', 
    ACCESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', 
    COMPLIANCE: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', 
    ACTIVITY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
  };

  const filteredReports = useMemo(() => {
    if (filterType === 'ALL') return reports;
    if (filterType === 'SECURITY') return reports.filter(r => r.type === 'SECURITY' || r.type === 'COMPLIANCE');
    if (filterType === 'READY') return reports.filter(r => r.status === 'READY');
    return reports;
  }, [reports, filterType]);

  const totalCount = reports.length;
  const securityCount = reports.filter(r => r.type === 'SECURITY' || r.type === 'COMPLIANCE').length;
  const readyCount = reports.filter(r => r.status === 'READY').length;

  const handleDownload = (report) => {
    if (!report.data || report.data.length === 0) return;
    exportAuditLogsCSV(report.data);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Compliance Reports" />
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Trail
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-500" /> Compliance & Security Reports
        </h1>
        <p className="text-xs text-gray-500">
          Generate and export verified audit logs, RBAC access analytics, and security event reports from PostgreSQL.
        </p>
      </div>

      {/* Interactive KPI Filter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setFilterType('ALL')}
          className={`p-4 rounded-xl bg-white dark:bg-slate-900 border-l-4 border-l-purple-500 border-y border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-95 text-left cursor-pointer group flex flex-col justify-between ${
            filterType === 'ALL' ? 'ring-2 ring-purple-500 shadow-md' : 'hover:shadow-md'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Audit Records</span>
              <FileText className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{logs.length} Logged Events</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Live PostgreSQL audit trail</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
            <span>{filterType === 'ALL' ? '● Filter Active' : 'Click to show all'}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterType(prev => prev === 'SECURITY' ? 'ALL' : 'SECURITY')}
          className={`p-4 rounded-xl bg-white dark:bg-slate-900 border-l-4 border-l-rose-500 border-y border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-95 text-left cursor-pointer group flex flex-col justify-between ${
            filterType === 'SECURITY' ? 'ring-2 ring-rose-500 shadow-md' : 'hover:shadow-md'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Security & Compliance</span>
              <Shield className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{securityCount} Report Types</div>
            <div className="text-[10px] text-slate-500 mt-0.5">RBAC & Anomaly records</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between">
            <span>{filterType === 'SECURITY' ? '● Filter Active (Reset)' : 'Filter security only'}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterType(prev => prev === 'READY' ? 'ALL' : 'READY')}
          className={`p-4 rounded-xl bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 border-y border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-95 text-left cursor-pointer group flex flex-col justify-between ${
            filterType === 'READY' ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:shadow-md'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Available Exports</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{readyCount} Exportable</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Verified CSV audit logs</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>{filterType === 'READY' ? '● Filter Active (Reset)' : 'Filter ready exports'}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
          <span>Compiling live compliance data from database...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">No Compliance Records Found</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Audit logs have not recorded matching compliance activity yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(r => (
            <div key={r.id} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{r.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-bold ${typeColors[r.type]}`}>{r.type}</span>
                    <span className="text-gray-400 font-mono">Last Logged: {r.generatedAt}</span>
                    <span className="text-gray-400 font-mono">Est. Size: {r.size}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDownload(r)}
                disabled={r.status !== 'READY'}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  r.status === 'READY' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {r.status === 'READY' ? (
                  <><Download className="w-3.5 h-3.5" />Export CSV</>
                ) : (
                  <><Activity className="w-3.5 h-3.5 animate-spin" />No Data Available</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
