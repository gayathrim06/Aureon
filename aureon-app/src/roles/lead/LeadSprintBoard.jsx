import React, { useState, useEffect, useMemo } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { Layers, CheckCircle2, ArrowRight, GitBranch, Plus, UserCheck, Calendar, Filter, Target, List, LayoutGrid, Search, Clock, CheckSquare, Users, Edit3, Trash2, X, RefreshCw, RotateCcw, Play, Sparkles } from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import { TaskSkillRecommendationModal } from '../../components/common/TaskSkillRecommendationModal';

export const LeadSprintBoard = ({ onShowToast, initialView = 'kanban' }) => {
  const { user } = useAuth();
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(initialView || 'kanban');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtering states
  const [selectedDevFilter, setSelectedDevFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Edit Task State
  const [editingTask, setEditingTask] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Skill Recommendation Modal State
  const [recommendingTask, setRecommendingTask] = useState(null);

  // Multi-Task / Batch Sprint Assignment State
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [batchAssigneeId, setBatchAssigneeId] = useState('');
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);

  // Form State for Adding Deliverable Directly into the Selected Sprint
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'HIGH',
    ticket_type: 'Task',
    assigned_to: '',
    required_skills: '',
    estimated_hours: 8,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    const headers = getAuthHeaders();

    try {
      const [spRes, tkRes, tmRes, usRes] = await Promise.all([
        fetch(`${API_BASE_URL}/sprints/`, { headers }),
        fetch(`${API_BASE_URL}/tasks/`, { headers }),
        fetch(`${API_BASE_URL}/teams/`, { headers }),
        fetch(`${API_BASE_URL}/users/`, { headers })
      ]);

      let myTeams = [];
      if (tmRes.ok) {
        const tmData = await tmRes.json();
        const allTeams = tmData.teams || [];
        myTeams = user?.role === 'ROLE_ADMIN' 
          ? allTeams 
          : allTeams.filter(t => {
              const uId = String(user?.id || '');
              const uName = (user?.name || user?.full_name || '').toLowerCase().trim();
              const tLeaderId = String(t.team_leader_id || t.lead_id || '');
              const tLeaderName = (t.leader_name || t.leader || '').toLowerCase().trim();
              return (tLeaderId && tLeaderId === uId) || (tLeaderName && uName && (tLeaderName === uName || tLeaderName.includes(uName) || uName.includes(tLeaderName)));
            });
        setTeamsList(myTeams);
      }

      if (spRes.ok) {
        const spData = await spRes.json();
        const spList = spData.sprints || [];
        const myTeamIds = myTeams.map(t => String(t.id));
        const myProjectIds = myTeams.map(t => String(t.project_id)).filter(Boolean);
        const scopedSprints = user?.role === 'ROLE_ADMIN'
          ? spList
          : spList.filter(s => myTeamIds.includes(String(s.team_id)) || myProjectIds.includes(String(s.project_id)));
        setSprints(scopedSprints);
        if (scopedSprints.length > 0 && !selectedSprintId) {
          setSelectedSprintId(scopedSprints[0].id);
        }
      }

      if (usRes.ok) {
        const usData = await usRes.json();
        const uList = usData.users || [];
        setDevelopers(uList);
      }

      if (tkRes.ok) {
        const tkData = await tkRes.json();
        const allTasks = tkData.tasks || [];
        const myTeamIds = myTeams.map(t => String(t.id));
        const myProjectIds = myTeams.map(t => String(t.project_id)).filter(Boolean);
        const scopedTasks = user?.role === 'ROLE_ADMIN'
          ? allTasks
          : allTasks.filter(t => myTeamIds.includes(String(t.team_id)) || myProjectIds.includes(String(t.project_id)));
        setTasks(scopedTasks);
      }
    } catch (err) {
      console.error('Failed to load lead sprint board data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedSprint = sprints.find(s => String(s.id) === String(selectedSprintId)) || sprints[0];

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
  const teamDevelopers = useMemo(() => {
    if (!sprintTeam) return developers;
    if (sprintTeam.member_details && sprintTeam.member_details.length > 0) {
      return sprintTeam.member_details.map(m => {
        const u = developers.find(d => String(d.id) === String(m.id)) || {};
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

    return developers.filter(d => memberIds.has(String(d.id)));
  }, [sprintTeam, developers]);

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

  // Keep form assignee aligned with team members
  useEffect(() => {
    if (teamDevelopers.length > 0) {
      setTaskForm(prev => {
        const isCurrentValid = teamDevelopers.some(d => String(d.id) === String(prev.assigned_to));
        if (!isCurrentValid) {
          return { ...prev, assigned_to: teamDevelopers[0].id };
        }
        return prev;
      });
    }
  }, [teamDevelopers]);

  const sprintTasks = useMemo(() => {
    if (!selectedSprint) return tasks;
    return tasks.filter(t => (t.sprint_id && String(t.sprint_id) === String(selectedSprint.id)) || (t.sprint_name && t.sprint_name === selectedSprint.name));
  }, [tasks, selectedSprint]);

  const filteredTasks = useMemo(() => {
    let list = sprintTasks;
    if (selectedDevFilter !== 'ALL') {
      const devObj = teamDevelopers.find(d => String(d.id) === String(selectedDevFilter));
      const targetName = (devObj?.full_name || devObj?.name || '').toLowerCase();
      list = list.filter(t => 
        String(t.assigned_to_id) === String(selectedDevFilter) ||
        (t.assignee && targetName && t.assignee.toLowerCase().includes(targetName)) ||
        (t.assignee_name && targetName && t.assignee_name.toLowerCase().includes(targetName))
      );
    }
    return list;
  }, [sprintTasks, selectedDevFilter, teamDevelopers]);

  const displayedTableTasks = useMemo(() => {
    let list = filteredTasks;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'DONE') {
        list = list.filter(t => t.status === 'DONE' || t.status === 'COMPLETED');
      } else if (statusFilter === 'REVIEW') {
        list = list.filter(t => t.status === 'REVIEW' || t.status === 'IN_REVIEW');
      } else {
        list = list.filter(t => t.status === statusFilter);
      }
    }
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(t => 
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.ticket_code && t.ticket_code.toLowerCase().includes(q)) ||
      (t.assignee && t.assignee.toLowerCase().includes(q)) ||
      (t.assignee_name && t.assignee_name.toLowerCase().includes(q)) ||
      (t.status && t.status.toLowerCase().includes(q)) ||
      (t.priority && t.priority.toLowerCase().includes(q))
    );
  }, [filteredTasks, statusFilter, searchTerm]);

  const columns = [
    { key: 'TODO', label: '📋 Backlog / To Do', color: 'border-t-slate-500 bg-slate-500/5' },
    { key: 'IN_PROGRESS', label: '🚀 Active Execution', color: 'border-t-blue-500 bg-blue-500/5' },
    { key: 'REVIEW', label: '🔍 Code Review', color: 'border-t-amber-500 bg-amber-500/5' },
    { key: 'DONE', label: '✅ Approved / Done', color: 'border-t-emerald-500 bg-emerald-500/5' }
  ];

  const moveTask = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {}

    logAuditEvent({ user, role: user?.role, action: 'LEAD_TASK_APPROVE', resource: `Task ${taskId} → ${newStatus}`, status: 'SUCCESS' });
    if (onShowToast) onShowToast({ type: 'info', title: 'Sprint Board Updated', message: `Ticket moved to ${newStatus}` });
  };

  const approveTask = (taskId) => {
    moveTask(taskId, 'DONE');
    if (onShowToast) onShowToast({ type: 'success', title: 'Code Review Approved', message: `Ticket approved and moved to Done.` });
  };

  const handleDeleteTask = async (taskId, e) => {
    e && e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this sprint task?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
        if (onShowToast) onShowToast({ type: 'success', title: 'Task Removed', message: 'Sprint task deleted.' });
      } else {
        const err = await res.json().catch(() => ({}));
        if (onShowToast) onShowToast({ type: 'error', title: 'Delete Failed', message: err.message || 'Could not delete task.' });
      }
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  const handleSaveEditTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          status: editingTask.status,
          estimated_hours: parseFloat(editingTask.estimated_hours) || 8,
          due_date: editingTask.due_date,
          required_skills: editingTask.required_skills || '',
          assigned_to: editingTask.assigned_to_id
        })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...editingTask } : t));
        if (onShowToast) onShowToast({ type: 'success', title: 'Task Updated', message: `Task "${editingTask.title}" updated successfully.` });
        setEditingTask(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        if (onShowToast) onShowToast({ type: 'error', title: 'Update Failed', message: err.message || 'Failed to update task.' });
      }
    } catch (err) {
      console.error('Save task error:', err);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAssignDeveloper = async (taskId, devId) => {
    const chosenDev = developers.find(u => String(u.id) === String(devId));
    const devName = chosenDev ? (chosenDev.full_name || chosenDev.email) : 'Developer';

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
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/assign`, {
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
            title: 'Developer Reassigned',
            message: `Task successfully assigned to ${devName}.`
          });
        }
        logAuditEvent({
          user,
          role: user?.role,
          action: 'LEAD_TASK_ASSIGN',
          resource: `Task ${taskId} → ${devName}`,
          status: 'SUCCESS'
        });
      } else {
        const err = await res.json();
        if (onShowToast) {
          onShowToast({
            type: 'error',
            title: 'Assignment Failed',
            message: err.message || 'Could not assign developer.'
          });
        }
      }
    } catch (err) {
      console.error('Error in handleAssignDeveloper:', err);
    }
  };

  const handleBatchAssign = async () => {
    if (!selectedTaskIds.length || !batchAssigneeId) return;
    setIsBatchAssigning(true);

    const chosenDev = teamDevelopers.find(u => String(u.id) === String(batchAssigneeId));
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
          fetch(`${API_BASE_URL}/tasks/${taskId}/assign`, {
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
        action: 'LEAD_BATCH_TASK_ASSIGN',
        resource: `${selectedTaskIds.length} tasks → ${devName}`,
        status: 'SUCCESS'
      });
      setSelectedTaskIds([]);
      setBatchAssigneeId('');
      fetchData();
    } catch (err) {
      console.error('Batch assign failed:', err);
    } finally {
      setIsBatchAssigning(false);
    }
  };

  const handleCreateSprintTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !selectedSprint) return;

    const payload = {
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      ticket_type: taskForm.ticket_type,
      sprint_id: selectedSprint.id,
      project_id: selectedSprint.project_id,
      assigned_to: taskForm.assigned_to,
      required_skills: taskForm.required_skills || '',
      estimated_hours: Number(taskForm.estimated_hours) || 8,
      due_date: taskForm.due_date
    };

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/`, {
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
            title: 'Sprint Deliverable Added',
            message: `Task "${taskForm.title}" created in sprint ${selectedSprint.name}.`
          });
        }
        setIsAddModalOpen(false);
        setTaskForm({
          title: '',
          description: '',
          priority: 'HIGH',
          ticket_type: 'Task',
          assigned_to: teamDevelopers[0]?.id || '',
          estimated_hours: 8,
          due_date: '2026-09-25'
        });
        fetchData();
      } else {
        const err = await res.json();
        if (onShowToast) {
          onShowToast({
            type: 'error',
            title: 'Task Creation Failed',
            message: err.message || 'Failed to create task.'
          });
        }
      }
    } catch (err) {
      console.error('Error creating sprint task:', err);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Sprint Board" />

      {/* Header & Sprint Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Team Lead: Sprint Kanban & Task Allocation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage sprint deliverables, allocate work to developers, and approve code review tickets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle: Kanban vs Deliverables Table */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95 ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Task Deliverables Table
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={!selectedSprint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task to Sprint
          </button>
        </div>
      </div>

      {/* Sprint Selection Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-indigo-500" /> Active Sprint:
          </span>
          <select
            value={selectedSprintId}
            onChange={(e) => setSelectedSprintId(e.target.value)}
            className="p-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
          >
            {sprints.map(s => (
              <option key={s.id} value={s.id}>
                ⚡ {s.name} ({s.project_name || 'Project'})
              </option>
            ))}
          </select>
        </div>

        {selectedSprint && (
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Project</span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{selectedSprint.project_name || 'General Project'}</span>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{selectedSprint.story_points || 40} Story Points</span>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Sprint Deliverables</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{filteredTasks.length} Tickets</span>
            </div>
          </div>
        )}
      </div>

      {/* Sprint Squad Availability & Workload Roster */}
      {sprintTeam && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                Sprint Squad Availability Roster: {sprintTeam.name}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-500">
                {teamDevelopers.length} Members
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                {teamDevelopers.filter(d => d.is_available).length} Available (Tasks Completed)
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                {teamDevelopers.filter(d => !d.is_available).length} Busy (Active In-Flight)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
            {teamDevelopers.map(dev => {
              const inThisSprintCount = sprintTasks.filter(t => String(t.assigned_to_id) === String(dev.id) || t.assignee === dev.full_name).length;
              const isFilterActive = String(selectedDevFilter) === String(dev.id);
              return (
                <button
                  type="button"
                  key={dev.id}
                  onClick={() => setSelectedDevFilter(prev => String(prev) === String(dev.id) ? 'ALL' : dev.id)}
                  title={`Click to filter deliverables by ${dev.full_name || dev.name}`}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 group focus:outline-hidden ${
                    isFilterActive
                      ? 'ring-2 ring-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 shadow-md -translate-y-0.5'
                      : dev.is_available
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 hover:shadow-xs hover:-translate-y-0.5'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={dev.full_name || dev.name}>
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
                  {isFilterActive && (
                    <div className="mt-1 text-[9px] font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                      <span>● Active Filter</span>
                      <span className="text-[10px]">✕ Clear</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Views: Deliverables Table vs Kanban Board Grid */}
      {viewMode === 'table' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sprint deliverables by title, code, dev..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Status Filter Tabs */}
              <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700 text-xs">
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'TODO', label: 'To Do' },
                  { key: 'IN_PROGRESS', label: 'In Progress' },
                  { key: 'REVIEW', label: 'Review' },
                  { key: 'DONE', label: 'Done' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                      statusFilter === tab.key
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {selectedDevFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedDevFilter('ALL')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Clear Dev Filter
                </button>
              )}

              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                {displayedTableTasks.length} Tickets
              </span>
            </div>
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
                  {teamDevelopers.map(dev => (
                    <option key={dev.id} value={dev.id}>
                      {formatDevOption(dev)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleBatchAssign}
                  disabled={!batchAssigneeId || isBatchAssigning}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {isBatchAssigning ? 'Assigning...' : 'Assign to Selected Member'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTaskIds([])}
                  className="px-3 py-2 text-xs font-bold text-indigo-200 hover:text-white cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {displayedTableTasks.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No tasks found matching your filter in this sprint.</p>
              <div className="flex items-center justify-center gap-2 pt-2">
                {(statusFilter !== 'ALL' || selectedDevFilter !== 'ALL' || searchTerm) && (
                  <button
                    type="button"
                    onClick={() => { setStatusFilter('ALL'); setSelectedDevFilter('ALL'); setSearchTerm(''); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 cursor-pointer"
                >
                  + Add Task to Sprint
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={displayedTableTasks.length > 0 && selectedTaskIds.length === displayedTableTasks.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTaskIds(displayedTableTasks.map(t => t.id));
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
                    <th className="p-3">Workflow Status</th>
                    <th className="p-3">Assigned Developer & Availability</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {displayedTableTasks.map(t => {
                    const currentDevId = t.assigned_to_id || teamDevelopers.find(d => d.full_name === t.assignee || d.email === t.assignee)?.id || '';
                    const isSelected = selectedTaskIds.includes(t.id);
                    return (
                      <tr key={t.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : 'hover:bg-slate-50/50 dark:hover:bg-slate-950/40'}`}>
                        <td className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTaskIds(prev => [...prev, t.id]);
                              } else {
                                setSelectedTaskIds(prev => prev.filter(id => id !== t.id));
                              }
                            }}
                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {t.ticket_code || (t.id ? String(t.id).substring(0, 8) : 'TCK')}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => setEditingTask({
                              ...t,
                              assigned_to_id: currentDevId,
                              estimated_hours: t.estimated_hours || 8,
                              due_date: t.due_date ? String(t.due_date).split('T')[0] : ''
                            })}
                            className="font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left block cursor-pointer group"
                            title="Click to view & edit task details"
                          >
                            <span className="group-hover:underline">{t.title}</span>
                          </button>
                          {t.description && (
                            <span className="text-[10px] text-slate-500 line-clamp-1 block mt-0.5">{t.description}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                            t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                            t.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {t.priority || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={t.status || 'TODO'}
                            onChange={(e) => moveTask(t.id, e.target.value)}
                            className="p-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVIEW">Code Review</option>
                            <option value="DONE">Done / Approved</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={currentDevId}
                            onChange={(e) => handleAssignDeveloper(t.id, e.target.value)}
                            className="p-1 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-xs text-slate-900 dark:text-white cursor-pointer hover:border-indigo-500 transition-colors max-w-[280px]"
                          >
                            <option value="">⚠️ Unassigned (Select Developer)</option>
                            {currentDevId && !teamDevelopers.some(d => String(d.id) === String(currentDevId)) && (
                              <option value={currentDevId}>
                                👤 {t.assignee || 'Assigned Developer'}
                              </option>
                            )}
                            {teamDevelopers.map(dev => (
                              <option key={dev.id} value={dev.id}>
                                {formatDevOption(dev)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {t.due_date ? String(t.due_date).split('T')[0] : '—'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {(t.status === 'REVIEW' || t.status === 'IN_REVIEW') && (
                              <button
                                type="button"
                                onClick={() => approveTask(t.id)}
                                className="px-2.5 py-1 rounded-lg text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1"
                                title="Approve Code Review"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                            )}

                            {t.status === 'TODO' && (
                              <button
                                type="button"
                                onClick={() => moveTask(t.id, 'IN_PROGRESS')}
                                className="px-2.5 py-1 rounded-lg text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1"
                                title="Start Execution"
                              >
                                <Play className="w-2.5 h-2.5" /> Start
                              </button>
                            )}

                            {t.status === 'IN_PROGRESS' && (
                              <button
                                type="button"
                                onClick={() => moveTask(t.id, 'REVIEW')}
                                className="px-2.5 py-1 rounded-lg text-[10px] bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1"
                                title="Submit for Code Review"
                              >
                                Review →
                              </button>
                            )}

                            {(t.status === 'DONE' || t.status === 'COMPLETED') && (
                              <button
                                type="button"
                                onClick={() => moveTask(t.id, 'TODO')}
                                className="px-2.5 py-1 rounded-lg text-[10px] bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                                title="Reopen Task to To Do"
                              >
                                <RotateCcw className="w-2.5 h-2.5" /> Reopen
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setRecommendingTask(t)}
                              className="px-2 py-1 rounded-lg text-[10px] bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                              title="Recommend Best Developer (Skills & Capacity Match)"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> Recommend
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingTask({
                                ...t,
                                assigned_to_id: currentDevId,
                                estimated_hours: t.estimated_hours || 8,
                                required_skills: t.required_skills || '',
                                due_date: t.due_date ? String(t.due_date).split('T')[0] : ''
                              })}
                              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 dark:hover:text-indigo-400 transition cursor-pointer"
                              title="Edit Task Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteTask(t.id, e)}
                              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-400 dark:hover:text-rose-400 transition cursor-pointer"
                              title="Delete Task"
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
      ) : (
        /* Kanban Board Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => {
              if (col.key === 'DONE') return t.status === 'DONE' || t.status === 'COMPLETED';
              if (col.key === 'REVIEW') return t.status === 'REVIEW' || t.status === 'IN_REVIEW';
              return t.status === col.key;
            });

            return (
              <div key={col.key} className={`p-4 rounded-3xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm border-t-4 ${col.color} flex flex-col min-h-[450px] space-y-3`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">{col.label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs italic">
                      No tickets in this stage
                    </div>
                  ) : (
                    colTasks.map(t => {
                      const currentDevId = t.assigned_to_id || teamDevelopers.find(d => d.full_name === t.assignee || d.email === t.assignee)?.id || '';

                      return (
                        <div key={t.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                              {t.ticket_code || (t.id ? String(t.id).substring(0, 8) : 'TCK')}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                              t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                              t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                              t.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            }`}>
                              {t.priority || 'MEDIUM'}
                            </span>
                          </div>

                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">{t.title}</h4>

                          {t.description && (
                            <p className="text-[10px] text-slate-500 line-clamp-2">{t.description}</p>
                          )}

                          {/* Inline Developer Assignment Dropdown */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-bold uppercase text-slate-400 block">
                                👤 Assigned Developer:
                              </label>
                              <button
                                type="button"
                                onClick={() => setRecommendingTask(t)}
                                className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                                title="Auto-Recommend developer based on skills and workload"
                              >
                                <Sparkles className="w-2.5 h-2.5" /> Auto-Recommend
                              </button>
                            </div>
                            <select
                              value={currentDevId}
                              onChange={(e) => handleAssignDeveloper(t.id, e.target.value)}
                              className="w-full p-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white hover:border-indigo-500 transition-colors cursor-pointer"
                            >
                              <option value="">⚠️ Unassigned (Select Developer)</option>
                              {currentDevId && !teamDevelopers.some(d => String(d.id) === String(currentDevId)) && (
                                <option value={currentDevId}>
                                  👤 {t.assignee || 'Assigned Developer'}
                                </option>
                              )}
                              {teamDevelopers.map(dev => (
                                <option key={dev.id} value={dev.id}>
                                  {formatDevOption(dev)}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Workflow Action Buttons */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {t.due_date ? String(t.due_date).split('T')[0] : ''}
                            </span>
                            <div className="flex items-center gap-1">
                              {(col.key === 'REVIEW' || t.status === 'IN_REVIEW' || t.status === 'REVIEW') && (
                                <button
                                  type="button"
                                  onClick={() => approveTask(t.id)}
                                  className="px-2 py-1 rounded-lg text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                  ✓ Approve
                                </button>
                              )}
                              {col.key !== 'DONE' && (
                                <button
                                  type="button"
                                  onClick={() => moveTask(t.id, col.key === 'TODO' ? 'IN_PROGRESS' : col.key === 'IN_PROGRESS' ? 'REVIEW' : 'DONE')}
                                  className="px-2 py-1 rounded-lg text-[9px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                  → Next
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingTask({
                                  ...t,
                                  assigned_to_id: currentDevId,
                                  estimated_hours: t.estimated_hours || 8,
                                  due_date: t.due_date ? String(t.due_date).split('T')[0] : ''
                                })}
                                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title="Edit Task"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTask(t.id, e)}
                                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD TASK DIRECTLY INSIDE ACTIVE SPRINT MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={`Add Deliverable to Sprint: ${selectedSprint?.name || ''}`}>
        <form onSubmit={handleCreateSprintTask} className="space-y-4 text-xs">
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
            <label className="block font-bold mb-1">1. Task Deliverable Title *</label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              placeholder="e.g. Implement double-entry ledger settlement"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">2. Technical Scope & Acceptance Notes</label>
            <textarea
              rows={3}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
              placeholder="Provide context and requirements..."
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Required Technical Skills (comma separated)</label>
            <input
              type="text"
              value={taskForm.required_skills}
              onChange={(e) => setTaskForm({ ...taskForm, required_skills: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              placeholder="e.g. React, TypeScript, REST API"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">3. Assign Developer *</label>
              <select
                required
                value={taskForm.assigned_to}
                onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              >
                <option value="">Select Developer</option>
                {teamDevelopers.map(dev => (
                  <option key={dev.id} value={dev.id}>
                    {formatDevOption(dev)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">4. Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
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
                value={taskForm.estimated_hours}
                onChange={(e) => setTaskForm({ ...taskForm, estimated_hours: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Due Date</label>
              <input
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-2 text-xs font-bold text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md active:scale-95"
            >
              Add Deliverable to Sprint
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT / VIEW TASK DETAILS MODAL */}
      {editingTask && (
        <Modal
          isOpen={Boolean(editingTask)}
          onClose={() => setEditingTask(null)}
          title={`Edit Sprint Task: ${editingTask.ticket_code || editingTask.title}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveEditTask} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={editingTask.title || ''}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Description / Acceptance Criteria</label>
              <textarea
                rows={3}
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Workflow Status</label>
                <select
                  value={editingTask.status || 'TODO'}
                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                >
                  <option value="TODO">📋 To Do</option>
                  <option value="IN_PROGRESS">🚀 In Progress</option>
                  <option value="REVIEW">🔍 Code Review</option>
                  <option value="DONE">✅ Approved / Done</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Priority</label>
                <select
                  value={editingTask.priority || 'MEDIUM'}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold">Assigned Developer</label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecommendingTask(editingTask);
                      setEditingTask(null);
                    }}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Auto-Recommend
                  </button>
                </div>
                <select
                  value={editingTask.assigned_to_id || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, assigned_to_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                >
                  <option value="">Unassigned</option>
                  {teamDevelopers.map(dev => (
                    <option key={dev.id} value={dev.id}>
                      {formatDevOption(dev)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Estimated Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={editingTask.estimated_hours || 8}
                  onChange={(e) => setEditingTask({ ...editingTask, estimated_hours: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">Required Skills (comma separated)</label>
              <input
                type="text"
                value={editingTask.required_skills || ''}
                onChange={(e) => setEditingTask({ ...editingTask, required_skills: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                placeholder="e.g. React, TypeScript, GraphQL"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Due Date</label>
              <input
                type="date"
                value={editingTask.due_date || ''}
                onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-3 py-2 text-xs font-bold text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSubmitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md active:scale-95"
              >
                {editSubmitting ? 'Saving...' : 'Save Changes'}
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
            fetchData();
            if (onShowToast) {
              onShowToast({
                type: 'success',
                title: 'Developer Assigned via Recommendation',
                message: `Task successfully assigned to ${assigned.user_name || 'candidate'}.`
              });
            }
          }}
        />
      )}
    </div>
  );
};

