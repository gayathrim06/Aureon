import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { initialTestSuites, initialTestCases, initialBugs } from '../../services/mockData';
import { FileText, CheckCircle2, XCircle, Clock, Bug } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const QaTestReports = () => {
  const safeTestCases = Array.isArray(initialTestCases) ? initialTestCases : [];
  const passedCount = safeTestCases.filter(t=>t.status==='PASSED').length;
  const passRate = safeTestCases.length > 0 ? Math.round((passedCount / safeTestCases.length) * 100) : 100;
  const pieData = [
    { name: 'Passed', value: passedCount, color: '#10b981' },
    { name: 'Failed', value: safeTestCases.filter(t=>t.status==='FAILED').length, color: '#ef4444' },
    { name: 'Pending', value: safeTestCases.filter(t=>t.status==='PENDING').length, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Test Reports" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />QA Test Reports & Analytics</h1><p className="text-xs text-gray-500">Aggregate pass/fail rates, regression results, and test coverage reports.</p></div>
      <div className="grid grid-cols-4 gap-4">
        {[{ label: 'Total Test Cases', value: initialTestCases.length, color: 'border-l-blue-500' },
          { label: 'Pass Rate', value: passRate + '%', color: 'border-l-emerald-500' },
          { label: 'Active Bugs', value: initialBugs.filter(b=>b.status==='OPEN').length, color: 'border-l-rose-500' },
          { label: 'Test Suites', value: initialTestSuites.length, color: 'border-l-indigo-500' }
        ].map((w,i) => (
          <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="text-[11px] font-semibold text-gray-500">{w.label}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{w.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Overall Test Pass/Fail Distribution</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{pieData.map((e,i)=><Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Suite Execution Summary</h3>
          <div className="space-y-3">
            {initialTestSuites.map(ts => (
              <div key={ts.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-900 dark:text-gray-100">{ts.name}</span><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ts.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ts.status}</span></div>
                <div className="mt-2 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${(ts.passed/ts.totalCases)*100}%` }} />
                  <div className="h-full bg-rose-500" style={{ width: `${(ts.failed/ts.totalCases)*100}%` }} />
                </div>
                <div className="flex gap-3 mt-1 text-[10px] text-gray-500"><span className="text-emerald-600 font-bold">{ts.passed} pass</span><span className="text-rose-600 font-bold">{ts.failed} fail</span><span className="text-amber-600 font-bold">{ts.pending} pending</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
