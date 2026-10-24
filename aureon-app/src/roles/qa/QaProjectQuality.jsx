import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { apiClient } from '../../services/apiClient';
import { Activity, Bug, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const QaProjectQuality = ({ onNavigate }) => {
  const [bugs, setBugs] = useState([]);
  const [qualitySummary, setQualitySummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQualityData = async () => {
    setLoading(true);
    try {
      const [bugsRes, qualityRes] = await Promise.allSettled([
        apiClient.get('/bugs/'),
        apiClient.get('/analysis/quality-summary')
      ]);

      if (bugsRes.status === 'fulfilled' && bugsRes.value?.success && Array.isArray(bugsRes.value?.data)) {
        setBugs(bugsRes.value.data);
      }
      if (qualityRes.status === 'fulfilled' && qualityRes.value?.success && Array.isArray(qualityRes.value?.data)) {
        setQualitySummary(qualityRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching quality overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, []);

  const critCount = bugs.filter(b => (b.severity || '').toUpperCase() === 'CRITICAL').length;
  const highCount = bugs.filter(b => (b.severity || '').toUpperCase() === 'HIGH').length;
  const medCount = bugs.filter(b => (b.severity || '').toUpperCase() === 'MEDIUM').length;
  const lowCount = bugs.filter(b => (b.severity || '').toUpperCase() === 'LOW').length;

  const severityData = [
    { name: 'CRITICAL', value: critCount, color: '#ef4444' },
    { name: 'HIGH', value: highCount, color: '#f97316' },
    { name: 'MEDIUM', value: medCount, color: '#f59e0b' },
    { name: 'LOW', value: lowCount, color: '#3b82f6' }
  ];

  const openBugs = bugs.filter(b => ['OPEN', 'IN_PROGRESS', 'REOPENED'].includes((b.status || '').toUpperCase())).length;
  const resolvedBugs = bugs.filter(b => ['RESOLVED', 'CLOSED'].includes((b.status || '').toUpperCase())).length;

  const testStatusData = [
    { name: 'Resolved / Closed', value: resolvedBugs, color: '#10b981' },
    { name: 'Active / Open', value: openBugs, color: '#ef4444' }
  ];

  const avgCoverage = qualitySummary.length > 0 
    ? Math.round(qualitySummary.reduce((a, p) => a + (parseFloat(p.coverage) || 0), 0) / qualitySummary.length) 
    : 0;

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Quality Overview" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Project Quality Overview
          </h1>
          <p className="text-xs text-gray-500">Live PostgreSQL bug severity heatmap, resolution rates, and quality gate summaries.</p>
        </div>
        <button
          onClick={fetchQualityData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open Database Bugs', value: openBugs, color: 'border-l-rose-500', tab: 'BugTracker', hint: 'View open bugs →' },
          { label: 'Resolved Bugs', value: resolvedBugs, color: 'border-l-emerald-500', tab: 'BugTracker', hint: 'View resolved bugs →' },
          { label: 'Analyzed Projects', value: qualitySummary.length, color: 'border-l-indigo-500', tab: 'Projects', hint: 'Inspect projects →' },
          { label: 'Coverage Avg', value: `${avgCoverage}%`, color: 'border-l-blue-500', tab: 'Projects', hint: 'Inspect coverage →' }
        ].map((w, i) => (
          <button 
            key={i} 
            type="button"
            onClick={() => onNavigate && onNavigate(w.tab)}
            className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all text-left cursor-pointer group flex flex-col justify-between`}
          >
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase">{w.label}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{w.value}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {w.hint}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">PostgreSQL Bug Severity Heatmap</h3>
          {bugs.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-gray-400">No bugs logged in database</div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                    {severityData.map((e,i)=><Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Bug Status Distribution</h3>
          {bugs.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-gray-400">No bugs logged in database</div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={testStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Count">
                    {testStatusData.map((e,i)=><Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
