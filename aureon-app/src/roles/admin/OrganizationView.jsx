import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { initialOrganizations } from '../../services/mockData';
import { Building, Globe, Users, CreditCard, CheckCircle2 } from 'lucide-react';

export const OrganizationView = () => {
  const columns = [
    { key: 'name', label: 'Organization Name', render: (val, row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">{val.charAt(0)}</div>
        <div>
          <div className="font-bold text-gray-900 dark:text-gray-100">{val}</div>
          <div className="text-[10px] text-gray-500 font-mono">{row.domain}</div>
        </div>
      </div>
    )},
    { key: 'plan', label: 'Plan', render: (val) => (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'Enterprise' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'}`}>{val}</span>
    )},
    { key: 'usedSeats', label: 'Seats Usage', render: (val, row) => (
      <div className="w-28">
        <div className="flex justify-between text-[10px] mb-1 font-semibold"><span>{val} / {row.seats}</span><span>{Math.round(val/row.seats*100)}%</span></div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${val/row.seats*100}%` }} />
        </div>
      </div>
    )},
    { key: 'country', label: 'Region' },
    { key: 'status', label: 'Status', render: (val) => (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" />{val}</span>
    )},
    { key: 'createdAt', label: 'Created' }
  ];

  const widgets = [
    { label: 'Total Organizations', value: initialOrganizations.length, icon: Building, color: 'border-l-indigo-500' },
    { label: 'Total Licensed Seats', value: initialOrganizations.reduce((a,o)=>a+o.seats,0), icon: Users, color: 'border-l-blue-500' },
    { label: 'Active Domains', value: initialOrganizations.filter(o=>o.status==='ACTIVE').length, icon: Globe, color: 'border-l-emerald-500' },
    { label: 'Plan Revenue', value: '$48,000/mo', icon: CreditCard, color: 'border-l-purple-500' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Organization Management" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Building className="w-5 h-5 text-indigo-500" />Organization & Tenant Management</h1><p className="text-xs text-gray-500">Manage multi-tenant organizations, subscription plans, seat allocation, and domain settings.</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {widgets.map((w, i) => { const Icon = w.icon; return (
          <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400"><span className="text-[11px] font-semibold">{w.label}</span><Icon className="w-4 h-4 text-gray-400" /></div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{w.value}</div>
          </div>
        ); })}
      </div>
      <DataTable columns={columns} data={initialOrganizations} searchPlaceholder="Search organizations by name, domain, plan..." />
    </div>
  );
};
