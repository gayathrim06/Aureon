import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { getAuthHeaders } from '../../services/apiClient';
import { Server, AlertTriangle, Info, XCircle, RefreshCw, X } from 'lucide-react';

export const SystemLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

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
              raw: l,
              timestamp: l.timestamp ? l.timestamp.replace('T', ' ').substring(0, 19) : '',
              level,
              source: l.action.split('_')[0] || 'SYSTEM',
              action: l.action,
              userEmail: l.user_email || 'system',
              roleName: l.role_name || 'SYSTEM',
              status: l.status || 'SUCCESS',
              browser: l.browser || 'Chrome / REST Client',
              os: l.operating_system || 'Windows 11',
              details: l.details || 'System event triggered',
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

  const counts = {
    INFO: logs.filter(l => l.level === 'INFO').length,
    WARN: logs.filter(l => l.level === 'WARN').length,
    ERROR: logs.filter(l => l.level === 'ERROR').length
  };

  const filteredLogs = React.useMemo(() => {
    if (filterLevel === 'ALL') return logs;
    return logs.filter(l => l.level === filterLevel);
  }, [logs, filterLevel]);

  const columns = [
    { 
      key: 'timestamp', 
      label: 'Timestamp', 
      render: (val) => <span className="font-mono text-[11px] text-gray-500">{val}</span> 
    },
    { 
      key: 'level', 
      label: 'Level', 
      render: (val) => {
        const styles = { 
          INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', 
          WARN: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', 
          ERROR: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
        };
        const icons = { 
          INFO: <Info className="w-3 h-3" />, 
          WARN: <AlertTriangle className="w-3 h-3" />, 
          ERROR: <XCircle className="w-3 h-3" /> 
        };
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${styles[val] || styles.INFO}`}>
            {icons[val] || icons.INFO}
            {val}
          </span>
        );
      }
    },
    { 
      key: 'source', 
      label: 'Source', 
      render: (val) => <span className="font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">{val}</span> 
    },
    { 
      key: 'message', 
      label: 'Log Message', 
      render: (val) => <span className="text-[11px] text-gray-800 dark:text-gray-200">{val}</span> 
    }
  ];

  const statCards = [
    {
      level: 'INFO',
      label: 'INFO Logs',
      count: counts.INFO,
      icon: Info,
      color: 'border-l-blue-500',
      activeColor: 'ring-2 ring-blue-500 bg-blue-50/40 dark:bg-blue-950/20',
      textColor: 'text-blue-600',
      hint: filterLevel === 'INFO' ? 'Showing INFO only (click to reset) ★' : 'Filter INFO logs →'
    },
    {
      level: 'WARN',
      label: 'WARN Logs',
      count: counts.WARN,
      icon: AlertTriangle,
      color: 'border-l-amber-500',
      activeColor: 'ring-2 ring-amber-500 bg-amber-50/40 dark:bg-amber-950/20',
      textColor: 'text-amber-600',
      hint: filterLevel === 'WARN' ? 'Showing WARN only (click to reset) ★' : 'Filter WARN logs →'
    },
    {
      level: 'ERROR',
      label: 'ERROR Logs',
      count: counts.ERROR,
      icon: XCircle,
      color: 'border-l-rose-500',
      activeColor: 'ring-2 ring-rose-500 bg-rose-50/40 dark:bg-rose-950/20',
      textColor: 'text-rose-600',
      hint: filterLevel === 'ERROR' ? 'Showing ERROR only (click to reset) ★' : 'Filter ERROR logs →'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="System Logs" />
        <div className="flex items-center gap-2">
          {filterLevel !== 'ALL' && (
            <button
              onClick={() => setFilterLevel('ALL')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear Filter ({filterLevel})
            </button>
          )}
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Diagnostics
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Server className="w-5 h-5 text-slate-500" />System Diagnostic Logs
        </h1>
        <p className="text-xs text-gray-500">Live infrastructure diagnostic logs from PostgreSQL: service health, errors, warnings, and background jobs.</p>
      </div>

      {/* ━━━ INTERACTIVE CLICKABLE KPI CARDS ━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isActive = filterLevel === card.level;
          return (
            <button
              key={card.level}
              type="button"
              onClick={() => setFilterLevel(prev => prev === card.level ? 'ALL' : card.level)}
              className={`p-4 rounded-xl border-l-4 ${card.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-left cursor-pointer group flex flex-col justify-between ${
                isActive ? card.activeColor : 'bg-white dark:bg-gray-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-[11px] font-semibold uppercase">{card.label}</span>
                  <Icon className={`w-4 h-4 ${card.textColor} transition-transform group-hover:scale-110`} />
                </div>
                <div className={`text-2xl font-bold ${card.textColor} mt-1`}>
                  {card.count}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                <span>{card.hint}</span>
                {isActive && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-100 dark:bg-indigo-950 font-bold uppercase">
                    Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filteredLogs} 
          searchPlaceholder="Filter logs by level, source, message..." 
          onRowClick={(row) => setSelectedLog(row)}
        />
      </div>

      {/* ━━━ LOG DETAILS MODAL ━━━ */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">System Log Event Details</h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Timestamp</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.timestamp}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Severity Level</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  selectedLog.level === 'ERROR' ? 'bg-rose-100 text-rose-700' : selectedLog.level === 'WARN' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedLog.level}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Event Action</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedLog.action}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">User / Identity</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.userEmail} ({selectedLog.roleName})</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Client Environment</span>
                <span className="text-slate-800 dark:text-slate-200">{selectedLog.browser} • {selectedLog.os}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 font-medium block mb-1">Payload & Event Details</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300 break-words border border-slate-200 dark:border-slate-700">
                  {selectedLog.details}
                </div>
              </div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
