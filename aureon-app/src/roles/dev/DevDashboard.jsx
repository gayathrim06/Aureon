import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckSquare, Clock, AlertTriangle, CheckCircle2, GitPullRequest, 
  GitBranch, Layers, ArrowRight, Code2, AlertCircle, RefreshCw, Sparkles
} from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';

export const DevDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'Developer';

  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    overdue: 0,
    inReview: 0
  });

  const fetchDevTasks = async () => {
    try {
      setLoading(true);
      const url = user?.id 
        ? `${API_BASE_URL}/developer/my-tasks?user_id=${user.id}`
        : `${API_BASE_URL}/developer/my-tasks`;

      const res = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        const allTasks = data.tasks || [];
        
        // Strict client-side filter: only tasks assigned to this developer
        const myUserId = String(user?.id || '').toLowerCase();
        const myEmail = String(user?.email || '').toLowerCase();
        const myName = String(userName || '').toLowerCase();

        const userTasks = allTasks.filter(t => {
          const assignId = String(t.assigned_to_id || t.assigned_to || '').toLowerCase();
          const assignName = String(t.assignee_name || t.assigned_user?.display_name || '').toLowerCase();
          const assignEmail = String(t.assignee_email || t.assigned_user?.email || '').toLowerCase();
          
          if (myUserId && assignId === myUserId) return true;
          if (myEmail && (assignEmail === myEmail || assignId === myEmail)) return true;
          if (myName && assignName && (assignName.includes(myName) || myName.includes(assignName))) return true;
          return false;
        });

        const active = userTasks.filter(t => !['COMPLETED', 'DONE', 'CLOSED'].includes(t.status));
        const completed = userTasks.filter(t => ['COMPLETED', 'DONE'].includes(t.status));
        const overdue = userTasks.filter(t => t.is_overdue);
        const inReview = userTasks.filter(t => ['IN_REVIEW', 'REVIEW', 'CODE_REVIEW'].includes(t.status));

        setAssignedTasks(userTasks);
        setTaskStats({
          total: userTasks.length,
          active: active.length,
          completed: completed.length,
          overdue: overdue.length,
          inReview: inReview.length
        });
      }
    } catch (err) {
      console.error('Failed to load developer tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevTasks();
  }, [user]);

  const isAvailable = taskStats.active === 0;
  const completedPct = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

  const handleNav = (tab) => {
    if (typeof onNavigate === 'function') {
      onNavigate(tab);
    }
  };

  const widgets = [
    { 
      label: 'Developer', 
      value: userName, 
      sub: user?.email || 'Active Session', 
      icon: Code2, 
      color: 'border-l-indigo-500',
      actionTab: 'Profile',
      clickable: true,
      hint: 'View profile →'
    },
    { 
      label: 'Delivered Tasks', 
      value: `${taskStats.completed} Delivered`, 
      sub: taskStats.completed > 0 ? `${taskStats.completed} of ${taskStats.total} completed (100%)` : 'No deliverables finished yet', 
      icon: CheckCircle2, 
      color: 'border-l-emerald-500',
      actionTab: 'SprintTasks',
      clickable: true,
      hint: 'View completed →'
    },
    { 
      label: 'Active Work', 
      value: `${taskStats.active} In-Flight`, 
      sub: `${taskStats.total} Total Assigned`, 
      icon: CheckSquare, 
      color: 'border-l-blue-500',
      actionTab: 'SprintTasks',
      clickable: true,
      hint: 'Open sprint board →'
    },
    { 
      label: 'In TL Review', 
      value: `${taskStats.inReview} Deliverables`, 
      sub: taskStats.inReview > 0 ? 'Pending Lead review' : 'No pending reviews', 
      icon: GitPullRequest, 
      color: 'border-l-purple-500',
      actionTab: 'SprintTasks',
      clickable: true,
      hint: 'Check review queue →'
    },
    { 
      label: 'Availability', 
      value: isAvailable ? 'Available' : `Busy (${taskStats.active})`, 
      sub: isAvailable ? 'Ready for next task: YES' : 'Ready for next task: NO', 
      icon: isAvailable ? CheckCircle2 : Clock, 
      color: isAvailable ? 'border-l-emerald-600' : 'border-l-amber-500',
      actionTab: 'SprintTasks',
      clickable: true,
      hint: 'View workload →'
    },
  ];

  const getPriorityBadge = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-300';
      case 'HIGH':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'DONE':
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300';
      case 'IN_PROGRESS':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-300';
      case 'IN_REVIEW':
      case 'REVIEW':
      case 'CODE_REVIEW':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Dashboard" title="Developer IDE Workspace" />

      {/* Theme-Aware Header Banner with Action Buttons */}
      <div className="relative p-6 rounded-2xl aureon-theme-banner overflow-hidden transition-all duration-300 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] uppercase font-bold tracking-wider">
              Developer Workspace - {userName}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5">{userName}'s Developer Hub</h1>
          <p className="text-xs banner-subtext mt-1 max-w-xl text-white/90">
            {user?.email ? `Authenticated as ${user.email}. ` : ''}Focus on active tasks, submit code deliverables for Team Lead review, and track execution.
          </p>
        </div>

        {/* Clickable Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button
            onClick={() => handleNav('SprintTasks')}
            className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 text-slate-900 text-xs font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
            title="Open Sprint Board & Kanban Tasks"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" /> 
            Open Sprint & Tasks
          </button>
          
          <button
            onClick={() => handleNav('Repository')}
            className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold border border-white/30 shadow-md transition-all hover:scale-105 active:scale-95"
            title="Inspect Git Commits & Repository"
          >
            <GitBranch className="w-3.5 h-3.5" /> 
            Git Repository
          </button>

          <button
            onClick={() => handleNav('PullRequests')}
            className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold border border-white/30 shadow-md transition-all hover:scale-105 active:scale-95"
            title="View Pull Requests"
          >
            <GitPullRequest className="w-3.5 h-3.5" /> 
            Pull Requests
          </button>
        </div>
      </div>

      {/* Summary Widgets Grid - All Clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleNav(w.actionTab)}
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 ${w.color} border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-left cursor-pointer group w-full`}
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
                <span className="text-[11px] font-semibold">{w.label}</span>
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 warm:text-[#342314] mt-2 truncate">
                {w.value}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1">
                {w.sub}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                {w.hint}
              </div>
            </button>
          );
        })}
      </div>

      {/* My Current Assigned Tasks Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              My Assigned Sprint Deliverables ({assignedTasks.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any deliverable or use the action button to update progress and submit code for review.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDevTasks}
              disabled={loading}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => handleNav('SprintTasks')}
              className="cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition"
            >
              Open Full Kanban Board <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Loading assigned tasks...</span>
          </div>
        ) : assignedTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">All tasks completed!</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You currently have no pending tasks assigned in active sprints. Your status is set to Available.
            </p>
            <button
              onClick={() => handleNav('SprintTasks')}
              className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition"
            >
              Browse Sprint Tasks
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {assignedTasks.map((t) => (
              <div 
                key={t.id} 
                onClick={() => handleNav('SprintTasks')}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(t.status)}`}>
                      {t.status || 'TODO'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(t.priority)}`}>
                      {t.priority || 'MEDIUM'}
                    </span>
                    {t.is_overdue && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      Est: {t.estimated_hours != null ? `${t.estimated_hours}h` : 'N/A'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {t.title}
                  </h3>
                  
                  {t.description && (
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {t.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Progress bar */}
                  <div className="w-28 space-y-1 text-right">
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 font-mono">
                      {(t.status === 'DONE' || t.status === 'COMPLETED') ? 100 : (t.progress || 0)}%
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${(t.status === 'DONE' || t.status === 'COMPLETED') ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                        style={{ width: `${(t.status === 'DONE' || t.status === 'COMPLETED') ? 100 : (t.progress || 0)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleNav('SprintTasks'); }}
                    className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
