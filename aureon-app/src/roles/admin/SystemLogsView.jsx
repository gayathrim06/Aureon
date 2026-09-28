import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { getAuthHeaders } from '../../services/apiClient';
import { Server, AlertTriangle, Info, XCircle, RefreshCw } from 'lucide-react';

export const SystemLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/audit-logs/?per_page=100', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logs) {
          const mapped = data.logs.map(l => {
            const isError = (l.status && l.status !== 'SUCCESS') || l.action.includes('ERROR') || l.action.includes('FAIL');
            const isWarn = l.action.includes('WARN') || l.action.includes('SECURITY') || l.action.includes('REVOKE');
            const level = isError ? 'ERROR' : isWarn ? 'WARN' : 'INFO';
            return {
              id: l.id,
              timestamp: l.timestamp ? l.timestamp.replace('T', ' ').substring(0, 19) : '',
              level,
              source: l.action.split('_')[0] || 'SYSTEM',
              message: `${l.action}: ${l.details || 'System event triggered'} (${l.user_email || 'system'})`
            };
          });
          setLogs(mapped);
        }
      }
    } catch (err) {
      console.error('Failed to load system diagnostic logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    { key: 'timestamp', label: 'Timestamp', render: (val) => <span className="font-mono text-[11px] text-gray-500">{val}</span> },
    { key: 'level', label: 'Level', render: (val) => {
      const styles = { INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', WARN: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', ERROR: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' };
      const icons = { INFO: <Info className="w-3 h-3" />, WARN: <AlertTriangle className="w-3 h-3" />, ERROR: <XCircle className="w-3 h-3" /> };
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${styles[val] || styles.INFO}`}>{icons[val] || icons.INFO}{val}</span>;
    }},
    { key: 'source', label: 'Source', render: (val) => <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">{val}</span> },
    { key: 'message', label: 'Log Message', render: (val) => <span className="text-[11px] text-gray-700 dark:text-gray-300">{val}</span> }
  ];

  const counts = {
    INFO: logs.filter(l => l.level === 'INFO').length,
    WARN: logs.filter(l => l.level === 'WARN').length,
    ERROR: logs.filter(l => l.level === 'ERROR').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="System Logs" />
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Diagnostics
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Server className="w-5 h-5 text-slate-500" />System Diagnostic Logs
        </h1>
        <p className="text-xs text-gray-500">Live infrastructure diagnostic logs from PostgreSQL: service health, errors, warnings, and background jobs.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 border-l-blue-500 border-y border-r border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-[11px] font-semibold text-gray-500">INFO Logs</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{counts.INFO}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 border-l-amber-500 border-y border-r border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-[11px] font-semibold text-gray-500">WARN Logs</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{counts.WARN}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 border-l-rose-500 border-y border-r border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-[11px] font-semibold text-gray-500">ERROR Logs</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{counts.ERROR}</div>
        </div>
      </div>

      <DataTable columns={columns} data={logs} searchPlaceholder="Filter logs by level, source, message..." />
    </div>
  );
};

