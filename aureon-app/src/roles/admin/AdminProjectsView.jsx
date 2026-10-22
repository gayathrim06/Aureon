import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { 
  FolderKanban, Plus, RefreshCw, CheckSquare, Activity, 
  Layers, ArrowRight, ShieldCheck, Clock, ExternalLink, Filter 
} from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';

export const AdminProjectsView = ({ onNavigate }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [sortByHealth, setSortByHealth] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchLiveProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/projects/`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const liveList = data.projects || [];
        const formatted = liveList.map(p => ({
          id: p.id,
          key: p.id?.substring(0, 8) || 'PROJ',
          name: p.name || p.project_name || 'Project',
          description: p.description || 'Enterprise software initiative',
          manager: p.manager_name || 'Unassigned PM',
          lead: p.lead_name || 'Unassigned Lead',
          status: p.status || 'IN_PROGRESS',
          progress: p.progress || (p.status === 'COMPLETED' ? 100 : (p.status === 'PLANNING' ? 15 : 65)),
          healthScore: p.health_score !== undefined && p.health_score !== null ? p.health_score : 90,
          deadline: p.target_deadline || p.deadline || 'Ongoing',
          startDate: p.start_date || '2026-09-01',
          repoName: p.github_repo_name || (p.repository && p.repository.name) || 'aureon-maker/repository',
          repoUrl: p.github_repo_url || (p.repository && p.repository.url) || null,
          memberCount: Array.isArray(p.team_members) ? p.team_members.length : (Array.isArray(p.members) ? p.members.length : 0)
        }));
        setProjects(formatted);
      }
    } catch (err) {
      console.warn('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProjects();
  }, []);

  const handleNav = (tab) => {
    if (typeof onNavigate === 'function') {
      onNavigate(tab);
    }
  };

  const totalCount = projects.length;
  const inProgressCount = projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE').length;
  const completedCount = projects.filter(p => p.status === 'COMPLETED' || p.status === 'DONE').length;
  const avgHealth = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + p.healthScore, 0) / projects.length) 
    : 90;

  const filteredProjects = React.useMemo(() => {
    let list = [...projects];
    if (selectedStatusFilter !== 'ALL') {
      list = list.filter(p => {
        if (selectedStatusFilter === 'ACTIVE') return p.status === 'IN_PROGRESS' || p.status === 'ACTIVE';
        return p.status === selectedStatusFilter;
      });
    }
    if (sortByHealth) {
      list.sort((a, b) => b.healthScore - a.healthScore);
    }
    return list;
  }, [projects, selectedStatusFilter, sortByHealth]);

  const statCards = [
    {
      id: 'total',
      label: 'Total Projects',
      value: totalCount,
      sub: `${inProgressCount} Active • ${completedCount} Completed`,
      hint: 'Click to show all →',
      icon: FolderKanban,
      color: 'border-l-blue-500 hover:border-l-blue-600',
      action: () => { setSelectedStatusFilter('ALL'); setSortByHealth(false); }
    },
    {
      id: 'active',
      label: 'In Progress',
      value: inProgressCount,
      sub: 'Active Iterations',
      hint: 'Filter active only →',
      icon: Activity,
      color: 'border-l-indigo-500 hover:border-l-indigo-600',
      action: () => setSelectedStatusFilter(prev => prev === 'ACTIVE' ? 'ALL' : 'ACTIVE')
    },
    {
      id: 'health',
      label: 'Avg Health Score',
      value: `${avgHealth}/100`,
      sub: sortByHealth ? 'Sorted by Highest Health' : 'Quality & Test Metrics',
      hint: 'Click to toggle sort →',
      icon: ShieldCheck,
      color: 'border-l-emerald-500 hover:border-l-emerald-600',
      action: () => setSortByHealth(prev => !prev)
    },
    {
      id: 'completed',
      label: 'Completed',
      value: completedCount,
      sub: 'Finished Milestones',
      hint: 'Filter completed only →',
      icon: CheckSquare,
      color: 'border-l-purple-500 hover:border-l-purple-600',
      action: () => setSelectedStatusFilter(prev => prev === 'COMPLETED' ? 'ALL' : 'COMPLETED')
    }
  ];

  const columns = [
    { 
      key: 'name', 
      label: 'Project', 
      render: (val, row) => (
        <button
          type="button"
          onClick={() => setSelectedProject(row)}
          className="text-left group cursor-pointer"
        >
          <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
            {val}
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
          </div>
          <div className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
            {row.key} • {row.repoName}
          </div>
        </button>
      ) 
    },
    { 
      key: 'manager', 
      label: 'Project Manager',
      render: (val) => (
        <span className="font-semibold text-xs text-purple-700 dark:text-purple-300">
          👤 {val}
        </span>
      )
    },
    { 
      key: 'lead', 
      label: 'Technical Lead',
      render: (val) => (
        <span className="font-semibold text-xs text-blue-700 dark:text-blue-300">
          🛡️ {val}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (val) => {
        const c = val === 'IN_PROGRESS' || val === 'ACTIVE'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200' 
          : val === 'PLANNING' 
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200' 
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200';
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${c}`}>
            {val.replace('_',' ')}
          </span>
        );
      }
    },
    { 
      key: 'progress', 
      label: 'Completion', 
      render: (val, row) => (
        <div 
          onClick={() => setSelectedProject(row)}
          className="w-28 cursor-pointer group"
          title="Click to inspect project progress"
        >
          <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-700 dark:text-slate-300">
            <span>{val}%</span>
            <span className="text-slate-400 text-[9px] font-mono">Progress</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${val === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
              style={{ width: `${val}%` }} 
            />
          </div>
        </div>
      ) 
    },
    { 
      key: 'healthScore', 
      label: 'Health', 
      render: (val) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
          val >= 90 
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200' 
            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200'
        }`}>
          {val}/100
        </span>
      ) 
    },
    { 
      key: 'deadline', 
      label: 'Target Deadline',
      render: (val) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {val ? String(val).split('T')[0] : 'Ongoing'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setSelectedProject(row)}
          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
        >
          Details <ArrowRight className="w-3 h-3" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Projects Directory" />
      
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Global Projects Directory & Repository Mapping
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform-wide governance of enterprise projects, health metrics, team allocation, and Git repository links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLiveProjects}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Refresh Projects"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => handleNav('Backlog')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            Open Backlog
          </button>
        </div>
      </div>

      {/* Top 4 Interactive KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isSelected = (card.id === 'active' && selectedStatusFilter === 'ACTIVE') ||
                             (card.id === 'completed' && selectedStatusFilter === 'COMPLETED') ||
                             (card.id === 'health' && sortByHealth);
          return (
            <button
              key={card.id}
              type="button"
              onClick={card.action}
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 ${card.color} border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 text-left cursor-pointer group flex flex-col justify-between ${
                isSelected ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{card.label}</span>
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 warm:text-[#342314] mt-2">
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-medium">
                  {card.sub}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                <span>{card.hint}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main DataTable */}
      <DataTable 
        columns={columns} 
        data={filteredProjects} 
        searchPlaceholder="Search projects by name, manager, lead, repository..." 
      />

      {/* Project Details Modal */}
      {selectedProject && (
        <Modal
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          title={`Project: ${selectedProject.name}`}
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {selectedProject.name}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {selectedProject.status}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                {selectedProject.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Project Manager
                </span>
                <div className="font-bold text-slate-900 dark:text-white">
                  👤 {selectedProject.manager}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Technical Lead
                </span>
                <div className="font-bold text-slate-900 dark:text-white">
                  🛡️ {selectedProject.lead}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Git Lite Repository
                </span>
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                  {selectedProject.repoName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedProject(null); handleNav('Repositories'); }}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
              >
                Inspect Git <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setSelectedProject(null); handleNav('Backlog'); }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
              >
                Open Backlog <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
