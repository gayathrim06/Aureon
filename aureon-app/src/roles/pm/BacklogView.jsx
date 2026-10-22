import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import {
  ListTodo,
  Plus,
  ArrowRight,
  Layers,
  Search,
  Filter,
  CheckSquare,
  AlertTriangle,
  Clock,
  User,
  Trash2,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { TaskSkillRecommendationModal } from '../../components/common/TaskSkillRecommendationModal';

export const BacklogView = ({ onShowToast, onNavigate }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Skill Recommendation Modal
  const [recommendingTask, setRecommendingTask] = useState(null);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByEffort, setSortByEffort] = useState(false);

  // Selection for Sprint Planning
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [targetSprintId, setTargetSprintId] = useState('');
  const [planningSubmitting, setPlanningSubmitting] = useState(false);

  // Create Backlog Task Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRequiredSkills, setNewRequiredSkills] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newType, setNewType] = useState('Task');
  const [newHours, setNewHours] = useState('4.0');
  const [newProjectId, setNewProjectId] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Fetch Backlog items, Projects, and Sprints
  const fetchBacklogData = async () => {
    try {
      setLoading(true);

      // 1. Projects
      const projRes = await fetch(`${API_BASE_URL}/projects/`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      let fetchedProjects = [];
      if (projRes.ok) {
        const pData = await projRes.json();
        fetchedProjects = pData.projects || [];
        setProjects(fetchedProjects);
        if (fetchedProjects.length > 0 && !newProjectId) {
          setNewProjectId(fetchedProjects[0].id);
        }
      }

      // 2. Sprints
      const spRes = await fetch(`${API_BASE_URL}/sprints/`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (spRes.ok) {
        const spData = await spRes.json();
        const activeSprints = (spData.sprints || []).filter(s => s.status !== 'COMPLETED');
        setSprints(activeSprints);
        if (activeSprints.length > 0 && !targetSprintId) {
          setTargetSprintId(activeSprints[0].id);
        }
      }

      // 3. Backlog tasks (sprint_id IS NULL)
      let backlogUrl = `${API_BASE_URL}/tasks/backlog`;
      if (selectedProjectId !== 'ALL') {
        backlogUrl += `?project_id=${selectedProjectId}`;
      }
      const backRes = await fetch(backlogUrl, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (backRes.ok) {
        const bData = await backRes.json();
        setTasks(bData.tasks || bData.backlog_tasks || []);
      }
    } catch (err) {
      console.warn('Failed to load backlog data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBacklogData();
  }, [selectedProjectId]);

  // Toggle selection
  const handleToggleSelect = (taskId) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSelectAll = (filteredTasks) => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  // Create Backlog Task
  const handleCreateBacklogTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newProjectId) return;

    try {
      setCreateSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          priority: newPriority,
          ticket_type: newType,
          estimated_hours: parseFloat(newHours) || 4.0,
          project_id: newProjectId,
          required_skills: newRequiredSkills.trim(),
          is_backlog: true,
          status: 'BACKLOG'
        })
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewRequiredSkills('');
        setNewPriority('MEDIUM');
        setNewHours('4.0');
        await fetchBacklogData();
        onShowToast && onShowToast({
          type: 'success',
          title: 'Backlog Item Created',
          message: 'Task added to product backlog for future sprint planning.'
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        onShowToast && onShowToast({
          type: 'error',
          title: 'Creation Failed',
          message: errData.message || 'Could not create backlog task.'
        });
      }
    } catch (err) {
      console.error('Task creation failed:', err);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Move selected tasks to chosen sprint
  const handlePlanTasksIntoSprint = async (e) => {
    e.preventDefault();
    if (!targetSprintId || selectedTaskIds.size === 0) return;

    try {
      setPlanningSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/sprints/${targetSprintId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          task_ids: Array.from(selectedTaskIds)
        })
      });

      if (res.ok) {
        const targetSprint = sprints.find(s => String(s.id) === String(targetSprintId));
        setIsPlanModalOpen(false);
        setSelectedTaskIds(new Set());
        await fetchBacklogData();
        onShowToast && onShowToast({
          type: 'success',
          title: 'Sprint Planning Completed',
          message: `${selectedTaskIds.size} task(s) successfully scheduled into sprint '${targetSprint?.name || 'Sprint'}' as 'To Do'.`
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        onShowToast && onShowToast({
          type: 'error',
          title: 'Planning Failed',
          message: errData.message || 'Could not move tasks to sprint.'
        });
      }
    } catch (err) {
      console.error('Sprint planning movement error:', err);
    } finally {
      setPlanningSubmitting(false);
    }
  };

  // Delete backlog task
  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this backlog item?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setSelectedTaskIds(prev => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
        onShowToast && onShowToast({
          type: 'success',
          title: 'Task Removed',
          message: 'Backlog item deleted.'
        });
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchKey = (t.task_key || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchKey) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortByEffort) {
      return (parseFloat(b.estimated_hours) || 0) - (parseFloat(a.estimated_hours) || 0);
    }
    return 0;
  });

  const highPriorityCount = tasks.filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH').length;
  const totalEffortHours = tasks.reduce((sum, t) => sum + (parseFloat(t.estimated_hours) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <Breadcrumb activeTab="Backlog" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white warm:text-[#342314] flex items-center gap-2 mt-1">
            <ListTodo className="w-6 h-6 text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]" />
            Product Backlog
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-0.5">
            Project work items not yet scheduled into an active sprint. Select tasks to plan into upcoming sprint cycles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-center">
          {selectedTaskIds.size > 0 && (
            <button
              type="button"
              onClick={() => {
                if (sprints.length > 0 && !targetSprintId) {
                  setTargetSprintId(sprints[0].id);
                }
                setIsPlanModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition cursor-pointer active:scale-95"
            >
              <Layers className="w-3.5 h-3.5" />
              Plan into Sprint ({selectedTaskIds.size})
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Backlog Task
          </button>

          <button
            type="button"
            onClick={fetchBacklogData}
            disabled={loading}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Refresh Backlog"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* METRIC CARDS - Fully Interactive Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => { setSelectedPriority('ALL'); setSearchQuery(''); setSortByEffort(false); }}
          className={`w-full text-left p-4 rounded-xl bg-white dark:bg-slate-800/80 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-700/80 warm:border-[#cbb68e] shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer group flex flex-col justify-between ${
            selectedPriority === 'ALL' && !sortByEffort ? 'ring-2 ring-indigo-500 shadow-sm' : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Backlog Items</span>
              <ListTodo className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-1">{tasks.length}</div>
            <span className="text-[10px] text-slate-400 warm:text-[#69523c]">Uncommitted work items</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
            <span>{selectedPriority === 'ALL' && !sortByEffort ? '● All Items' : 'Show all items'}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedPriority(prev => prev === 'HIGH' ? 'ALL' : 'HIGH')}
          className={`w-full text-left p-4 rounded-xl bg-white dark:bg-slate-800/80 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-700/80 warm:border-[#cbb68e] shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer group flex flex-col justify-between ${
            selectedPriority === 'HIGH' ? 'ring-2 ring-orange-500 shadow-sm' : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">High / Critical Items</span>
              <AlertTriangle className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{highPriorityCount}</div>
            <span className="text-[10px] text-slate-400 warm:text-[#69523c]">Need prioritization</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center justify-between">
            <span>{selectedPriority === 'HIGH' ? '● Filter Active (Reset)' : 'Filter high priority'}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSortByEffort(prev => !prev)}
          className={`w-full text-left p-4 rounded-xl bg-white dark:bg-slate-800/80 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-700/80 warm:border-[#cbb68e] shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer group flex flex-col justify-between ${
            sortByEffort ? 'ring-2 ring-indigo-500 shadow-sm' : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Estimated Total Effort</span>
              <Clock className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalEffortHours.toFixed(1)}h</div>
            <span className="text-[10px] text-slate-400 warm:text-[#69523c]">Total estimated backlog hours</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
            <span>{sortByEffort ? '● Sorted by Effort' : 'Click to sort by effort'}</span>
            <span className="group-hover:translate-x-1 transition-transform">↕</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedTaskIds.size > 0) {
              if (sprints.length > 0 && !targetSprintId) {
                setTargetSprintId(sprints[0].id);
              }
              setIsPlanModalOpen(true);
            } else {
              handleSelectAll(filteredTasks);
            }
          }}
          className={`w-full text-left p-4 rounded-xl bg-white dark:bg-slate-800/80 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-700/80 warm:border-[#cbb68e] shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer group flex flex-col justify-between ${
            selectedTaskIds.size > 0 ? 'ring-2 ring-emerald-500 shadow-sm' : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Selected for Planning</span>
              <CheckSquare className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{selectedTaskIds.size}</div>
            <span className="text-[10px] text-slate-400 warm:text-[#69523c]">Ready to move to sprint</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>{selectedTaskIds.size > 0 ? 'Plan into sprint now →' : 'Select all to plan →'}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search backlog tasks by title, key, or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent border-none focus:outline-hidden text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-[11px] font-semibold text-slate-400">Project:</span>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-[11px] font-semibold text-slate-400">Priority:</span>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* BACKLOG TASKS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
            Loading project backlog...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <ListTodo className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Backlog Tasks Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All tasks are committed to sprints or no items match your active filters. Click "+ Create Backlog Task" to add new items.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0}
                      onChange={() => handleSelectAll(filteredTasks)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Task Title & Description</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Effort</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredTasks.map(task => {
                  const isSelected = selectedTaskIds.has(task.id);
                  return (
                    <tr
                      key={task.id}
                      onClick={() => handleToggleSelect(task.id)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition ${
                        isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(task.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {task.task_key || `TASK-${String(task.id).slice(0, 4)}`}
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <div className="font-bold text-slate-900 dark:text-white">{task.title}</div>
                        {task.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' :
                          task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400' :
                          task.priority === 'LOW' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}>
                          {task.priority || 'MEDIUM'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {task.ticket_type || 'Task'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {task.estimated_hours ? `${task.estimated_hours}h` : '4.0h'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {task.assignee_name || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Backlog
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setRecommendingTask(task)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                            title="Recommend Best Developer (Skills & Workload Match)"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-500" /> Recommend
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTaskIds(new Set([task.id]));
                              if (sprints.length > 0 && !targetSprintId) {
                                setTargetSprintId(sprints[0].id);
                              }
                              setIsPlanModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition cursor-pointer shadow-xs active:scale-95"
                          >
                            Plan into Sprint
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Delete Backlog Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE BACKLOG TASK MODAL */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Product Backlog Task"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleCreateBacklogTask} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Project *
              </label>
              <select
                required
                value={newProjectId}
                onChange={e => setNewProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Task Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Implement Payment Gateway Integration"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Description / Acceptance Criteria
              </label>
              <textarea
                rows={3}
                placeholder="Outline the specifications and requirements for this deliverable..."
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Required Technical Skills (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. React, Python, PostgreSQL"
                value={newRequiredSkills}
                onChange={e => setNewRequiredSkills(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Type
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Feature">Feature</option>
                  <option value="Task">Task</option>
                  <option value="Bug">Bug</option>
                  <option value="Improvement">Improvement</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Estimated (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newHours}
                  onChange={e => setNewHours(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSubmitting || !newTitle.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition"
              >
                {createSubmitting ? 'Saving...' : 'Add to Backlog'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* PLAN INTO SPRINT MODAL */}
      {isPlanModalOpen && (
        <Modal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          title="Plan Backlog Tasks into Sprint"
          maxWidth="max-w-md"
        >
          <form onSubmit={handlePlanTasksIntoSprint} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              You are moving <strong>{selectedTaskIds.size} task(s)</strong> from the Product Backlog into a target sprint. Their status will transition to <strong>To Do</strong>.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Select Target Sprint *
              </label>
              {sprints.length === 0 ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                  No active or planned sprints available. Please create a sprint first in Sprint Planning.
                </div>
              ) : (
                <select
                  required
                  value={targetSprintId}
                  onChange={e => setTargetSprintId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  {sprints.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status}) — {s.start_date || 'N/A'} to {s.end_date || 'N/A'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={planningSubmitting || !targetSprintId || sprints.length === 0}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition"
              >
                {planningSubmitting ? 'Planning...' : 'Commit to Sprint'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Skill-Based Task Recommendation Modal */}
      {recommendingTask && (
        <TaskSkillRecommendationModal
          task={recommendingTask}
          isOpen={Boolean(recommendingTask)}
          onClose={() => setRecommendingTask(null)}
          onConfirmed={(assigned) => {
            fetchBacklogData();
            if (onShowToast) {
              onShowToast({
                type: 'success',
                title: 'Developer Assigned via Recommendation',
                message: `Task successfully assigned to ${assigned.user_name || 'selected candidate'}.`
              });
            }
          }}
        />
      )}
    </div>
  );
};
