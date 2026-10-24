import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { FileText, TrendingUp, CheckSquare, Activity, RefreshCw, Filter, FolderKanban } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';

export const DeliveryReports = ({ onNavigate }) => {
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [projectsList, setProjectsList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch real projects from DB
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.projects) {
          setProjectsList(data.projects);
        }
      }
    } catch (err) {
      console.error('Error fetching projects list:', err);
    }
  };

  // Fetch real delivery analytics from backend PostgreSQL
  const fetchDeliveryAnalytics = async () => {
    try {
      setLoading(true);
      const url = selectedProject === 'ALL'
        ? `${API_BASE_URL}/reports/delivery-analytics`
        : `${API_BASE_URL}/reports/delivery-analytics?project_id=${selectedProject}`;

      const res = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Error fetching delivery analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchDeliveryAnalytics();
  }, [selectedProject]);

  const metrics = analyticsData?.metrics || {
    avg_velocity: 0,
    total_completed_tasks: 0,
    total_tasks: 0,
    completion_rate_pct: 0,
    on_time_delivery_pct: 0,
    sprints_count: 0
  };

  const velocityData = analyticsData?.velocity_trend || [];
  const throughputData = analyticsData?.weekly_throughput || [];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Breadcrumb activeTab="Delivery Reports" />
        <div className="flex items-center gap-2">
          {/* Project Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Projects (System-Wide)</option>
              {projectsList.map(p => (
                <option key={p.id} value={p.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchDeliveryAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          Delivery Reports & Velocity Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Live sprint velocity trends, weekly task throughput rates, and deliverable completion ratios derived from PostgreSQL.
        </p>
      </div>

      {/* Genuine PostgreSQL KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { 
            label: 'Avg Sprint Velocity', 
            value: metrics.sprints_count > 0 ? `${metrics.avg_velocity} pts` : 'No sprints', 
            sub: `${metrics.sprints_count} monitored iterations`,
            icon: TrendingUp, 
            color: 'border-l-blue-500', 
            tab: 'Sprints', 
            hint: 'View sprint planning →' 
          },
          { 
            label: 'Total Completed', 
            value: `${metrics.total_completed_tasks} Tasks`, 
            sub: `Out of ${metrics.total_tasks} registered tasks`,
            icon: CheckSquare, 
            color: 'border-l-emerald-500', 
            tab: 'Sprints', 
            hint: 'Inspect completed tasks →' 
          },
          { 
            label: 'Completion Ratio', 
            value: `${metrics.completion_rate_pct}%`, 
            sub: metrics.total_tasks > 0 ? 'Verified closed deliverables' : 'No tasks recorded',
            icon: Activity, 
            color: 'border-l-indigo-500', 
            tab: 'ProjectHealth', 
            hint: 'Inspect project health →' 
          },
          { 
            label: 'On-Time Delivery', 
            value: metrics.total_completed_tasks > 0 ? `${metrics.on_time_delivery_pct}%` : 'N/A', 
            sub: metrics.total_completed_tasks > 0 ? 'Delivered before due date' : 'No completed tasks yet',
            icon: FileText, 
            color: 'border-l-purple-500', 
            tab: 'Milestones', 
            hint: 'Review milestones →' 
          }
        ].map((w, i) => { 
          const Icon = w.icon; 
          return (
            <button 
              key={i} 
              type="button"
              onClick={() => onNavigate && onNavigate(w.tab)}
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 border-l-4 ${w.color} border-y border-r border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all text-left cursor-pointer group flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-semibold uppercase">{w.label}</span>
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">{w.value}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{w.sub}</div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {w.hint}
              </div>
            </button>
          ); 
        })}
      </div>

      {/* Genuine Charts or Honest Empty States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sprint Velocity Trend */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Sprint Velocity Trend</span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">Live Database History</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Actual completed vs planned story points per sprint iteration.
            </p>
          </div>

          <div className="mt-4 h-64">
            {velocityData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">No Sprint Velocity Records</h4>
                <p className="text-[11px] max-w-xs mt-1">
                  Create and execute sprints in the Sprint Planner to generate live historical velocity analytics.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="sprint" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                  <Area type="monotone" dataKey="velocity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} name="Delivered Points" />
                  <Area type="monotone" dataKey="planned" stroke="#9ca3af" fill="none" strokeDasharray="5 5" strokeWidth={1.5} name="Planned Points" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Task Throughput */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Weekly Task Throughput</span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">Last 4 Weeks</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Volume of tasks created versus marked as completed per weekly window.
            </p>
          </div>

          <div className="mt-4 h-64">
            {throughputData.every(d => d.created === 0 && d.completed === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">No Weekly Task Activity</h4>
                <p className="text-[11px] max-w-xs mt-1">
                  Task throughput metrics will appear automatically as tasks are created and completed in sprints.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={throughputData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="week" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                  <Bar dataKey="created" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Created" />
                  <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
