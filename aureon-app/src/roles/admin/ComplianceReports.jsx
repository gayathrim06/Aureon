import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { FileText, Shield, Users, Activity, Download, CheckCircle2 } from 'lucide-react';

export const ComplianceReports = () => {
  const reports = [
    { id: 'rpt_1', name: 'RBAC Permission Audit Summary', description: 'Complete role-permission matrix review across all 5 user roles', type: 'SECURITY', generatedAt: '2026-08-02 12:00', status: 'READY', size: '2.4 MB' },
    { id: 'rpt_2', name: 'User Access & Login Analytics', description: 'Login frequency, failed attempts, lockout events, and MFA adoption', type: 'ACCESS', generatedAt: '2026-08-02 08:00', status: 'READY', size: '1.8 MB' },
    { id: 'rpt_3', name: 'Data Retention & Privacy Compliance', description: 'GDPR-aligned data retention policies, PII exposure scan results', type: 'COMPLIANCE', generatedAt: '2026-08-01 18:00', status: 'READY', size: '3.1 MB' },
    { id: 'rpt_4', name: 'Security Posture Assessment', description: 'JWT configuration review, rate limiting thresholds, CORS policies', type: 'SECURITY', generatedAt: '2026-07-30 09:00', status: 'READY', size: '1.2 MB' },
    { id: 'rpt_5', name: 'Platform Activity Summary (Monthly)', description: 'Monthly aggregation of user actions, project changes, and deployments', type: 'ACTIVITY', generatedAt: '2026-08-01 00:00', status: 'GENERATING', size: '—' }
  ];

  const typeColors = { SECURITY: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', ACCESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', COMPLIANCE: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', ACTIVITY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' };

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Compliance Reports" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><FileText className="w-5 h-5 text-purple-500" />Compliance & Security Reports</h1><p className="text-xs text-gray-500">Generate and download compliance audit reports, security assessments, and access analytics.</p></div>
      <div className="space-y-4">
        {reports.map(r => (
          <div key={r.id} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"><FileText className="w-5 h-5" /></div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{r.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px]">
                  <span className={`px-2 py-0.5 rounded font-bold ${typeColors[r.type]}`}>{r.type}</span>
                  <span className="text-gray-400">Generated: {r.generatedAt}</span>
                  <span className="text-gray-400">Size: {r.size}</span>
                </div>
              </div>
            </div>
            <button className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${r.status === 'READY' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}`} disabled={r.status !== 'READY'}>
              {r.status === 'READY' ? <><Download className="w-3.5 h-3.5" />Download PDF</> : <><Activity className="w-3.5 h-3.5 animate-spin" />Generating...</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
