import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import {
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Play,
  Send,
  CheckSquare,
  TrendingUp,
  AlertCircle,
  FileText,
  User,
  Kanban,
  List
} from 'lucide-react';

export const DevSprintTasks = ({ onShowToast }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'

  // Delay Remark modal state
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState('Technical issue');
  const [delayRemark, setDelayRemark] = useState('');
  const [delaySubmitting, setDelaySubmitting] = useState(false);

  // Status mapping
  const columns = [
    { key: 'TODO', label: 'To Do', color: 'border-t-slate-500 bg-slate-500/5', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-blue-500 bg-blue-500/5', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    { key: 'CODE_REVIEW', label: 'Code Review', color: 'border-t-amber-500 bg-amber-500/5', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    { key: 'COMPLETED', label: 'Completed', color: 'border-t-emerald-500 bg-emerald-500/5', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
  ];

  const normalizeStatus = (status) => {
    if (!status) return 'TODO';
    const s = String(status).toUpperCase();
    if (s === 'DONE' || s === 'COMPLETED') return 'COMPLETED';
    if (s === 'IN_REVIEW' || s === 'REVIEW' || s === 'CODE_REVIEW') return 'CODE_REVIEW';
    if (s === 'IN_PROGRESS' || s === 'INPROGRESS') return 'IN_PROGRESS';
    return 'TODO';
  };

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Sprint details
      const sprintRes = await fetch(`${API_BASE_URL}/sprints/`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (sprintRes.ok) {
        const sprintData = await sprintRes.json();
        if (sprintData.success && sprintData.sprints && sprintData.sprints.length > 0) {
          // Prioritize active or in-progress sprint
          const active = sprintData.sprints.find(s => s.status === 'IN_PROGRESS' || s.status === 'ACTIVE') || sprintData.sprints[0];
          setSprint(active);
        }
      }

      // 2. Fetch Developer Assigned Tasks
      const tasksRes = await fetch(`${API_BASE_URL}/developer/my-tasks`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        if (tasksData.success && tasksData.tasks) {
          const myUserId = String(user?.id || '').toLowerCase();
          const myEmail = String(user?.email || '').toLowerCase();
          const myName = String(user?.name || user?.full_name || '').toLowerCase();

          const scoped = tasksData.tasks.filter(t => {
            const assignId = String(t.assigned_to_id || t.assigned_to || '').toLowerCase();
            const assignName = String(t.assignee_name || t.assigned_user?.display_name || '').toLowerCase();
            const assignEmail = String(t.assignee_email || t.assigned_user?.email || '').toLowerCase();
            
            if (myUserId && assignId === myUserId) return true;
            if (myEmail && (assignEmail === myEmail || assignId === myEmail)) return true;
            if (myName && assignName && (assignName.includes(myName) || myName.includes(assignName))) return true;
            return false;
          });
          setTasks(scoped);
        }
      }
    } catch (err) {
      console.warn('Failed to load workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  // Update status action (Developers can move: TODO -> IN_PROGRESS -> CODE_REVIEW)
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: data.task?.status || newStatus } : t));
        if (activeTask && activeTask.id === taskId) {
          setActiveTask(prev => ({ ...prev, status: data.task?.status || newStatus }));
        }
        onShowToast && onShowToast({
          type: 'success',
          title: 'Task Status Updated',
          message: newStatus === 'CODE_REVIEW'
            ? 'Task submitted for Team Leader code review.'
            : `Moved to ${newStatus.replace('_', ' ')}`
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        onShowToast && onShowToast({
          type: 'error',
          title: 'Update Rejected',
          message: errData.message || 'Failed to update task status.'
        });
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  // Open task detail & load comments
  const handleOpenTask = async (task) => {
    setActiveTask(task);
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${task.id}/comments`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.warn('Failed to fetch comments:', err);
      setComments([]);
    }
  };

  // Post comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeTask) return;

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${activeTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ comment: commentInput.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setCommentInput('');
        onShowToast && onShowToast({
          type: 'success',
          title: 'Comment Added',
          message: 'Work progress note saved.'
        });
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  // Submit delay remark
  const handleSubmitDelayRemark = async (e) => {
    e.preventDefault();
    if (!activeTask || !delayRemark.trim()) return;

    try {
      setDelaySubmitting(true);
      const res = await fetch(`${API_BASE_URL}/tasks/${activeTask.id}/delay-remark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          reason: delayReason,
          remark: delayRemark.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsDelayModalOpen(false);
        setDelayRemark('');
        setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, delay_remark: delayRemark.trim(), delay_reason: delayReason } : t));
        if (activeTask) {
          setActiveTask(prev => ({ ...prev, delay_remark: delayRemark.trim(), delay_reason: delayReason }));
        }
        onShowToast && onShowToast({
          type: 'success',
          title: 'Delay Remark Recorded',
          message: 'Team Leader has been notified of the delay explanation.'
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        onShowToast && onShowToast({
          type: 'error',
          title: 'Submission Failed',
          message: errData.message || 'Could not record delay remark.'
        });
      }
    } catch (err) {
      console.error('Failed to submit delay remark:', err);
    } finally {
      setDelaySubmitting(false);
    }
  };

  // Calculate days remaining
  const calculateDaysRemaining = (endDateStr) => {
    if (!endDateStr) return 'N/A';
    const end = new Date(endDateStr);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    return `${diffDays} days left`;
  };

  const myCompletedCount = tasks.filter(t => normalizeStatus(t.status) === 'COMPLETED').length;
  const myTotalCount = tasks.length;
  const myProgressPct = myTotalCount > 0 ? Math.round((myCompletedCount / myTotalCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <Breadcrumb activeTab="Sprint & Tasks" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Sprint & Tasks
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Unified developer workspace for active sprint cycle progress and assigned tasks execution.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <button
            onClick={fetchWorkspaceData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* TOP SECTION: CURRENT SPRINT OVERVIEW */}
      <section className="bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-slate-900/10 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900/50 p-6 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
                Current Sprint
              </span>
              {sprint && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  {sprint.status || 'ACTIVE'}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {sprint ? sprint.name : 'No Active Sprint Assigned'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {sprint && sprint.goal ? sprint.goal : 'Coordinate with your Team Leader for upcoming sprint allocation.'}
              </p>
            </div>

            {/* Date Details */}
            {sprint && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Start: <strong className="text-slate-700 dark:text-slate-200">{sprint.start_date || 'N/A'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-pink-500" />
                  <span>End: <strong className="text-slate-700 dark:text-slate-200">{sprint.end_date || 'N/A'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Remaining: <strong className="text-slate-700 dark:text-slate-200">{calculateDaysRemaining(sprint.end_date)}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Sprint & Personal Metrics */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-t lg:border-t-0 lg:border-l border-indigo-100 dark:border-indigo-900/40 pt-4 lg:pt-0 lg:pl-6">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/60 min-w-[160px] text-center shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Sprint Progress
              </span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {sprint?.completion_percentage !== undefined ? `${sprint.completion_percentage}%` : `${myProgressPct}%`}
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${sprint?.completion_percentage !== undefined ? sprint.completion_percentage : myProgressPct}%` }}
                />
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/60 min-w-[160px] text-center shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                My Assigned Tasks
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {myCompletedCount} / {myTotalCount}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                {myTotalCount - myCompletedCount} pending completion
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM SECTION: MY TASKS (KANBAN & LIST) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              My Tasks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only tasks assigned directly to you ({user?.full_name || user?.username || 'Developer'}) are shown below.
            </p>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {tasks.length} total tasks
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
            Loading assigned sprint tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Tasks Assigned Yet</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Your Team Leader has not assigned tasks to you for the active sprint. Contact your Team Leader if you need work allocated.
            </p>
          </div>
        ) : viewMode === 'kanban' ? (
          /* KANBAN BOARD */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map(col => {
              const colTasks = tasks.filter(t => normalizeStatus(t.status) === col.key);
              return (
                <div
                  key={col.key}
                  className={`flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-3 min-h-[450px] border-t-4 ${col.color}`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800 mb-3">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {col.label}
                    </span>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Cards in Column */}
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {colTasks.length === 0 ? (
                      <div className="h-32 flex items-center justify-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                        No tasks
                      </div>
                    ) : (
                      colTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => handleOpenTask(task)}
                          className="bg-white dark:bg-slate-800/90 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600/60 transition-all cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {task.task_key || `TASK-${String(task.id).slice(0, 4)}`}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              task.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' :
                              task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400' :
                              task.priority === 'LOW' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            }`}>
                              {task.priority || 'MEDIUM'}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {task.title}
                          </h4>

                          {/* Due Date & Overdue Warning */}
                          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {task.due_date || 'No due date'}
                            </span>

                            {task.is_overdue && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="w-3 h-3" />
                                Overdue
                              </span>
                            )}
                          </div>

                          {/* Progress bar */}
                          {task.progress !== undefined && (
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 dark:bg-indigo-400 h-1 rounded-full"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1 text-[11px]">
                            {col.key === 'TODO' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(task.id, 'IN_PROGRESS');
                                }}
                                className="w-full flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 font-semibold transition"
                              >
                                <Play className="w-3 h-3" /> Start Working
                              </button>
                            )}

                            {col.key === 'IN_PROGRESS' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(task.id, 'CODE_REVIEW');
                                }}
                                className="w-full flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-300 font-semibold transition"
                              >
                                <Send className="w-3 h-3" /> Submit for Review
                              </button>
                            )}

                            {col.key === 'CODE_REVIEW' && (
                              <span className="w-full text-center py-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                Awaiting TL Approval
                              </span>
                            )}

                            {col.key === 'COMPLETED' && (
                              <span className="w-full flex items-center justify-center gap-1 py-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Task ID</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Sprint</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {tasks.map(task => {
                    const normSt = normalizeStatus(task.status);
                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleOpenTask(task)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {task.task_key || `TASK-${String(task.id).slice(0, 4)}`}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {task.title}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            normSt === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            normSt === 'CODE_REVIEW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                            normSt === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {normSt.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                            task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {task.priority || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={task.is_overdue ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-600 dark:text-slate-300'}>
                            {task.is_overdue && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                            {task.due_date || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {task.sprint_name || sprint?.name || 'Backlog'}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          {normSt === 'TODO' && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                            >
                              Start
                            </button>
                          )}
                          {normSt === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'CODE_REVIEW')}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                            >
                              Submit Review
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* TASK DETAIL MODAL */}
      {activeTask && (
        <Modal
          isOpen={!!activeTask}
          onClose={() => setActiveTask(null)}
          title={`Task: ${activeTask.task_key || activeTask.title}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {activeTask.ticket_type || 'Task'}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Priority: {activeTask.priority}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Status: {normalizeStatus(activeTask.status).replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeTask.title}
              </h3>
            </div>

            {/* Description */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeTask.description || 'No detailed description provided for this work card.'}
            </div>

            {/* Dates & Delays */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px]">Due Date</span>
                <span className={`font-semibold ${activeTask.is_overdue ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                  {activeTask.due_date || 'No deadline specified'}
                  {activeTask.is_overdue && ' (Overdue)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assigned Sprint</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeTask.sprint_name || sprint?.name || 'Sprint Cycle'}
                </span>
              </div>
            </div>

            {/* Overdue Action */}
            {activeTask.is_overdue && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-center justify-between gap-3">
                <div className="text-xs text-rose-700 dark:text-rose-300">
                  <strong>Task is Overdue.</strong> Please supply an explanation remark for your Team Leader.
                </div>
                <button
                  onClick={() => setIsDelayModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 transition"
                >
                  Submit Delay Remark
                </button>
              </div>
            )}

            {/* Existing Delay Remark Display */}
            {activeTask.delay_remark && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs space-y-1">
                <div className="font-bold text-amber-800 dark:text-amber-300">
                  Recorded Delay Remark ({activeTask.delay_reason || 'Technical issue'})
                </div>
                <p className="text-amber-700 dark:text-amber-200">{activeTask.delay_remark}</p>
                {activeTask.team_leader_review && (
                  <div className="pt-2 mt-2 border-t border-amber-200/60 dark:border-amber-800/40 font-semibold text-slate-700 dark:text-slate-300">
                    Team Leader Review: {activeTask.team_leader_review}
                  </div>
                )}
              </div>
            )}

            {/* Progress Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Progress Workflow:</span>
              <div className="flex items-center gap-2">
                {normalizeStatus(activeTask.status) === 'TODO' && (
                  <button
                    onClick={() => handleUpdateStatus(activeTask.id, 'IN_PROGRESS')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Play className="w-3.5 h-3.5" /> Start Task
                  </button>
                )}
                {normalizeStatus(activeTask.status) === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleUpdateStatus(activeTask.id, 'CODE_REVIEW')}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit for Code Review
                  </button>
                )}
              </div>
            </div>

            {/* Comments Thread */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                Work Comments & Progress Notes ({comments.length})
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <div className="text-slate-400 text-xs text-center py-3">
                    No comments yet. Add notes or update logs below.
                  </div>
                ) : (
                  comments.map((c, i) => (
                    <div key={c.id || i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-xs space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {c.author_name || 'Team Member'}
                        </span>
                        <span>{c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Just now'}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200">{c.comment || c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a progress update or note..."
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* DELAY REMARK MODAL */}
      {isDelayModalOpen && (
        <Modal
          isOpen={isDelayModalOpen}
          onClose={() => setIsDelayModalOpen(false)}
          title="Submit Delay Explanation"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmitDelayRemark} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide an official delay justification for task <strong>{activeTask?.title}</strong>. This remark will be sent directly to your Team Leader.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Delay Reason Category
              </label>
              <select
                value={delayReason}
                onChange={e => setDelayReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Technical issue">Technical issue</option>
                <option value="Dependency blocked">Dependency blocked</option>
                <option value="Scope increase">Scope increase</option>
                <option value="Environment down">Environment down</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Detailed Remark
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explain the impediment and current status..."
                value={delayRemark}
                onChange={e => setDelayRemark(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDelayModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={delaySubmitting || !delayRemark.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition"
              >
                {delaySubmitting ? 'Submitting...' : 'Submit Remark'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
