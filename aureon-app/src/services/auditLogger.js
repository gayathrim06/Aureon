// Enterprise Audit Logging Engine
import { getAuthHeaders } from './apiClient';

const AUDIT_STORAGE_KEY = 'aureon_audit_logs';

export const fetchLiveAuditLogs = async (perPage = 100) => {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/v1/audit-logs/?per_page=${perPage}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.logs) {
        const formatted = data.logs.map(l => ({
          id: l.id,
          timestamp: l.timestamp ? l.timestamp.replace('T', ' ').substring(0, 19) : '',
          user: l.user_email || 'System',
          role: l.role_name || 'SYSTEM',
          ip: l.ip || '127.0.0.1',
          device: `${l.browser || 'Chrome'} / ${l.operating_system || 'Windows'}`,
          action: l.action,
          resource: l.details || '',
          status: l.status || 'SUCCESS'
        }));
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(formatted));
        return formatted;
      }
    }
  } catch (err) {
    console.error('Failed to fetch live audit logs from backend:', err);
  }
  return getAuditLogs();
};

export const getAuditLogs = () => {
  const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const logAuditEvent = ({ user, role, action, resource, status = 'SUCCESS', ip = '127.0.0.1', device = 'Chrome / Windows' }) => {
  const currentLogs = getAuditLogs();
  const newLog = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user: user ? `${user.name || user.display_name || user.email} (${user.email || ''})` : 'System / Unauthenticated',
    role: role || (user ? user.role : 'UNKNOWN'),
    ip,
    device,
    action,
    resource,
    status
  };

  const updatedLogs = [newLog, ...currentLogs];
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updatedLogs));
  return newLog;
};

export const exportAuditLogsCSV = (logsToExport) => {
  const logs = (Array.isArray(logsToExport) && logsToExport.length > 0) ? logsToExport : getAuditLogs();
  const headers = ['Timestamp', 'User', 'Role', 'IP Address', 'Device', 'Action', 'Resource', 'Status'];
  const rows = logs.map(l => [
    `"${l.timestamp}"`,
    `"${l.user}"`,
    `"${l.role}"`,
    `"${l.ip}"`,
    `"${l.device}"`,
    `"${l.action}"`,
    `"${l.resource}"`,
    `"${l.status}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `aureon_audit_logs_${new Date().toISOString().substring(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
