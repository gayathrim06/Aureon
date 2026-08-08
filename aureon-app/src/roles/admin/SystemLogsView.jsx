import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialSystemLogs } from '../../services/mockData';
import { Server, AlertTriangle, Info, XCircle } from 'lucide-react';

export const SystemLogsView = () => {
  const columns = [
    { key: 'timestamp', label: 'Timestamp', render: (val) => <span className="font-mono text-[11px] text-gray-500">{val}</span> },
    { key: 'level', label: 'Level', render: (val) => {
      const styles = { INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', WARN: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', ERROR: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' };
      const icons = { INFO: <Info className="w-3 h-3" />, WARN: <AlertTriangle className="w-3 h-3" />, ERROR: <XCircle className="w-3 h-3" /> };
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${styles[val]}`}>{icons[val]}{val}</span>;
    }},
    { key: 'source', label: 'Source', render: (val) => <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">{val}</span> },
    { key: 'message', label: 'Log Message', render: (val) => <span className="text-[11px] text-gray-700 dark:text-gray-300">{val}</span> }
  ];

  const counts = { INFO: initialSystemLogs.filter(l=>l.level==='INFO').length, WARN: initialSystemLogs.filter(l=>l.level==='WARN').length, ERROR: initialSystemLogs.filter(l=>l.level==='ERROR').length };

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="System Logs" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Server className="w-5 h-5 text-slate-500" />System Diagnostic Logs</h1><p className="text-xs text-gray-500">Infrastructure diagnostic logs: service health, errors, warnings, and background jobs.</p></div>
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
      <DataTable columns={columns} data={initialSystemLogs} searchPlaceholder="Filter logs by level, source, message..." />
    </div>
  );
};
