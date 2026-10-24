import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { Award, CheckCircle2, AlertTriangle, Clock, Plus, Filter, FolderKanban, Target, ShieldCheck, Flag, RefreshCw } from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';

export const MilestoneTracker = ({ onShowToast }) => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    projectName: '',
    category: 'Architecture Phase',
    dueDate: '2026-11-30',
    targetDeliverables: ''
  });

  const fetchProjectsAndMilestones = async () => {
    setLoading(true);
    const headers = getAuthHeaders();

    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`${API_BASE_URL}/projects/`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/sprints/`, { headers }).catch(() => null)
      ]);

      let projs = [];
      if (pRes && pRes.ok) {
        const pData = await pRes.json();
        if (pData.projects && pData.projects.length > 0) {
          projs = pData.projects;
          setProjectsList(projs);
          setFormData(prev => ({
            ...prev,
            projectId: prev.projectId || projs[0].id,
            projectName: prev.projectName || projs[0].name
          }));
        }
      }

      if (sRes && sRes.ok) {
        const sData = await sRes.json();
        const sprints = sData.sprints || [];
        const fetchedMilestones = sprints.map((s) => ({
          id: s.sprint_code || s.code || `MS-${String(s.id).slice(0, 4).toUpperCase()}`,
          real_id: s.id,
          name: s.name,
          category: s.epic_category || (s.goal ? 'Sprint Milestone' : 'Release Gate'),
          project_id: s.project_id || s.projectId,
          project_name: s.project_name || s.projectName || s.project || (projs.find(p => p.id === s.project_id)?.name) || 'Project',
          dueDate: s.end_date || s.endDate || '2026-11-30',
          status: s.status === 'COMPLETED' ? 'ON_TRACK' : ((s.overdue_tasks > 0 || s.overdueTasks > 0) ? 'AT_RISK' : 'ON_TRACK'),
          progress: Math.round(Number(s.completion_percentage || s.progress || 0)),
          completedTasks: Number(s.completed_tasks || s.completedTasks || 0),
          tasks: Number(s.total_tasks || s.totalTasks || 0),
          deliverables: s.goal || s.sprint_goal || ''
        }));
        setMilestones(fetchedMilestones);
      }
    } catch (err) {
      console.error('Error fetching milestones from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndMilestones();
  }, []);

  const handleProjectSelect = (projId) => {
    const found = projectsList.find(p => p.id === projId);
    setFormData(prev => ({
      ...prev,
      projectId: projId,
      projectName: found ? found.name : ''
    }));
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const targetProject = projectsList.find(p => p.id === formData.projectId);
    const projName = formData.projectName || targetProject?.name || 'Project';

    const localMs = {
      id: `MS-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name,
      category: formData.category,
      project_id: formData.projectId,
      project_name: projName,
      dueDate: formData.dueDate,
      status: 'ON_TRACK',
      progress: 0,
      completedTasks: 0,
      tasks: 0,
      deliverables: formData.targetDeliverables
    };

    setMilestones(prev => [localMs, ...prev]);

    // Persist as a milestone sprint in PostgreSQL
    try {
      await fetch(`${API_BASE_URL}/sprints/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: formData.name,
          project_id: formData.projectId,
          goal: formData.targetDeliverables || formData.category,
          end_date: formData.dueDate
        })
      });
      fetchProjectsAndMilestones();
    } catch (err) {
      console.error('Could not persist milestone sprint:', err);
    }

    logAuditEvent({
      user,
      role: user?.role,
      action: 'MILESTONE_CREATE',
      resource: `Created Milestone Checkpoint: ${localMs.name} for ${localMs.project_name}`,
      status: 'SUCCESS'
    });

    if (onShowToast) onShowToast({ type: 'success', title: 'Milestone Created', message: `${localMs.name} recorded in project roadmap.` });
    setIsModalOpen(false);
  };

  const filteredMilestones = milestones.filter(m => {
    return projectFilter === 'ALL' || m.project_id === projectFilter || m.project_name === projectFilter;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Breadcrumb activeTab="Milestones" />
        <div className="flex items-center gap-2">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Projects</option>
              {projectsList.map(p => (
                <option key={p.id} value={p.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Milestone
          </button>

          <button
            onClick={fetchProjectsAndMilestones}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Project Delivery Milestones & Release Gates
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Live release gates, architectural milestones, and delivery checkpoints backed by PostgreSQL sprint entities.
        </p>
      </div>

      {loading && milestones.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          Loading project milestones...
        </div>
      ) : filteredMilestones.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <Flag className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Milestone Checkpoints Found</h4>
          <p className="text-xs max-w-sm mx-auto">
            {projectFilter === 'ALL'
              ? 'No milestones have been recorded yet. Click "New Milestone" above to schedule an architectural release checkpoint.'
              : 'No milestones recorded for the selected project scope.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMilestones.map((ms) => (
            <div
              key={ms.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                    {ms.id}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {ms.project_name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ms.status === 'ON_TRACK'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {ms.status === 'ON_TRACK' ? 'On Track' : 'At Risk'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {ms.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target: {ms.category} • Due: {ms.dueDate}
                </p>
              </div>

              <div className="w-full md:w-56 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-bold text-slate-900 dark:text-white">{ms.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${ms.progress}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  {ms.completedTasks} of {ms.tasks} tasks done
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating Milestone */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Milestone">
        <form onSubmit={handleCreateMilestone} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Milestone Title</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Phase 2: PostgreSQL Quality Gate Integration"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Project</label>
            <select
              value={formData.projectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Architecture Phase">Architecture Phase</option>
                <option value="Security Gate">Security Gate</option>
                <option value="Release Gate">Release Gate</option>
                <option value="Sprint Milestone">Sprint Milestone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deliverables / Goal</label>
            <textarea
              rows={2}
              value={formData.targetDeliverables}
              onChange={(e) => setFormData({ ...formData, targetDeliverables: e.target.value })}
              placeholder="Key outputs expected at this checkpoint..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
            >
              Create Checkpoint
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
