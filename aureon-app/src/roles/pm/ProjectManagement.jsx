import React, { useState } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { initialProjects } from '../../services/mockData';
import { logAuditEvent } from '../../services/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { FolderKanban, Plus, Edit2, Archive, Users, GitBranch, Cpu } from 'lucide-react';

export const ProjectManagement = ({ onShowToast }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    manager: 'Sarah Jenkins',
    lead: 'David Chen',
    status: 'IN_PROGRESS',
    healthScore: 95,
    budgetSpent: '$50,000 / $100,000',
    deadline: '2026-12-31'
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const newProj = {
      id: `proj_${Date.now()}`,
      ...formData,
      progress: 10,
      repositories: [`aureon/${formData.key.toLowerCase()}`],
      activeSprint: 'Sprint 1 - Initializing'
    };

    setProjects([newProj, ...projects]);
    logAuditEvent({
      user,
      role: user?.role,
      action: 'PROJECT_CREATE',
      resource: `Created Project: ${newProj.name} (${newProj.key})`,
      status: 'SUCCESS'
    });

    onShowToast && onShowToast({ type: 'success', title: 'Project Created', message: `${newProj.name} initialized successfully.` });
    setIsModalOpen(false);
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
    onShowToast && onShowToast({ type: 'warning', title: 'Project Archived', message: `${proj.name} moved to historical archives.` });
  };

  const columns = [
    {
      key: 'name',
      label: 'Project Name',
      render: (val, row) => (
        <div>
          <div className="font-bold text-gray-900 dark:text-gray-100">{val}</div>
          <div className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{row.key}</div>
        </div>
      )
    },
    { key: 'lead', label: 'Tech Lead' },
    {
      key: 'progress',
      label: 'Progress',
      render: (val) => (
        <div className="w-32">
          <div className="flex justify-between text-[10px] mb-1 font-semibold">
            <span>Progress</span>
            <span>{val}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${val}%` }} />
          </div>
        </div>
      )
    },
    {
      key: 'healthScore',
      label: 'Health Score',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          val >= 90 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
        }`}>
          {val} / 100
        </span>
      )
    },
    { key: 'activeSprint', label: 'Active Sprint' },
    { key: 'deadline', label: 'Target Delivery' },
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
    <div className="space-y-6">
      <Breadcrumb activeTab="Projects" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Projects Directory & Lifecycle</h1>
          <p className="text-xs text-gray-500">Initiate projects, assign team leads, track budgets, and manage delivery timelines.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Create New Project
        </button>
      </div>

      <DataTable
        columns={columns}
        data={projects}
        searchPlaceholder="Search projects by key, name, lead..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize Software Project"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400">Cancel</button>
            <button onClick={handleCreate} className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">Create Project</button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Project Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              placeholder="e.g. Aureon Microservices"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Project Key Prefix</label>
              <input
                type="text"
                required
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-mono"
                placeholder="e.g. AMS"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Target Deadline</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
