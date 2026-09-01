import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { Award, CheckCircle2, AlertTriangle, Clock, Plus, Filter, FolderKanban, Target, ShieldCheck, Flag } from 'lucide-react';

export const MilestoneTracker = ({ onShowToast }) => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
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
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

    try {
      const pRes = await fetch('http://127.0.0.1:8000/api/v1/projects/', { headers });
      if (pRes.ok) {
        const pData = await pRes.json();
        const projs = pData.projects || [];
        setProjectsList(projs);
        if (projs.length > 0 && !formData.projectId) {
          setFormData(prev => ({
            ...prev,
            projectId: projs[0].id,
            projectName: projs[0].name
          }));
        }
      }
    } catch (err) {}

    // Default Baseline Milestones
    setMilestones([
      { id: 'MS-101', name: 'Phase 1: Core System Architecture & Auth Gate', category: 'Architecture Phase', project_name: 'Aureon SaaS', dueDate: '2026-09-30', status: 'ON_TRACK', progress: 65, completedTasks: 13, tasks: 20 },
      { id: 'MS-102', name: 'Phase 2: SonarQube & Vulnerability Integration', category: 'Security Gate', project_name: 'Aureon SaaS', dueDate: '2026-10-31', status: 'ON_TRACK', progress: 30, completedTasks: 6, tasks: 20 },
      { id: 'MS-103', name: 'Phase 3: Production Release Candidate 1.0', category: 'Release Gate', project_name: 'Aureon SaaS', dueDate: '2026-11-30', status: 'ON_TRACK', progress: 0, completedTasks: 0, tasks: 25 }
    ]);
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

  const handleCreateMilestone = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newMs = {
      id: `MS-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name,
      category: formData.category,
      project_id: formData.projectId,
      project_name: formData.projectName || (projectsList.find(p => p.id === formData.projectId)?.name || 'Aureon SaaS'),
      dueDate: formData.dueDate,
      status: 'ON_TRACK',
      progress: 0,
      completedTasks: 0,
      tasks: 10,
      deliverables: formData.targetDeliverables
    };

    setMilestones([newMs, ...milestones]);

    logAuditEvent({
      user,
      role: user?.role,
      action: 'MILESTONE_CREATE',
      resource: `Created Milestone Checkpoint: ${newMs.name} for ${newMs.project_name}`,
      status: 'SUCCESS'
    });

    if (onShowToast) onShowToast({ type: 'success', title: 'Milestone Created', message: `${newMs.name} added to project roadmap.` });
    setIsModalOpen(false);
  };

  const filteredMilestones = milestones.filter(m => {
    return projectFilter === 'ALL' || m.project_id === projectFilter || m.project_name === projectFilter;
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
