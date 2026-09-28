import React, { useState } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { TestTube2, CheckCircle2, XCircle, Clock, Play, Plus } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const QaTestSuites = () => {
  const [testSuites, setTestSuites] = useState(() => {
    try {
      const saved = localStorage.getItem('aureon_test_suites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const chartData = testSuites.map(ts => ({ 
    name: ts.name.length > 15 ? ts.name.substring(0, 15) + '...' : ts.name, 
    passed: ts.passed || 0, 
    failed: ts.failed || 0, 
    pending: ts.pending || 0 
  }));
  const statusColors = { 
    COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', 
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', 
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' 
  };

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Test Suites" />
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <TestTube2 className="w-5 h-5 text-blue-500" />
          Assigned Test Suites
        </h1>
        <p className="text-xs text-gray-500">Automated and manual test suite execution status, pass/fail rates, and run history.</p>
      </div>

      {testSuites.length > 0 ? (
        <>
          <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Test Suite Pass/Fail Breakdown</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                  <Bar dataKey="passed" fill="#10b981" radius={[4, 4, 0, 0]} name="Passed" stackId="a" />
                  <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" stackId="a" />
                  <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testSuites.map(ts => (
              <div key={ts.id} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[ts.status] || statusColors.PENDING}`}>{ts.status}</span>
                  <span className="text-[10px] text-gray-400">{ts.automated ? '🤖 Automated' : '👤 Manual'}</span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{ts.name}</h4>
                <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] text-center">
                  <div className="p-2 rounded bg-gray-50 dark:bg-gray-900/60"><div className="text-base font-bold text-gray-900 dark:text-gray-100">{ts.totalCases || 0}</div><div className="text-gray-400">Total</div></div>
                  <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30"><div className="text-base font-bold text-emerald-600">{ts.passed || 0}</div><div className="text-gray-400">Pass</div></div>
                  <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/30"><div className="text-base font-bold text-rose-600">{ts.failed || 0}</div><div className="text-gray-400">Fail</div></div>
                  <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30"><div className="text-base font-bold text-amber-600">{ts.pending || 0}</div><div className="text-gray-400">Pending</div></div>
                </div>
                <div className="mt-2 text-[10px] text-gray-400">Last run: {ts.lastRun || 'Never'}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <TestTube2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No test suites configured</h3>
          <p className="text-xs text-gray-500 mt-1">Test suites will appear once created or linked to project sprints.</p>
        </div>
      )}
    </div>
  );
};
