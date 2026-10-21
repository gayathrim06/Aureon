import React, { useState, useMemo } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { FileText, Shield, Users, Activity, Download, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ComplianceReports = () => {
  const [filterType, setFilterType] = useState('ALL');

  const reports = [
    { id: 'rpt_1', name: 'RBAC Permission Audit Summary', description: 'Complete role-permission matrix review across all 5 user roles', type: 'SECURITY', generatedAt: '2026-08-02 12:00', status: 'READY', size: '2.4 MB' },
    { id: 'rpt_2', name: 'User Access & Login Analytics', description: 'Login frequency, failed attempts, lockout events, and MFA adoption', type: 'ACCESS', generatedAt: '2026-08-02 08:00', status: 'READY', size: '1.8 MB' },
    { id: 'rpt_3', name: 'Data Retention & Privacy Compliance', description: 'GDPR-aligned data retention policies, PII exposure scan results', type: 'COMPLIANCE', generatedAt: '2026-08-01 18:00', status: 'READY', size: '3.1 MB' },
    { id: 'rpt_4', name: 'Security Posture Assessment', description: 'JWT configuration review, rate limiting thresholds, CORS policies', type: 'SECURITY', generatedAt: '2026-07-30 09:00', status: 'READY', size: '1.2 MB' },
    { id: 'rpt_5', name: 'Platform Activity Summary (Monthly)', description: 'Monthly aggregation of user actions, project changes, and deployments', type: 'ACTIVITY', generatedAt: '2026-08-01 00:00', status: 'GENERATING', size: '—' }
  ];

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
  }, [filterType]);

  const totalCount = reports.length;
  const securityCount = reports.filter(r => r.type === 'SECURITY' || r.type === 'COMPLIANCE').length;
  const readyCount = reports.filter(r => r.status === 'READY').length;

  return (
    <div className="space-y-6 font-sans">
      <Breadcrumb activeTab="Compliance Reports" />
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-500" /> Compliance & Security Reports
        </h1>
        <p className="text-xs text-gray-500">Generate and download compliance audit reports, security assessments, and access analytics.</p>
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
              <span className="text-[11px] font-bold uppercase tracking-wider">All Reports</span>
              <FileText className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalCount} Reports</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Platform governance documents</div>
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
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{securityCount} Audits</div>
            <div className="text-[10px] text-slate-500 mt-0.5">RBAC & GDPR security scans</div>
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
              <span className="text-[11px] font-bold uppercase tracking-wider">Available Downloads</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{readyCount} Ready</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Exportable compliance PDF files</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>{filterType === 'READY' ? '● Filter Active (Reset)' : 'Filter ready downloads'}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>
      </div>

      <div className="space-y-4">
        {filteredReports.map(r => (
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
            <button className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${r.status === 'READY' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}`} disabled={r.status !== 'READY'}>
              {r.status === 'READY' ? <><Download className="w-3.5 h-3.5" />Download PDF</> : <><Activity className="w-3.5 h-3.5 animate-spin" />Generating...</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

