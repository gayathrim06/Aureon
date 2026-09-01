import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { Layers, Plus, CheckCircle2, Clock, Activity, FolderKanban, Users, Calendar, ShieldCheck, Filter } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SprintPlanner = ({ onShowToast }) => {
  const { user } = useAuth();
  const [sprints, setSprints] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState(null);

  // Filters
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');

  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    projectName: '',
    assignedTeam: 'Frontend Development Team',
    teamLeadName: 'Krishna Deepesh (Tech Lead)',
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    goal: ''
  });

  // Teams / Departments list
  const availableTeams = [
    { id: 'team_fe', name: 'Frontend Development Team', lead: 'Krishna Deepesh (Tech Lead)' },
    { id: 'team_be', name: 'Backend & Microservices Team', lead: 'David Chen (Lead Architect)' },
    { id: 'team_qa', name: 'QA & Test Automation Team', lead: 'Venu QA (QA Lead)' },
    { id: 'team_devops', name: 'DevOps & Cloud Infra Team', lead: 'Alex Rivera (DevOps Lead)' }
  ];

  const fetchSprintsAndProjects = async () => {
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

    try {
      const [spRes, prRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/sprints/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/projects/', { headers })
      ]);

      let fetchedProjects = [];
      if (prRes.ok) {
        const pData = await prRes.json();
        fetchedProjects = pData.projects || [];
        setProjectsList(fetchedProjects);
        if (fetchedProjects.length > 0 && !formData.projectId) {
          setFormData(prev => ({
            ...prev,
            projectId: fetchedProjects[0].id,
            projectName: fetchedProjects[0].name
          }));
        }
      }

      if (spRes.ok) {
        const sData = await spRes.json();
        const apiSprints = sData.sprints || [];
        setSprints(apiSprints);
        if (apiSprints.length > 0) setSelectedSprint(apiSprints[0]);
      }
    } catch (err) {
      setSprints([]);
    }
  };

  useEffect(() => {
    fetchSprintsAndProjects();
  }, []);

  const handleProjectSelect = (projId) => {
    const found = projectsList.find(p => p.id === projId);
    setFormData(prev => ({
      ...prev,
      projectId: projId,
      projectName: found ? found.name : ''
    }));
  };

  const handleTeamSelect = (teamName) => {
    const found = availableTeams.find(t => t.name === teamName);
    setFormData(prev => ({
      ...prev,
      assignedTeam: teamName,
      teamLeadName: found ? found.lead : ''
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newSprint = {
      id: `SPR-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name,
      project_id: formData.projectId,
      project_name: formData.projectName || (projectsList.find(p => p.id === formData.projectId)?.name || 'General System'),
      assigned_team: formData.assignedTeam,
      team_lead: formData.teamLeadName,
      startDate: formData.startDate,
      endDate: formData.endDate,
      goal: formData.goal || 'Deliver sprint features on schedule.',
      status: 'PLANNING',
      totalTasks: 0,
      completedTasks: 0,
      burnDownData: [
        { day: 'Day 1', remaining: 20, target: 20 },
        { day: 'Day 5', remaining: 15, target: 14 },
        { day: 'Day 10', remaining: 8, target: 7 },
        { day: 'Day 14', remaining: 0, target: 0 }
      ]
    };

    setSprints([newSprint, ...sprints]);
    setSelectedSprint(newSprint);

    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      await fetch('http://127.0.0.1:8000/api/v1/sprints/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(newSprint)
      });
    } catch (err) {}

    logAuditEvent({
      user,
      role: user?.role,
      action: 'SPRINT_CREATE',
      resource: `Created Sprint: ${newSprint.name} for ${newSprint.project_name} (${newSprint.assigned_team})`,
      status: 'SUCCESS'
    });

    if (onShowToast) onShowToast({ type: 'success', title: 'Sprint Initialized', message: `${newSprint.name} created for ${newSprint.assigned_team}.` });
    setIsModalOpen(false);
    setFormData({
      name: '',
      projectId: projectsList[0]?.id || '',
      projectName: projectsList[0]?.name || '',
      assignedTeam: 'Frontend Development Team',
      teamLeadName: 'Krishna Deepesh (Tech Lead)',
      startDate: '2026-09-01',
      endDate: '2026-09-15',
      goal: ''
    });
  };

  const filteredSprints = sprints.filter(sp => {
    const matchProj = projectFilter === 'ALL' || sp.project_id === projectFilter || sp.project_name === projectFilter;
    const matchTeam = teamFilter === 'ALL' || sp.assigned_team === teamFilter;
    return matchProj && matchTeam;
  });

  const statusColors = {
    ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
    COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
    PLANNING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Sprint Planner" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            Sprint Planner & Team Backlog Allocation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            PM Governance: Define sprints for specific projects and specify which team / team lead is responsible for sprint deliverables.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Team Sprint
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <Filter className="w-4 h-4 text-indigo-500" /> Filter Sprints By:
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mr-2">Project:</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="p-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
            >
              <option value="ALL">All Projects ({projectsList.length})</option>
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mr-2">Target Team:</label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="p-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
            >
              <option value="ALL">All Teams</option>
              {availableTeams.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Burndown Velocity Chart */}
      {selectedSprint && selectedSprint.burnDownData && selectedSprint.burnDownData.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {selectedSprint.name} — Burndown Velocity & Delivery Progress
              </h3>
              <p className="text-xs text-slate-500">
                Target Project: <strong>{selectedSprint.project_name || 'Aureon'}</strong> • Team: <strong>{selectedSprint.assigned_team || 'Development Team'}</strong>
              </p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${statusColors[selectedSprint.status] || 'bg-indigo-100 text-indigo-700'}`}>
              {selectedSprint.status}
            </span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedSprint.burnDownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Line type="monotone" dataKey="remaining" stroke="#6366f1" strokeWidth={3} name="Actual Remaining Tasks" />
                <Line type="monotone" dataKey="target" stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={2} name="Target Guideline" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sprints Grid */}
      {filteredSprints.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-extrabold">No Team Sprints Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click <strong>"Create New Team Sprint"</strong> to create a sprint, select its target project, and assign it to a specific team (Frontend, Backend, QA, DevOps).
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
          >
            Create First Sprint Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSprints.map(sp => (
            <div
              key={sp.id}
              onClick={() => setSelectedSprint(sp)}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs cursor-pointer transition-all hover:shadow-md space-y-3 ${
                selectedSprint?.id === sp.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${statusColors[sp.status] || 'bg-indigo-100 text-indigo-700'}`}>
                  {sp.status}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">{sp.startDate || '2026-09-01'} → {sp.endDate || '2026-09-15'}</span>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{sp.name}</h4>
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  📁 Project: {sp.project_name || 'Aureon SaaS'}
                </div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                  👥 Team: {sp.assigned_team || 'Development Team'} ({sp.team_lead || 'Krishna Deepesh'})
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-medium line-clamp-2">{sp.goal}</p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {sp.completedTasks || 0} Finished</span>
                  <span className="text-indigo-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {(sp.totalTasks || 0) - (sp.completedTasks || 0)} Remaining</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${sp.totalTasks > 0 ? ((sp.completedTasks / sp.totalTasks) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PM SPRINT CREATION MODAL WITH PROJECT & TEAM SELECTORS */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="PM Governance: Create Sprint & Assign Target Team">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">1. Sprint Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              placeholder="e.g. Sprint 1 - Core Auth & Gateway"
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
                  <option value="">No projects created yet (Create Project first)</option>
                ) : (
                  projectsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">3. Assigned Team & Team Lead *</label>
              <select
                required
                value={formData.assignedTeam}
                onChange={(e) => handleTeamSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              >
                {availableTeams.map(t => (
                  <option key={t.id} value={t.name}>{t.name} ({t.lead})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Sprint Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Sprint End Date</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Sprint Deliverable Goals & Scope</label>
            <textarea
              rows={3}
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
              placeholder="Specify sprint technical goals and feature deliverables for the team..."
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
              Initialize Team Sprint
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
