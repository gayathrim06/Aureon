import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { getAuditLogs, exportAuditLogsCSV } from '../../services/auditLogger';
import { FileText, Download, ShieldCheck, RefreshCw, Smartphone } from 'lucide-react';

export const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);

  const refresh = () => {
    setLogs(getAuditLogs());
  };

  useEffect(() => {
    refresh();
  }, []);

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
          <p className="text-xs text-gray-500">Immutable ledger of logins, role updates, permission changes, and project actions.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={exportAuditLogsCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV Log Report
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        searchPlaceholder="Filter audit logs by action, user, IP, resource..."
      />
    </div>
  );
};
