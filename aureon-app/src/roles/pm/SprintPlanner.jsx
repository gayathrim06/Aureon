import React, { useState, useEffect, useMemo } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { Layers, Plus, CheckCircle2, Clock, Activity, FolderKanban, Users, Calendar, ShieldCheck, Filter, Target, Zap, TrendingUp, Flag, CheckSquare, UserPlus, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getAuthHeaders } from '../../services/apiClient';

export const SprintPlanner = ({ onShowToast }) => {
  const { user } = useAuth();
  const [sprints, setSprints] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [developersList, setDevelopersList] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState(null);

  // Multi-Task / Batch Sprint Assignment State
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [batchAssigneeId, setBatchAssigneeId] = useState('');
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);

  // Filters
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');

  // Modal Form State - Strategic Sprint Milestone
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    projectName: '',
    assignedTeam: '',
    scrumMaster: '',
    storyPoints: 40,
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    goal: ''
  });

  // Modal Form State - Add Task Directly to Selected Sprint
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    ticket_type: 'Task',
    assigned_to: '',
    estimated_hours: 8,
    due_date: '2026-09-25'
  });

  const fetchSprintData = async () => {
    const headers = getAuthHeaders();

    try {
      const [spRes, prRes, tmRes, tkRes, usRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/sprints/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/projects/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/teams/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/tasks/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/users/', { headers })
      ]);

      if (prRes.ok) {
        const pData = await prRes.json();
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

      if (tmRes.ok) {
        const tData = await tmRes.json();
        const teams = tData.teams || [];
        setTeamsList(teams);
        if (teams.length > 0 && !formData.assignedTeam) {
          setFormData(prev => ({
            ...prev,
            assignedTeam: teams[0].name,
            scrumMaster: teams[0].lead_name || 'Team Lead'
          }));
        }
      }

      if (usRes.ok) {
        const uData = await usRes.json();
        const users = uData.users || [];
        setDevelopersList(users);
        if (users.length > 0 && !taskFormData.assigned_to) {
          setTaskFormData(prev => ({ ...prev, assigned_to: users[0].id }));
        }
      }

      if (tkRes.ok) {
        const tkData = await tkRes.json();
        setTasks(tkData.tasks || []);
      }

      if (spRes.ok) {
        const sData = await spRes.json();
        const apiSprints = sData.sprints || [];
        setSprints(apiSprints);
        if (apiSprints.length > 0) {
          setSelectedSprint(prev => {
            if (prev) {
              const matched = apiSprints.find(s => s.id === prev.id);
              return matched || apiSprints[0];
            }
            return apiSprints[0];
          });
        }
      }
    } catch (err) {
      console.error('Failed to load sprint planner data:', err);
    }
  };

  useEffect(() => {
    fetchSprintData();
  }, []);

  // Resolve the sprint's specific assigned team
  const sprintTeam = useMemo(() => {
    if (!selectedSprint || !teamsList.length) return null;
    return teamsList.find(t => 
      (selectedSprint.team_id && String(t.id) === String(selectedSprint.team_id)) ||
      (selectedSprint.team_name && t.name === selectedSprint.team_name) ||
      (selectedSprint.team && t.name === selectedSprint.team)
    ) || null;
  }, [selectedSprint, teamsList]);

  // Strictly filter developers to ONLY those who belong to the sprint's team with live availability stats
  const sprintDevelopers = useMemo(() => {
    if (!sprintTeam) return developersList;
    if (sprintTeam.member_details && sprintTeam.member_details.length > 0) {
      return sprintTeam.member_details.map(m => {
        const u = developersList.find(d => String(d.id) === String(m.id)) || {};
        return {
          id: m.id,
          name: m.name || u.display_name || u.full_name,
          full_name: m.full_name || m.name || u.full_name,
          email: m.email || u.email,
          role: m.role || u.role || 'ROLE_DEV',
          designation: m.designation || u.designation || 'Software Engineer',
          status: m.status || (m.active_tasks_count === 0 ? 'Available' : `Busy (${m.active_tasks_count} active)`),
          is_available: m.is_available !== undefined ? m.is_available : (m.active_tasks_count === 0),
          active_tasks_count: m.active_tasks_count !== undefined ? m.active_tasks_count : 0,
          completed_tasks_count: m.completed_tasks_count !== undefined ? m.completed_tasks_count : 0
        };
      });
    }

    const memberIds = new Set((sprintTeam.member_details || []).map(m => String(m.id)));
    if (sprintTeam.team_leader_id) memberIds.add(String(sprintTeam.team_leader_id));
    if (sprintTeam.lead_id) memberIds.add(String(sprintTeam.lead_id));

    return developersList.filter(d => memberIds.has(String(d.id)));
  }, [sprintTeam, developersList]);

  const formatDevOption = (dev) => {
    if (!dev) return 'Unassigned';
    const isAvail = dev.is_available;
    const completed = dev.completed_tasks_count || 0;
    const active = dev.active_tasks_count || 0;
    const availText = isAvail
      ? (completed > 0 ? `Available (All ${completed} tasks completed)` : 'Available (Ready)')
      : `Busy (${active} active, ${completed} completed)`;
    return `${isAvail ? '🟢' : '🔴'} ${dev.full_name || dev.name} — ${availText} [${dev.role || 'DEV'}]`;
  };

  // Keep modal assignee aligned with team members
  useEffect(() => {
    if (sprintDevelopers.length > 0) {
      setTaskFormData(prev => {
        const isCurrentValid = sprintDevelopers.some(d => String(d.id) === String(prev.assigned_to));
        if (!isCurrentValid) {
          return { ...prev, assigned_to: sprintDevelopers[0].id };
        }
        return prev;
      });
    }
  }, [sprintDevelopers]);

  const handleProjectSelect = (projId) => {
    const found = projectsList.find(p => p.id === projId);
    setFormData(prev => ({
      ...prev,
      projectId: projId,
      projectName: found ? found.name : ''
    }));
  };

  const handleTeamSelect = (teamName) => {
    const found = teamsList.find(t => t.name === teamName);
    setFormData(prev => ({
      ...prev,
      assignedTeam: teamName,
      scrumMaster: found?.lead_name || 'Team Lead'
    }));
  };

  const handleAssignDeveloper = async (taskId, devId) => {
    const chosenDev = sprintDevelopers.find(u => String(u.id) === String(devId)) || developersList.find(u => String(u.id) === String(devId));
    const devName = chosenDev ? (chosenDev.full_name || chosenDev.name || chosenDev.email) : 'Developer';

    // Optimistic UI update
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          assigned_to_id: devId,
          assignee: devName,
          assignee_name: devName,
          needs_assignment: false
        };
      }
      return t;
    }));

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/tasks/${taskId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ assigned_to: devId })
      });

      if (res.ok) {
        if (onShowToast) {
          onShowToast({
            type: 'success',
            title: 'Developer Assigned to Task',
            message: `Task successfully assigned to ${devName}.`
          });
        }
        logAuditEvent({
          user,
          role: user?.role,
          action: 'TASK_ASSIGNED_IN_SPRINT',
          resource: `Task ${taskId} → ${devName}`,
          status: 'SUCCESS'
        });
        fetchSprintData();
      } else {
        const errData = await res.json();
        if (onShowToast) {
          onShowToast({
            type: 'error',
            title: 'Assignment Failed',
            message: errData.message || 'Could not assign developer.'
          });
        }
      }
    } catch (err) {
      console.error('Error assigning developer:', err);
    }
  };

  const handleReturnToBacklog = async (taskId) => {
    if (!selectedSprint) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/sprints/${selectedSprint.id}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        if (onShowToast) {
          onShowToast({
            type: 'success',
            title: 'Task Returned to Backlog',
            message: 'Task detached from sprint and moved back to product backlog.'
          });
        }
        await fetchSprintData();
      }
    } catch (err) {
      console.error('Error returning task to backlog:', err);
    }
  };

  const handleBatchAssign = async () => {
    if (!selectedTaskIds.length || !batchAssigneeId) return;
    setIsBatchAssigning(true);

    const chosenDev = sprintDevelopers.find(u => String(u.id) === String(batchAssigneeId));
    const devName = chosenDev ? (chosenDev.full_name || chosenDev.name) : 'Developer';

    // Optimistic UI update
    setTasks(prev => prev.map(t => {
      if (selectedTaskIds.includes(t.id)) {
        return {
          ...t,
          assigned_to_id: batchAssigneeId,
          assignee: devName,
          assignee_name: devName,
          needs_assignment: false
        };
      }
      return t;
    }));

    try {
      await Promise.all(
        selectedTaskIds.map(taskId => 
          fetch(`http://127.0.0.1:8000/api/v1/tasks/${taskId}/assign`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify({ assigned_to: batchAssigneeId })
          })
        )
      );

      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Batch Allocation Complete',
          message: `${selectedTaskIds.length} tasks allocated to ${devName} in ${selectedSprint?.name}.`
        });
      }
      logAuditEvent({
        user,
        role: user?.role,
        action: 'PM_BATCH_TASK_ASSIGN',
        resource: `${selectedTaskIds.length} tasks → ${devName}`,
        status: 'SUCCESS'
      });
      setSelectedTaskIds([]);
      setBatchAssigneeId('');
      fetchSprintData();
    } catch (err) {
      console.error('Batch assign failed:', err);
    } finally {
      setIsBatchAssigning(false);
    }
  };

  const handleCreateTaskForSprint = async (e) => {
    e.preventDefault();
    if (!taskFormData.title.trim() || !selectedSprint) return;

    const payload = {
      title: taskFormData.title,
      description: taskFormData.description,
      priority: taskFormData.priority,
      ticket_type: taskFormData.ticket_type,
      sprint_id: selectedSprint.id,
      project_id: selectedSprint.project_id,
      assigned_to: taskFormData.assigned_to,
      estimated_hours: Number(taskFormData.estimated_hours) || 8,
      due_date: taskFormData.due_date
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (onShowToast) {
          onShowToast({
            type: 'success',
            title: 'Task Created in Sprint',
            message: `Task "${taskFormData.title}" added to sprint ${selectedSprint.name}.`
          });
        }
        setIsAddTaskModalOpen(false);
        setTaskFormData({
          title: '',
          description: '',
          priority: 'MEDIUM',
          ticket_type: 'Task',
          assigned_to: sprintDevelopers[0]?.id || '',
          estimated_hours: 8,
          due_date: '2026-09-25'
        });
        fetchSprintData();
      } else {
        const err = await res.json();
        if (onShowToast) {
          onShowToast({
            type: 'error',
            title: 'Task Creation Failed',
            message: err.message || 'Failed to create task in sprint.'
          });
        }
      }
    } catch (err) {
      console.error('Error creating task for sprint:', err);
    }
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

    try {
      await fetch('http://127.0.0.1:8000/api/v1/sprints/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(newSprint)
      });
      fetchSprintData();
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

  const selectedSprintTasks = selectedSprint 
    ? tasks.filter(t => (t.sprint_id && String(t.sprint_id) === String(selectedSprint.id)) || (t.sprint_name && t.sprint_name === selectedSprint.name))
    : [];

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
              {teamsList.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Burndown Velocity Chart Banner */}
      {selectedSprint && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 warm:bg-[#e8dbbe] text-indigo-700 dark:text-indigo-300 warm:text-[#342314] font-mono text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 warm:border-[#cbb68e]">
                  {selectedSprint.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white warm:text-[#342314]">{selectedSprint.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ⚡ {selectedSprint.story_points || 40} Story Points Capacity
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 warm:text-[#69523c] mt-1 font-medium">
                🎯 <strong>Sprint Goal:</strong> {selectedSprint.goal || 'Deliver core milestone features on schedule.'}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block font-bold">Target Project</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]">{selectedSprint.project_name || 'Aureon SaaS'}</span>
              </div>
              <div className="text-right border-l border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] pl-4">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block font-bold">Assigned Scrum Lead</span>
                <span className="font-extrabold text-slate-900 dark:text-white warm:text-[#342314]">{selectedSprint.team_lead || 'Krishna Deepesh'}</span>
              </div>
            </div>
          </div>

          {/* Velocity Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedSprint.burnDownData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a' }} />
                <Line type="monotone" dataKey="remaining" stroke="#4f46e5" strokeWidth={3} name="Remaining Story Points" />
                <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} name="Ideal Velocity Line" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sprint Squad Availability & Workload Roster */}
          {sprintTeam && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                    Sprint Squad Availability Roster: {sprintTeam.name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-500">
                    {sprintDevelopers.length} Members
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    {sprintDevelopers.filter(d => d.is_available).length} Available (Tasks Completed)
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    {sprintDevelopers.filter(d => !d.is_available).length} Busy (Active In-Flight)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
                {sprintDevelopers.map(dev => {
                  const inThisSprintCount = selectedSprintTasks.filter(t => String(t.assigned_to_id) === String(dev.id) || t.assignee === dev.full_name).length;
                  return (
                    <div
                      key={dev.id}
                      className={`p-3 rounded-xl border transition-all ${
                        dev.is_available
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate" title={dev.full_name || dev.name}>
                          {dev.full_name || dev.name}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dev.is_available ? 'bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-800' : 'bg-rose-500'}`} />
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {dev.designation || dev.role || 'Software Engineer'}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                        <span className={`font-bold ${dev.is_available ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-400'}`}>
                          {dev.is_available ? '✓ Available' : `${dev.active_tasks_count} Active`}
                        </span>
                        <span className="font-mono text-slate-500 font-bold" title="Tasks allocated in this sprint">
                          ⚡ {inThisSprintCount} in sprint
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SPRINT DELIVERABLES & TASK ASSIGNMENT PANEL */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Sprint Deliverables & Developer Allocation ({selectedSprintTasks.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Manage tasks committed to <strong>{selectedSprint.name}</strong>. Assign or reassign developers directly within this sprint.
                </p>
              </div>

              <button
                onClick={() => setIsAddTaskModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task to this Sprint
              </button>
            </div>

            {/* Multi-Task / Batch Sprint Assignment Bar */}
            {selectedTaskIds.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-indigo-600 text-white flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-5 h-5 text-indigo-200 shrink-0" />
                  <div>
                    <span className="font-black text-xs">
                      {selectedTaskIds.length} Sprint Task{selectedTaskIds.length !== 1 ? 's' : ''} Selected
                    </span>
                    <span className="text-[10px] text-indigo-200 block">
                      Assign these deliverables simultaneously to a team member
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={batchAssigneeId}
                    onChange={(e) => setBatchAssigneeId(e.target.value)}
                    className="p-2 px-3 rounded-xl bg-white text-slate-900 text-xs font-bold border-none cursor-pointer"
                  >
                    <option value="">Select Team Member to Allocate...</option>
                    {sprintDevelopers.map(dev => (
                      <option key={dev.id} value={dev.id}>
                        {formatDevOption(dev)}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleBatchAssign}
                    disabled={!batchAssigneeId || isBatchAssigning}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-xs font-black transition-all shadow-xs"
                  >
                    {isBatchAssigning ? 'Assigning...' : 'Assign to Selected Member'}
                  </button>

                  <button
                    onClick={() => setSelectedTaskIds([])}
                    className="px-3 py-2 text-xs font-bold text-indigo-200 hover:text-white"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {selectedSprintTasks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No tasks currently assigned to this sprint.</p>
                <p className="text-[11px] text-slate-500">Click <strong>"Add Task to this Sprint"</strong> above to break down deliverables and assign developers.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedSprintTasks.length > 0 && selectedTaskIds.length === selectedSprintTasks.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTaskIds(selectedSprintTasks.map(t => t.id));
                            } else {
                              setSelectedTaskIds([]);
                            }
                          }}
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="Select All Sprint Tasks"
                        />
                      </th>
                      <th className="p-3">Ticket ID</th>
                      <th className="p-3">Task Deliverable</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Assigned Developer & Availability</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {selectedSprintTasks.map(task => {
                      const currentDevId = task.assigned_to_id || sprintDevelopers.find(d => (d.full_name === task.assignee || d.email === task.assignee))?.id || '';
                      const isSelected = selectedTaskIds.includes(task.id);
                      return (
                        <tr key={task.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : 'hover:bg-slate-50/50 dark:hover:bg-slate-950/40'}`}>
                          <td className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                setSelectedTaskIds(prev => [...prev, task.id]);
                              } else {
                                setSelectedTaskIds(prev => prev.filter(id => id !== task.id));
                              }
                            }}
                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {task.ticket_code || (task.id ? String(task.id).substring(0, 8) : 'TCK')}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 dark:text-white block">{task.title}</span>
                          {task.description && (
                            <span className="text-[10px] text-slate-500 line-clamp-1">{task.description}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            task.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                            task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {task.priority || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            task.status === 'DONE' || task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                            task.status === 'REVIEW' || task.status === 'IN_REVIEW' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {task.status || 'TODO'}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={currentDevId}
                            onChange={(e) => handleAssignDeveloper(task.id, e.target.value)}
                            className="p-1 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-xs text-slate-900 dark:text-white cursor-pointer hover:border-indigo-500 transition-colors max-w-[280px]"
                          >
                            <option value="">⚠️ Unassigned (Assign Dev)</option>
                            {currentDevId && !sprintDevelopers.some(d => String(d.id) === String(currentDevId)) && (
                              <option value={currentDevId}>
                                👤 {task.assignee || 'Assigned User'}
                              </option>
                            )}
                            {sprintDevelopers.map(dev => (
                              <option key={dev.id} value={dev.id}>
                                {formatDevOption(dev)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {task.due_date ? String(task.due_date).split('T')[0] : '—'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleReturnToBacklog(task.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition"
                            title="Remove from this sprint and return to product backlog"
                          >
                            To Backlog
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
            <button
              type="button"
              key={sp.id}
              onClick={() => setSelectedSprint(sp)}
              className={`w-full text-left p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-xs cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95 space-y-3 ${
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
            </button>
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
                {teamsList.map(t => (
                  <option key={t.id} value={t.name}>{t.name} (Lead: {t.lead_name || 'Team Lead'})</option>
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

      {/* ADD TASK DIRECTLY INSIDE SPRINT MODAL */}
      <Modal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} title={`Add Task to Sprint: ${selectedSprint?.name || ''}`}>
        <form onSubmit={handleCreateTaskForSprint} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase block text-indigo-600 dark:text-indigo-400">Target Sprint</span>
              <span className="font-extrabold text-sm">{selectedSprint?.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase block text-indigo-600 dark:text-indigo-400">Project</span>
              <span className="font-extrabold">{selectedSprint?.project_name}</span>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">1. Task Title *</label>
            <input
              type="text"
              required
              value={taskFormData.title}
              onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">2. Description & Acceptance Criteria</label>
            <textarea
              rows={3}
              value={taskFormData.description}
              onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
              placeholder="Describe deliverables and testing criteria..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">3. Assign Developer *</label>
              <select
                required
                value={taskFormData.assigned_to}
                onChange={(e) => setTaskFormData({ ...taskFormData, assigned_to: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              >
                <option value="">Select Developer</option>
                {sprintDevelopers.map(dev => (
                  <option key={dev.id} value={dev.id}>
                    {formatDevOption(dev)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">4. Priority</label>
              <select
                value={taskFormData.priority}
                onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              >
                <option value="CRITICAL">🔴 Critical</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">🔵 Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Estimated Hours</label>
              <input
                type="number"
                value={taskFormData.estimated_hours}
                onChange={(e) => setTaskFormData({ ...taskFormData, estimated_hours: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Due Date</label>
              <input
                type="date"
                value={taskFormData.due_date}
                onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddTaskModalOpen(false)}
              className="px-3 py-2 text-xs font-bold text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              Commit Task to Sprint
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
