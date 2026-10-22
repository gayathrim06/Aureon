import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import { Activity, Shield, Cpu, TrendingUp, RefreshCw, Layers } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

export const LeadProjectHealth = ({ onNavigate }) => {
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      const [res, spRes] = await Promise.all([
        fetch(`${API_BASE_URL}/analysis/quality-summary`, { headers }),
        fetch(`${API_BASE_URL}/sprints/`, { headers })
      ]);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.projects) {
          setProjects(data.projects);
        }
      }

      if (spRes.ok) {
        const spData = await spRes.json();
        if (spData.sprints) {
          setSprints(spData.sprints);
        }
      }
    } catch (err) {
      console.error('Failed to load project health analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const safeProjects = Array.isArray(projects) ? projects : [];
  
  // Real sprint health & progress trend derived directly from database records
  const sprintTrend = sprints.map(s => ({
    sprint: (s.name || s.sprint_name || 'Sprint').substring(0, 16),
    score: s.sprint_score !== undefined && s.sprint_score !== null ? Number(s.sprint_score) : 100,
    progress: s.completion_percentage !== undefined ? Math.round(Number(s.completion_percentage)) : 0
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Project Health" />
        <button
          onClick={fetchHealthData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Health
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />Technical Health Analytics
        </h1>
        <p className="text-xs text-gray-500">Live PostgreSQL quality gate history, coverage trends, and technical debt analysis.</p>
      </div>

      {loading && safeProjects.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">Loading project health data...</div>
      ) : safeProjects.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          No project quality data currently available in database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {safeProjects.map(p => (
            <div key={p.id || p.projectKey} className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                  {p.projectKey}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  p.qualityGate === 'PASSED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700'
                }`}>
                  {p.qualityGate || 'PASSED'}
                </span>
              </div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-3">{p.projectName}</h4>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded bg-gray-50 dark:bg-gray-900/60"><span className="text-gray-400 block">Coverage</span><span className="font-bold text-emerald-600">{p.coverage || '0%'}</span></div>
                <div className="p-2 rounded bg-gray-50 dark:bg-gray-900/60"><span className="text-gray-400 block">Tech Debt</span><span className="font-bold text-amber-600">{p.technicalDebt || '0d'}</span></div>
                <div className="p-2 rounded bg-gray-50 dark:bg-gray-900/60"><span className="text-gray-400 block">Bugs</span><span className="font-bold text-rose-600">{p.bugs || 0}</span></div>
                <div className="p-2 rounded bg-gray-50 dark:bg-gray-900/60"><span className="text-gray-400 block">Rating</span><span className={`font-bold ${p.rating === 'A' ? 'text-emerald-600' : 'text-amber-600'}`}>{p.rating || 'A'}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sprintTrend.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                Live Sprint Health & Completion Progress (DB Records)
              </h3>
              <p className="text-xs text-gray-400">Calculated metrics directly from PostgreSQL sprint milestones</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sprintTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="sprint" stroke="#9ca3af" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} name="Sprint Health Score" />
                <Bar dataKey="progress" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
