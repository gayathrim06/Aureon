import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { Award, CheckCircle2, AlertTriangle, Clock, Plus, Filter, FolderKanban, Target, ShieldCheck, Flag } from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';

// Live PostgreSQL milestones and projects directory

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
    dueDate: '2026-10-15',
    targetDeliverables: ''
  });

  const fetchProjectsAndMilestones = async () => {
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
          goal: formData.targetDeliverables || 'Strategic milestone deliverables.',
          startDate: new Date().toISOString().split('T')[0],
          endDate: formData.dueDate || '2026-11-30',
          status: 'PLANNED',
          epic_category: formData.category
        })
      });
      fetchProjectsAndMilestones();
    } catch (err) {
      console.error('Error persisting milestone:', err);
    }

    logAuditEvent({
      user,
      role: user?.role,
      action: 'MILESTONE_CREATE',
      resource: `Created Milestone Checkpoint: ${localMs.name} for ${projName}`,
      status: 'SUCCESS'
    });

    if (onShowToast) onShowToast({ type: 'success', title: 'Milestone Created', message: `${localMs.name} added to project roadmap.` });
    setIsModalOpen(false);
  };

  const filteredMilestones = milestones.filter(m => {
    if (projectFilter === 'ALL') return true;
    const target = String(projectFilter).toLowerCase();
    const pid = String(m.project_id || '').toLowerCase();
    const pname = String(m.project_name || '').toLowerCase();
    return pid === target || pname === target;
  });

  const statusIcons = {
    ON_TRACK: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    AT_RISK: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    DELAYED: <Clock className="w-4 h-4 text-rose-500" />
  };

  const statusColors = {
    ON_TRACK: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
    AT_RISK: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
    DELAYED: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Milestone Tracker" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Milestone Checkpoint & Release Gate Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            PM Governance: Track major project checkpoints, release gates, and target delivery completion percentages across projects.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Milestone Checkpoint
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <Filter className="w-4 h-4 text-indigo-500" /> Filter Milestones By Project:
        </div>

        <div>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="p-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
          >
            <option value="ALL">All Projects</option>
            {projectsList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-4">
        {filteredMilestones.map(m => (
          <div key={m.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {statusIcons[m.status]}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{m.id}</span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white warm:text-[#342314]">{m.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                    <span>📁 Project: <strong>{m.project_name || 'Aureon SaaS'}</strong></span>
                    <span>• Category: <strong>{m.category}</strong></span>
                    <span>• Target Due: <strong>{m.dueDate}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusColors[m.status]}`}>
                  {m.status.replace('_',' ')}
                </span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{m.progress}%</span>
              </div>
            </div>

            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  m.status === 'AT_RISK' ? 'bg-amber-500' : m.status === 'DELAYED' ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${m.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>{m.completedTasks} of {m.tasks} checkpoint tasks completed</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{m.tasks - m.completedTasks} tasks remaining</span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MILESTONE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="PM Governance: Create Project Milestone Checkpoint">
        <form onSubmit={handleCreateMilestone} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">1. Milestone Checkpoint Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Phase 1: Core System Architecture & OAuth Gate"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">2. Target Project *</label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              >
                {projectsList.length === 0 ? (
                  <option value="">No projects created yet</option>
                ) : (
                  projectsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">3. Checkpoint Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              >
                <option value="Architecture Phase">🏛️ Architecture Phase</option>
                <option value="Security Gate">🛡️ Security & Compliance Gate</option>
                <option value="Release Gate">🚀 Production Release Gate</option>
                <option value="Client Demo Gate">📊 Client Demo & Acceptance Gate</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Target Checkpoint Due Date</label>
            <input
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Milestone Key Deliverables & Criteria</label>
            <textarea
              rows={2}
              placeholder="Describe major deliverables required to pass this milestone checkpoint..."
              value={formData.targetDeliverables}
              onChange={(e) => setFormData({ ...formData, targetDeliverables: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-2 text-xs font-bold text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              Create Milestone Checkpoint
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
