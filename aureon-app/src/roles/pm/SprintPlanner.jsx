import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { Layers, Plus, CheckCircle2, Clock, Activity, FolderKanban, Users, Calendar, ShieldCheck, Filter, Target, Zap, TrendingUp, Flag } from 'lucide-react';
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

  // Modal Form State - Strategic Sprint Milestone
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    projectName: '',
    assignedTeam: 'Frontend Development Team',
    scrumMaster: 'Krishna Deepesh (Tech Lead)',
    epicCategory: 'Core Architecture',
    capacityStoryPoints: 40,
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    goal: ''
  });

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
      scrumMaster: found ? found.lead : ''
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
      team_lead: formData.scrumMaster,
      epic_category: formData.epicCategory,
      story_points: Number(formData.capacityStoryPoints) || 40,
      startDate: formData.startDate,
      endDate: formData.endDate,
      goal: formData.goal || 'Deliver sprint features on schedule.',
      status: 'PLANNING',
      totalTasks: 0,
      completedTasks: 0,
      burnDownData: [
        { day: 'Day 1', remaining: 40, target: 40 },
        { day: 'Day 5', remaining: 28, target: 28 },
        { day: 'Day 10', remaining: 12, target: 14 },
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
      resource: `Strategic Sprint: ${newSprint.name} (${newSprint.story_points} Points)`,
      status: 'SUCCESS'
    });

    if (onShowToast) onShowToast({ type: 'success', title: 'Sprint Milestone Created', message: `${newSprint.name} committed with ${newSprint.story_points} Story Points capacity.` });
    setIsModalOpen(false);
  };

  const filteredSprints = sprints.filter(sp => {
    const matchProj = projectFilter === 'ALL' || sp.project_id === projectFilter || sp.project_name === projectFilter;
    const matchTeam = teamFilter === 'ALL' || sp.assigned_team === teamFilter;
    return matchProj && matchTeam;
  });

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Sprint Planner" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono text-[10px] font-extrabold uppercase tracking-wider border border-indigo-200">
              Strategic Milestone Hub
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Sprint Roadmap & Velocity Planning
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define timeboxed agile sprints, commit story points capacity, set strategic milestone goals, and monitor burndown velocity.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md transition-all shrink-0"
        >
          <Target className="w-4 h-4" /> Create Strategic Sprint Milestone
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <Filter className="w-4 h-4 text-indigo-500" /> Filter Sprint Roadmap:
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mr-2">Project Roadmap:</label>
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
            <label className="text-[10px] font-bold text-slate-500 uppercase mr-2">Scrum Team:</label>
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

      {/* Burndown Velocity Chart Banner */}
      {selectedSprint && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 !text-white warm:!text-white shadow-xl space-y-4 border border-indigo-700/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-700/50 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 !text-indigo-200 warm:!text-indigo-200 font-mono text-[10px] font-bold border border-indigo-400/40">
                  {selectedSprint.id}
                </span>
                <h3 className="text-lg font-black !text-white warm:!text-white">{selectedSprint.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/30 !text-emerald-300 warm:!text-emerald-300 border border-emerald-400/40">
                  ⚡ {selectedSprint.story_points || 40} Story Points Capacity
                </span>
              </div>
              <p className="text-xs !text-indigo-100 warm:!text-indigo-100 mt-1 font-medium">
                🎯 <strong>Sprint Goal:</strong> {selectedSprint.goal || 'Deliver core milestone features on schedule.'}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-[10px] !text-indigo-300 warm:!text-indigo-300 uppercase block font-bold">Target Project</span>
                <span className="font-extrabold !text-white warm:!text-white">{selectedSprint.project_name || 'Aureon SaaS'}</span>
              </div>
              <div className="text-right border-l border-indigo-700/60 pl-4">
                <span className="text-[10px] !text-indigo-300 warm:!text-indigo-300 uppercase block font-bold">Assigned Scrum Lead</span>
                <span className="font-extrabold !text-white warm:!text-white">{selectedSprint.team_lead || 'Krishna Deepesh'}</span>
              </div>
            </div>
          </div>

          {/* Velocity Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedSprint.burnDownData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.4} />
                <XAxis dataKey="day" stroke="#c7d2fe" fontSize={11} tick={{ fill: '#c7d2fe' }} />
                <YAxis stroke="#c7d2fe" fontSize={11} tick={{ fill: '#c7d2fe' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #6366f1', color: '#fff' }} />
                <Line type="monotone" dataKey="remaining" stroke="#38bdf8" strokeWidth={3} name="Remaining Story Points" />
                <Line type="monotone" dataKey="target" stroke="#a7f3d0" strokeDasharray="5 5" strokeWidth={2} name="Ideal Velocity Line" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sprints Cards Grid */}
      {filteredSprints.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-extrabold">No Sprint Milestones Created</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click <strong>"Create Strategic Sprint Milestone"</strong> to commit story points capacity, define timeboxed milestones, and assign teams.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
          >
            Create First Sprint Milestone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSprints.map(sp => (
            <div
              key={sp.id}
              onClick={() => setSelectedSprint(sp)}
              className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-xs cursor-pointer transition-all hover:shadow-lg space-y-3 ${
                selectedSprint?.id === sp.id ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
                  ⚡ {sp.story_points || 40} Story Points
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">{sp.startDate || '2026-09-01'} → {sp.endDate || '2026-09-15'}</span>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{sp.name}</h4>
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  📁 Project: {sp.project_name || 'Aureon SaaS'}
                </div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                  👑 Scrum Master: {sp.team_lead || 'Krishna Deepesh'} ({sp.assigned_team})
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-medium line-clamp-2">{sp.goal}</p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {sp.completedTasks || 0} Points Delivered</span>
                  <span className="text-indigo-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {(sp.totalTasks || 0) - (sp.completedTasks || 0)} Points Remaining</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                    style={{ width: `${sp.totalTasks > 0 ? ((sp.completedTasks / sp.totalTasks) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STRATEGIC SPRINT MILESTONE CREATION MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Strategic Roadmap: Create Sprint Milestone & Capacity Commitment">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">1. Sprint Milestone Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              placeholder="e.g. Sprint 2026-Q3-01: Core Auth & Gateway Milestone"
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
              <label className="block font-bold mb-1">3. Responsible Scrum Team *</label>
              <select
                required
                value={formData.assignedTeam}
                onChange={(e) => handleTeamSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              >
                {availableTeams.map(t => (
                  <option key={t.id} value={t.name}>{t.name} (Master: {t.lead})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">4. Target Velocity Capacity (Story Points)</label>
              <input
                type="number"
                value={formData.capacityStoryPoints}
                onChange={(e) => setFormData({ ...formData, capacityStoryPoints: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                placeholder="e.g. 40"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Feature Epic Category</label>
              <input
                type="text"
                value={formData.epicCategory}
                onChange={(e) => setFormData({ ...formData, epicCategory: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                placeholder="e.g. Core Architecture / Auth System"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Timebox Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Timebox End Date</label>
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
            <label className="block font-bold mb-1">Sprint Milestone Strategic Objective</label>
            <textarea
              rows={2}
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
              placeholder="Describe strategic sprint deliverables and acceptance criteria for the scrum team..."
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
              Commit Sprint Milestone
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
