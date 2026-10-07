import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { getAuthHeaders } from '../../services/apiClient';
import { FileText, TrendingUp, CheckSquare, GitCommit, Users, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const LeadReports = () => {
  const [developers, setDevelopers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      const [devRes, taskRes, comRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/team-lead/my-team/availability', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/tasks/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/repositories/commits', { headers })
      ]);

      if (devRes.ok) {
        const dData = await devRes.json();
        if (dData.developers) setDevelopers(dData.developers);
      }
      if (taskRes.ok) {
        const tData = await taskRes.json();
        if (tData.tasks) setTasks(tData.tasks);
      }
      if (comRes.ok) {
        const cData = await comRes.json();
        if (cData.commits) setCommits(cData.commits);
      }
    } catch (err) {
      console.error('Failed to load team performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const safeDevs = Array.isArray(developers) ? developers : [];
  
  const chartData = safeDevs.map(d => {
    const devId = String(d.id || d.user_id || '');
    const devName = (d.name || d.full_name || '').toLowerCase();
    
    const devTasks = tasks.filter(t => {
      if (t.assigned_to_id && String(t.assigned_to_id) === devId) return true;
      const tAssignee = (t.assignee_name || t.assigned_to || t.assignee || '').toLowerCase();
      return devName && (tAssignee.includes(devName) || devName.includes(tAssignee));
    });

    const devCommits = commits.filter(c => {
      const cAuthor = (c.author_name || c.author || '').toLowerCase();
      return devName && (cAuthor.includes(devName) || devName.includes(cAuthor));
    });

    const completed = devTasks.filter(t => t.status === 'COMPLETED' || t.status === 'DONE').length;
    const velocity = devTasks.length > 0 ? Math.round((completed / devTasks.length) * 100) : 0;
    
    return {
      name: (d.name || d.full_name || 'Dev').split(' ')[0],
      velocity,
      completed,
      commits: devCommits.length
    };
  });

  const totalTasksDone = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'DONE').length;
  const activeTasksCount = tasks.filter(t => !['COMPLETED', 'DONE', 'CLOSED'].includes(t.status)).length;
  const devsWithTasks = chartData.filter(d => d.velocity > 0);
  const avgVelocity = devsWithTasks.length > 0
    ? Math.round(devsWithTasks.reduce((acc, d) => acc + d.velocity, 0) / devsWithTasks.length)
    : 0;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Team Reports" />
        <button
          onClick={fetchReportData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Reports
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />Team Performance Reports
        </h1>
        <p className="text-xs text-gray-500">Live PostgreSQL team productivity scores, task completion rates, and real repository commits.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Team Avg Velocity', value: `${avgVelocity}%`, icon: TrendingUp, color: 'border-l-blue-500' },
          { label: 'Total Tasks Done', value: totalTasksDone, icon: CheckSquare, color: 'border-l-emerald-500' },
          { label: 'Active Work In Progress', value: activeTasksCount, icon: GitCommit, color: 'border-l-purple-500' },
          { label: 'Team Members in Squad', value: safeDevs.length, icon: Users, color: 'border-l-indigo-500' }
        ].map((w, i) => { 
          const Icon = w.icon; 
          return (
            <div key={i} className={`p-4 rounded-2xl bg-white dark:bg-gray-800 border-l-4 ${w.color} border-y border-r border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all`}>
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-[11px] font-semibold">{w.label}</span>
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{w.value}</div>
            </div>
          ); 
        })}
      </div>

      {chartData.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Developer Velocity & Deliverables (Live Records)</h3>
          <p className="text-xs text-gray-400 mb-4">Calculated task completion % and verified repository commits per squad engineer</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Bar dataKey="velocity" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Velocity %" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Tasks Completed" />
                <Bar dataKey="commits" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Git Commits" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
