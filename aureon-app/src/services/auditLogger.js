// Enterprise Audit Logging Engine
import { initialAuditLogs } from './mockData';

const AUDIT_STORAGE_KEY = 'aureon_audit_logs';

export const getAuditLogs = () => {
  const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(initialAuditLogs));
    return initialAuditLogs;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return initialAuditLogs;
  }
};

export const logAuditEvent = ({ user, role, action, resource, status = 'SUCCESS', ip = '192.168.1.105', device = 'Chrome 127 / Windows 11' }) => {
  const currentLogs = getAuditLogs();
  const newLog = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user: user ? `${user.name} (${user.email})` : 'System / Unauthenticated',
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

export const exportAuditLogsCSV = () => {
  const logs = getAuditLogs();
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
