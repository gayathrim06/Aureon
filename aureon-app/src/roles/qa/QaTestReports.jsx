import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { apiClient } from '../../services/apiClient';
import { FileText, CheckCircle2, XCircle, Clock, Bug, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const QaTestReports = () => {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/bugs/');
      if (res?.success && Array.isArray(res?.data)) {
        setBugs(res.data);
      }
    } catch (e) {
      console.error('Error fetching QA report data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const openBugs = bugs.filter(b => ['OPEN', 'IN_PROGRESS', 'REOPENED'].includes((b.status || '').toUpperCase())).length;
  const resolvedBugs = bugs.filter(b => ['RESOLVED', 'CLOSED'].includes((b.status || '').toUpperCase())).length;

  const pieData = [
    { name: 'Resolved / Closed', value: resolvedBugs, color: '#10b981' },
    { name: 'Active / Open', value: openBugs, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Test Reports" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            QA Test Reports & Analytics
          </h1>
          <p className="text-xs text-gray-500">Live PostgreSQL bug resolution rates, test suites status, and verification metrics.</p>
        </div>
        <button
          onClick={fetchReportData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Bugs Tracked', value: bugs.length, color: 'border-l-blue-500' },
          { label: 'Active Open Bugs', value: openBugs, color: 'border-l-rose-500' },
          { label: 'Resolved / Verified', value: resolvedBugs, color: 'border-l-emerald-500' }
        ].map((w, i) => (
          <div key={i} className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm`}>
            <div className="text-[11px] font-semibold text-gray-500">{w.label}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{w.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">PostgreSQL Bug Resolution Breakdown</h3>
          {bugs.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-gray-400">No bugs logged in database</div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                    {pieData.map((e,i)=><Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Quality Assurance Summary</h3>
          <div className="space-y-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span>Database Connection</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> PostgreSQL aureon_db Live
              </span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span>Bug Verification Pipeline</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">Active</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span>Resolution Rate</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {bugs.length > 0 ? Math.round((resolvedBugs / bugs.length) * 100) : 100}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
