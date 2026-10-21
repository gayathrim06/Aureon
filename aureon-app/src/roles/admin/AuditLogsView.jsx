import React, { useState, useEffect, useMemo } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { fetchLiveAuditLogs, exportAuditLogsCSV } from '../../services/auditLogger';
import { Download, ShieldCheck, RefreshCw, Activity, AlertTriangle, CheckCircle2, Eye, ShieldAlert, ArrowRight, X } from 'lucide-react';

export const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedAudit, setSelectedAudit] = useState(null);

  const refresh = async () => {
    setLoading(true);
    const data = await fetchLiveAuditLogs(100);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const totalCount = logs.length;
  const successCount = logs.filter(l => String(l.status).toUpperCase() === 'SUCCESS').length;
  const failureCount = logs.filter(l => String(l.status).toUpperCase() !== 'SUCCESS').length;

  const filteredLogs = useMemo(() => {
    if (filterStatus === 'ALL') return logs;
    if (filterStatus === 'SUCCESS') return logs.filter(l => String(l.status).toUpperCase() === 'SUCCESS');
    return logs.filter(l => String(l.status).toUpperCase() !== 'SUCCESS');
  }, [logs, filterStatus]);

  const columns = [
    { key: 'timestamp', label: 'Timestamp (UTC)', render: (val) => <span className="font-mono text-[11px] text-gray-500">{val}</span> },
    { key: 'user', label: 'User & Email', render: (val) => <span className="font-semibold text-gray-900 dark:text-gray-100">{val}</span> },
    { key: 'role', label: 'Role', render: (val) => <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px]">{val}</span> },
    { key: 'action', label: 'Action Event', render: (val) => <span className="font-bold text-blue-600 dark:text-blue-400">{val}</span> },
    { key: 'resource', label: 'Affected Resource', render: (val) => <span className="text-gray-600 dark:text-gray-300 text-[11px]">{val}</span> },
    { key: 'ip', label: 'IP Address', render: (val) => <span className="font-mono text-[11px] text-gray-500">{val}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          val === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
        }`}>
          {val}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Details',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setSelectedAudit(row)}
          className="p-1 px-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded flex items-center gap-1 transition-all cursor-pointer"
        >
          <Eye className="w-3 h-3" /> View
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Audit Logs" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> System Audit Trail & Security Event Logs
          </h1>
          <p className="text-xs text-gray-500">Live immutable ledger of logins, role updates, permission changes, and project actions from PostgreSQL.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-medium cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => exportAuditLogsCSV(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV Log Report ({filteredLogs.length})
          </button>
        </div>
      </div>

      {/* Interactive Clickable Filter Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setFilterStatus('ALL')}
          className={`p-4 rounded-xl bg-white dark:bg-slate-900 border-l-4 border-l-blue-500 border-y border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-95 text-left cursor-pointer group flex flex-col justify-between ${
            filterStatus === 'ALL' ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">All Audit Events</span>
              <Activity className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Total logged ledger transactions</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
            <span>{filterStatus === 'ALL' ? '● Filter Active' : 'Click to show all'}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(prev => prev === 'SUCCESS' ? 'ALL' : 'SUCCESS')}
          className={`p-4 rounded-xl bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 border-y border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-95 text-left cursor-pointer group flex flex-col justify-between ${
            filterStatus === 'SUCCESS' ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:shadow-md'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Success Operations</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{successCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Authorized user actions & updates</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>{filterStatus === 'SUCCESS' ? '● Filter Active (Click to Reset)' : 'Click to filter successes'}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(prev => prev === 'FAILURE' ? 'ALL' : 'FAILURE')}
          className={`p-4 rounded-xl bg-white dark:bg-slate-900 border-l-4 border-l-rose-500 border-y border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-95 text-left cursor-pointer group flex flex-col justify-between ${
            filterStatus === 'FAILURE' ? 'ring-2 ring-rose-500 shadow-md' : 'hover:shadow-md'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Security Alerts / Errors</span>
              <ShieldAlert className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{failureCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Failed attempts or policy breaches</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between">
            <span>{filterStatus === 'FAILURE' ? '● Filter Active (Click to Reset)' : 'Click to filter alerts'}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        searchPlaceholder="Filter audit logs by action, user, IP, resource..."
      />

      {/* Modal for detailed inspection */}
      {selectedAudit && (
        <Modal
          isOpen={Boolean(selectedAudit)}
          onClose={() => setSelectedAudit(null)}
          title="Audit Ledger Event Inspection"
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Action Event</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedAudit.action}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">User & Identity</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedAudit.user}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Security Role</span>
                <span className="font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">{selectedAudit.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Target Resource</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedAudit.resource}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">IP Origin</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{selectedAudit.ip}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Status</span>
                <span className={`px-2 py-0.5 rounded-full font-bold ${
                  selectedAudit.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>{selectedAudit.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Timestamp</span>
                <span className="font-mono text-slate-500">{selectedAudit.timestamp}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedAudit(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-all"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

