import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { logAuditEvent } from '../../services/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { FolderKanban, Plus, Edit2, Archive, Users, GitBranch, Cpu, Shield, UserCheck } from 'lucide-react';

export const ProjectManagement = ({ onShowToast }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    key: 'PROJ',
    manager: 'Gopika Manoj (PM)',
    lead: 'David Chen',
    status: 'IN_PROGRESS',
    healthScore: 100,
    deadline: '2026-11-30'
  });

  const fetchProjects = async () => {
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/projects/', {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newProj = {
      id: `PROJ-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.name,
      key: formData.key || 'PROJ',
      lead_name: formData.lead,
      status: formData.status,
      health_score: 100,
      progress: 0,
      target_deadline: formData.deadline
    };

    setProjects([newProj, ...projects]);

    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      await fetch('http://127.0.0.1:8000/api/v1/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(newProj)
      });
    } catch (err) {}

    logAuditEvent({
      user,
      role: user?.role,
      action: 'PROJECT_CREATE',
      resource: `Created Project: ${newProj.name}`,
      status: 'SUCCESS'
    });

    if (onShowToast) onShowToast({ type: 'success', title: 'Project Created', message: `${newProj.name} initialized successfully.` });
    setIsModalOpen(false);
    setFormData({ name: '', key: 'PROJ', manager: 'Gopika Manoj (PM)', lead: 'David Chen', status: 'IN_PROGRESS', healthScore: 100, deadline: '2026-11-30' });
  };

  const handleArchive = (proj) => {
    setProjects(prev => prev.filter(p => p.id !== proj.id));
    logAuditEvent({
      user,
      role: user?.role,
      action: 'PROJECT_ARCHIVE',
      resource: `Archived project: ${proj.name}`,
      status: 'SUCCESS'
    });
    if (onShowToast) onShowToast({ type: 'warning', title: 'Project Archived', message: `${proj.name} moved to historical archives.` });
  };

  const columns = [
    {
      key: 'name',
      label: 'Project Name',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">{row?.name || row?.project_name || val || 'Project'}</div>
          <div className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{row?.id || row?.key || 'PROJ'}</div>
        </div>
      )
    },
    {
      key: 'lead',
      label: 'Tech Lead',
      render: (val, row) => (
        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs inline-flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5" />
          {row?.lead_name || row?.lead || val || 'Unassigned Lead'}
        </span>
      )
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (val, row) => {
        const prog = row?.progress ?? val ?? 0;
        return (
          <div className="w-32">
            <div className="flex justify-between text-[10px] mb-1 font-semibold">
              <span>Progress</span>
              <span>{prog}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${prog}%` }} />
            </div>
          </div>
        );
      }
    },
    {
      key: 'healthScore',
      label: 'Health Score',
      render: (val, row) => {
        const score = row?.health_score ?? row?.healthScore ?? val ?? 100;
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            score >= 90 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
          }`}>
            {score} / 100
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
          {row?.status || val || 'IN_PROGRESS'}
        </span>
      )
    },
    {
      key: 'deadline',
      label: 'Target Delivery',
      render: (val, row) => row?.deadline || row?.target_deadline || '2026-11-30'
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleArchive(row)}
            className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"
            title="Archive Project"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      <Breadcrumb activeTab="Projects" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Projects Directory & Lifecycle</h1>
          <p className="text-xs text-slate-500">Initiate projects, assign team leads, track budgets, and manage delivery timelines.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Project
        </button>
      </div>

      <DataTable
        columns={columns}
        data={projects}
        searchPlaceholder="Search projects by name or lead..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize Software Project"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 font-bold">Cancel</button>
            <button onClick={handleCreate} className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">Create Project</button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Project Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
              placeholder="e.g. Aureon SaaS System"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Project Code Key</label>
              <input
                type="text"
                required
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold"
                placeholder="e.g. PROJ"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Target Deadline</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
