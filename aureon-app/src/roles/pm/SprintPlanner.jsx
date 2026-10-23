import React, { useState, useEffect, useMemo } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { Layers, Plus, CheckCircle2, Clock, Activity, FolderKanban, Users, Calendar, ShieldCheck, Filter, Target, Zap, TrendingUp, Flag, CheckSquare, UserPlus, AlertCircle, Sparkles } from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import { TaskSkillRecommendationModal } from '../../components/common/TaskSkillRecommendationModal';

// Helper functions for story points and sprint capacity calculations
export const getTaskStoryPoints = (task) => {
  if (!task) return 0;
  if (task.story_points !== undefined && task.story_points !== null) {
    const num = Number(task.story_points);
    if (!isNaN(num) && num > 0) return num;
  }
  const estHours = Number(task.estimated_hours);
  if (!isNaN(estHours) && estHours > 0) {
    const pts = Math.round((estHours / 4) * 10) / 10;
    return Number.isInteger(pts) ? pts : pts;
  }
  const prio = (task.priority || 'MEDIUM').toUpperCase();
  const prioMap = { CRITICAL: 8, HIGH: 5, MEDIUM: 3, LOW: 1 };
  return prioMap[prio] || 3;
};

export const isTaskCompleted = (task) => {
  if (!task) return false;
  const st = (task.status || '').toUpperCase();
  return st === 'DONE' || st === 'COMPLETED';
};

export const calculateSprintMetrics = (sprintTasks = [], sprintConfig = {}) => {
  const totalDeliverables = sprintTasks.length;
  const completedTasks = sprintTasks.filter(isTaskCompleted);
  const remainingTasks = sprintTasks.filter(t => !isTaskCompleted(t));

  const plannedPoints = sprintTasks.reduce((sum, t) => sum + getTaskStoryPoints(t), 0);
  const completedPoints = completedTasks.reduce((sum, t) => sum + getTaskStoryPoints(t), 0);
  const remainingPoints = Math.max(0, plannedPoints - completedPoints);

  const roundedPlanned = Math.round(plannedPoints * 10) / 10;
  const roundedCompleted = Math.round(completedPoints * 10) / 10;
  const roundedRemaining = Math.round(remainingPoints * 10) / 10;

  // Capacity handling: strictly use configured capacity, never invent or default to 40
  const rawCap = sprintConfig.capacity ?? sprintConfig.velocity ?? sprintConfig.capacity_points;
  const capacity = (rawCap !== null && rawCap !== undefined && rawCap !== '' && !isNaN(Number(rawCap)) && Number(rawCap) > 0)
    ? Number(rawCap)
    : null;

  return {
    totalDeliverables,
    completedCount: completedTasks.length,
    remainingCount: remainingTasks.length,
    plannedPoints: Number.isInteger(roundedPlanned) ? roundedPlanned : roundedPlanned,
    completedPoints: Number.isInteger(roundedCompleted) ? roundedCompleted : roundedCompleted,
    remainingPoints: Number.isInteger(roundedRemaining) ? roundedRemaining : roundedRemaining,
    capacity,
    capacityDisplay: capacity ? `${capacity} SP` : 'Not configured'
  };
};


export const SprintPlanner = ({ onShowToast }) => {
  const { user } = useAuth();

  // Instant local/session caching to ensure zero empty flash on reload/cold start
  const [sprints, setSprints] = useState(() => {
    try {
      const c = sessionStorage.getItem('aureon_cached_sprints');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });
  const [projectsList, setProjectsList] = useState(() => {
    try {
      const c = sessionStorage.getItem('aureon_cached_projects');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });
  const [teamsList, setTeamsList] = useState(() => {
    try {
      const c = sessionStorage.getItem('aureon_cached_teams');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });
  const [developersList, setDevelopersList] = useState(() => {
    try {
      const c = sessionStorage.getItem('aureon_cached_users');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });
  const [tasks, setTasks] = useState(() => {
    try {
      const c = sessionStorage.getItem('aureon_cached_tasks');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState(() => {
    try {
      const c = sessionStorage.getItem('aureon_cached_sprints');
      if (c) {
        const parsed = JSON.parse(c);
        return parsed.length > 0 ? parsed[0] : null;
      }
      return null;
    } catch { return null; }
  });

  // Filters
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState(null);

  // Multi-Task / Batch Sprint Assignment State
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [batchAssigneeId, setBatchAssigneeId] = useState('');
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);

    // Skill Recommendation Modal State
  const [recommendingTask, setRecommendingTask] = useState(null);



  // Modal Form State - Strategic Sprint Milestone
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    projectName: '',
    assignedTeam: '',
    scrumMaster: '',
    capacityStoryPoints: '',
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
    required_skills: '',
    estimated_hours: 8,
    due_date: '2026-09-25'
  });

  const fetchSprintData = async (retryCount = 0) => {
    const headers = getAuthHeaders();
    if (!projectsList.length && !sprints.length) {
      setLoading(true);
    }

    try {
      const [spRes, prRes, tmRes, tkRes, usRes] = await Promise.all([
        fetch(`${API_BASE_URL}/sprints/`, { headers }),
        fetch(`${API_BASE_URL}/projects/`, { headers }),
        fetch(`${API_BASE_URL}/teams/`, { headers }),
        fetch(`${API_BASE_URL}/tasks/`, { headers }),
        fetch(`${API_BASE_URL}/users/`, { headers })
      ]);

      let hadError = false;

      if (prRes.ok) {
        const pData = await prRes.json();
        const projs = pData.projects || [];
        if (projs.length > 0) {
          setProjectsList(projs);
          sessionStorage.setItem('aureon_cached_projects', JSON.stringify(projs));
          if (!formData.projectId) {
            setFormData(prev => ({
              ...prev,
              projectId: projs[0].id,
              projectName: projs[0].name
            }));
          }
        }
      } else {
        hadError = true;
      }

      if (tmRes.ok) {
        const tData = await tmRes.json();
        const teams = tData.teams || [];
        if (teams.length > 0) {
          setTeamsList(teams);
          sessionStorage.setItem('aureon_cached_teams', JSON.stringify(teams));
          if (!formData.assignedTeam) {
            setFormData(prev => ({
              ...prev,
              assignedTeam: teams[0].name,
              scrumMaster: teams[0].lead_name || 'Team Lead'
            }));
          }
        }
      } else {
        hadError = true;
      }

      if (usRes.ok) {
        const uData = await usRes.json();
        const users = uData.users || [];
        if (users.length > 0) {
          setDevelopersList(users);
          sessionStorage.setItem('aureon_cached_users', JSON.stringify(users));
          if (!taskFormData.assigned_to) {
            setTaskFormData(prev => ({ ...prev, assigned_to: users[0].id }));
          }
        }
      }

      if (tkRes.ok) {
        const tkData = await tkRes.json();
        const tks = tkData.tasks || [];
        setTasks(tks);
        sessionStorage.setItem('aureon_cached_tasks', JSON.stringify(tks));
      }

      if (spRes.ok) {
        const sData = await spRes.json();
        const apiSprints = sData.sprints || [];
        if (apiSprints.length > 0) {
          setSprints(apiSprints);
          sessionStorage.setItem('aureon_cached_sprints', JSON.stringify(apiSprints));
          setSelectedSprint(prev => {
            if (prev) {
              const matched = apiSprints.find(s => String(s.id) === String(prev.id));
              return matched || apiSprints[0];
            }
            return apiSprints[0];
          });
        }
      } else {
        hadError = true;
      }

      // If backend was cold-starting or restarting, retry automatically up to 3 times
      if (hadError && retryCount < 3) {
        setTimeout(() => fetchSprintData(retryCount + 1), 2000);
      }
    } catch (err) {
      console.warn(`Sprint data fetch retry ${retryCount + 1}/3...`, err);
      if (retryCount < 3) {
        setTimeout(() => fetchSprintData(retryCount + 1), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprintData();
  }, []);

    // Reset member filter on sprint change
  useEffect(() => {
    setSelectedMemberFilter(null);
  }, [selectedSprint?.id]);

  // Resolve the sprint's specific assigned team
  const sprintTeam = useMemo(() => {
    if (!selectedSprint || !teamsList.length) return null;
    return teamsList.find(t => 
      (selectedSprint.team_id && String(t.id) === String(selectedSprint.team_id)) ||
      (selectedSprint.team_name && t.name === selectedSprint.team_name) ||
      (selectedSprint.team && t.name === selectedSprint.team)
    ) || null;
  }, [selectedSprint, teamsList]);

  // Resolve current project to fetch assigned Project Manager
  const currentProject = useMemo(() => {
    if (!projectsList.length) return null;
    const pId = selectedSprint?.project_id || selectedSprint?.projectId || formData.projectId;
    return projectsList.find(p => String(p.id) === String(pId)) || null;
  }, [selectedSprint, formData.projectId, projectsList]);

  // Strictly filter and prioritize squad roster members:
  // Priority Hierarchy: Project Manager (PM) -> Team Lead (TL) -> Developers -> QA Engineers
  const sprintDevelopers = useMemo(() => {
    const rawMap = new Map();

    const addMemberCandidate = (candidate, defaultRole = 'ROLE_DEV', defaultDesig = 'Software Engineer') => {
      if (!candidate || !candidate.id) return;
      const cId = String(candidate.id);
      if (rawMap.has(cId)) return;

      const u = developersList.find(d => String(d.id) === cId) || {};
      const full_name = candidate.full_name || candidate.name || u.full_name || u.name || candidate.email || u.email || 'Team Member';
      const role = candidate.role || candidate.role_name || u.role || u.role_name || defaultRole;
      const designation = candidate.designation || u.designation || defaultDesig;

      const userTasks = tasks.filter(t => String(t.assigned_to_id) === cId || t.assignee === full_name);
      const activeCount = userTasks.filter(t => !['COMPLETED', 'DONE', 'CLOSED', 'CANCELLED'].includes(t.status)).length;
      const completedCount = userTasks.filter(t => ['COMPLETED', 'DONE', 'CLOSED'].includes(t.status)).length;
      const isAvail = activeCount === 0;

      rawMap.set(cId, {
        id: candidate.id,
        name: candidate.name || full_name,
        full_name: full_name,
        email: candidate.email || u.email,
        role: role,
        designation: designation,
        status: isAvail ? (completedCount > 0 ? `Available (${completedCount} tasks completed)` : 'Available (Ready)') : `Busy (${activeCount} active)`,
        is_available: isAvail,
        active_tasks_count: activeCount,
        completed_tasks_count: completedCount
      });
    };

    // 1. Add Project Manager for this project
    if (currentProject) {
      const pmId = currentProject.manager_id || currentProject.project_manager_id;
      if (pmId) {
        const pmCandidate = developersList.find(d => String(d.id) === String(pmId)) || { id: pmId, name: currentProject.manager_name, role: 'ROLE_PM', designation: 'Project Manager' };
        addMemberCandidate(pmCandidate, 'ROLE_PM', 'Project Manager');
      }
    }

    // 2. Add Team Lead for this squad
    if (sprintTeam) {
      const leadId = sprintTeam.team_leader_id || sprintTeam.lead_id || (currentProject && (currentProject.lead_id || currentProject.team_lead_id));
      if (leadId) {
        const leadCandidate = developersList.find(d => String(d.id) === String(leadId)) || { id: leadId, name: sprintTeam.lead_name || sprintTeam.lead, role: 'ROLE_LEAD', designation: 'Technical Lead' };
        addMemberCandidate(leadCandidate, 'ROLE_LEAD', 'Technical Lead');
      }

      // 3. Add Squad Members from team details
      if (sprintTeam.member_details && sprintTeam.member_details.length > 0) {
        sprintTeam.member_details.forEach(m => addMemberCandidate(m));
      }
    } else {
      developersList.forEach(d => addMemberCandidate(d));
    }

    const membersArray = Array.from(rawMap.values());

    // Role priority ranking: PM (1) -> TL (2) -> DEV (3) -> QA (4)
    const getRoleRank = (dev) => {
      const role = (dev.role || '').toUpperCase();
      const desig = (dev.designation || '').toUpperCase();
      const pMgrId = currentProject?.manager_id || currentProject?.project_manager_id;
      const isPM = (pMgrId && String(dev.id) === String(pMgrId)) ||
                   role === 'ROLE_PM' || role.includes('PM') || role.includes('MANAGER') || desig.includes('PROJECT MANAGER');
      if (isPM) return 1;

      // Check QA before Lead to prevent Lead QA from becoming TL
      const isQA = role === 'ROLE_QA' || role.includes('QA') || role.includes('TEST') || desig.includes('QA') || desig.includes('TEST');
      if (isQA) return 4;

      const tLeadId = sprintTeam?.team_leader_id || sprintTeam?.lead_id || currentProject?.lead_id;
      const isLead = (tLeadId && String(dev.id) === String(tLeadId)) ||
                     role === 'ROLE_LEAD' || role.includes('LEAD') || role.includes('TL') || desig.includes('LEAD') || desig.includes('TECH LEAD');
      if (isLead) return 2;

      const isDev = role === 'ROLE_DEV' || role.includes('DEV') || desig.includes('DEVELOP') || desig.includes('ENGINEER');
      if (isDev) return 3;

      return 5;
    };

    return membersArray.sort((a, b) => {
      const rankA = getRoleRank(a);
      const rankB = getRoleRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return (a.full_name || a.name || '').localeCompare(b.full_name || b.name || '');
    });
  }, [sprintTeam, currentProject, developersList, tasks]);

  const formatDevOption = (dev) => {
    if (!dev) return 'Unassigned';
    const isAvail = dev.is_available;
    const completed = dev.completed_tasks_count || 0;
    const active = dev.active_tasks_count || 0;
    const availText = isAvail
      ? (completed > 0 ? `Available (${completed} completed)` : 'Available (Ready)')
      : `Busy (${active} active, ${completed} done)`;
    
    const roleRank = (dev.role === 'ROLE_PM' || dev.designation?.toLowerCase().includes('project manager')) ? 'PM' :
                     (dev.role === 'ROLE_QA' || dev.designation?.toLowerCase().includes('qa') || dev.designation?.toLowerCase().includes('test')) ? 'QA' :
                     (dev.role === 'ROLE_LEAD' || dev.role === 'ROLE_TL' || dev.designation?.toLowerCase().includes('lead')) ? 'TL' : 'DEV';

    return `[${roleRank}] ${dev.full_name || dev.name} — ${availText} ${isAvail ? '🟢' : '🔴'}`;
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
      const res = await fetch(`${API_BASE_URL}/sprints/${selectedSprint.id}/tasks/${taskId}`, {
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
      required_skills: taskFormData.required_skills || '',
      estimated_hours: Number(taskFormData.estimated_hours) || 8,
      due_date: taskFormData.due_date
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

    const targetCapacity = formData.capacityStoryPoints && !isNaN(Number(formData.capacityStoryPoints)) && Number(formData.capacityStoryPoints) > 0
      ? Number(formData.capacityStoryPoints)
      : null;

    const newSprint = {
      id: `SPR-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name,
      project_id: formData.projectId,
      project_name: formData.projectName || (projectsList.find(p => p.id === formData.projectId)?.name || 'General System'),
      assigned_team: formData.assignedTeam,
      team_lead: formData.scrumMaster,
      epic_category: formData.epicCategory,
      capacity: targetCapacity,
      velocity: targetCapacity,
      story_points: 0,
      planned_story_points: 0,
      completed_story_points: 0,
      remaining_story_points: 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      goal: formData.goal || 'Deliver sprint features on schedule.',
      status: 'PLANNING',
      totalTasks: 0,
      completedTasks: 0
    };

    setSprints([newSprint, ...sprints]);
    setSelectedSprint(newSprint);

    try {
      await fetch(`${API_BASE_URL}/sprints/`, {
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
      resource: targetCapacity
        ? `Strategic Sprint: ${newSprint.name} (${targetCapacity} Capacity SP)`
        : `Strategic Sprint: ${newSprint.name} (Capacity Unconfigured)`,
      status: 'SUCCESS'
    });

    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: 'Sprint Milestone Created',
        message: targetCapacity
          ? `${newSprint.name} committed with ${targetCapacity} Story Points capacity.`
          : `${newSprint.name} created. Story points will be calculated from committed tasks.`
      });
    }
    setIsModalOpen(false);
  };

  // Robust case-insensitive project and team matching
  const filteredSprints = useMemo(() => {
    return sprints.filter(sp => {
      const pid = String(sp.project_id || sp.projectId || '').toLowerCase();
      const pname = String(sp.project_name || sp.projectName || sp.project || '').toLowerCase();
      const targetP = String(projectFilter).toLowerCase();
      const matchProj = projectFilter === 'ALL' || pid === targetP || pname === targetP;

      const tid = String(sp.team_id || sp.teamId || '').toLowerCase();
      const tname = String(sp.assigned_team || sp.team_name || sp.team || '').toLowerCase();
      const targetT = String(teamFilter).toLowerCase();
      const matchTeam = teamFilter === 'ALL' || tid === targetT || tname === targetT;

      return matchProj && matchTeam;
    });
  }, [sprints, projectFilter, teamFilter]);

  // Synchronize selectedSprint whenever filteredSprints change so the active view NEVER stays stuck
  useEffect(() => {
    if (filteredSprints.length > 0) {
      const isCurrentInFiltered = selectedSprint && filteredSprints.some(s => String(s.id) === String(selectedSprint.id));
      if (!isCurrentInFiltered) {
        setSelectedSprint(filteredSprints[0]);
        setSelectedMemberFilter(null);
      }
    } else if (sprints.length > 0) {
      setSelectedSprint(null);
      setSelectedMemberFilter(null);
    }
  }, [filteredSprints]);

  const handleProjectFilterChange = (newProj) => {
    setProjectFilter(newProj);
    setSelectedMemberFilter(null);

    const matching = sprints.filter(sp => {
      if (newProj === 'ALL') return true;
      const pid = String(sp.project_id || sp.projectId || '').toLowerCase();
      const pname = String(sp.project_name || sp.projectName || sp.project || '').toLowerCase();
      const target = String(newProj).toLowerCase();
      return pid === target || pname === target;
    });

    if (matching.length > 0) {
      // Check if teamFilter still allows any matching sprint
      const teamMatch = matching.find(sp => {
        if (teamFilter === 'ALL') return true;
        const tid = String(sp.team_id || sp.teamId || '').toLowerCase();
        const tname = String(sp.assigned_team || sp.team_name || sp.team || '').toLowerCase();
        return tid === String(teamFilter).toLowerCase() || tname === String(teamFilter).toLowerCase();
      });

      if (teamMatch) {
        setSelectedSprint(teamMatch);
      } else {
        setTeamFilter('ALL');
        setSelectedSprint(matching[0]);
      }
    } else {
      setSelectedSprint(null);
    }
  };

  const handleTeamFilterChange = (newTeam) => {
    setTeamFilter(newTeam);
    setSelectedMemberFilter(null);

    const matching = sprints.filter(sp => {
      const pid = String(sp.project_id || sp.projectId || '').toLowerCase();
      const pname = String(sp.project_name || sp.projectName || sp.project || '').toLowerCase();
      const targetP = String(projectFilter).toLowerCase();
      const matchP = projectFilter === 'ALL' || pid === targetP || pname === targetP;

      const tid = String(sp.team_id || sp.teamId || '').toLowerCase();
      const tname = String(sp.assigned_team || sp.team_name || sp.team || '').toLowerCase();
      const targetT = String(newTeam).toLowerCase();
      const matchT = newTeam === 'ALL' || tid === targetT || tname === targetT;

      return matchP && matchT;
    });

    if (matching.length > 0) {
      setSelectedSprint(matching[0]);
    } else {
      setSelectedSprint(null);
    }
  };

  const selectedSprintTasks = useMemo(() => {
    if (!selectedSprint) return [];
    const sId = String(selectedSprint.id);
    const sProjId = selectedSprint.project_id || selectedSprint.projectId;

    return tasks.filter(t => {
      // Must match project if both have project_id to avoid cross-project leakage
      if (sProjId && t.project_id && String(t.project_id) !== String(sProjId)) {
        return false;
      }
      const matchId = t.sprint_id && String(t.sprint_id) === sId;
      const matchName = t.sprint_name && t.sprint_name === selectedSprint.name;
      return matchId || matchName;
    });
  }, [selectedSprint, tasks]);

  const selectedSprintMetrics = useMemo(() => {
    return calculateSprintMetrics(selectedSprintTasks, selectedSprint || {});
  }, [selectedSprintTasks, selectedSprint]);

  const displayedSprintTasks = useMemo(() => {
    if (!selectedMemberFilter) return selectedSprintTasks;
    const filterDev = sprintDevelopers.find(d => String(d.id) === String(selectedMemberFilter));
    const filterName = filterDev ? (filterDev.full_name || filterDev.name) : '';
    return selectedSprintTasks.filter(t => 
      String(t.assigned_to_id) === String(selectedMemberFilter) || 
      (filterName && (t.assignee === filterName || t.assignee_name === filterName))
    );
  }, [selectedSprintTasks, selectedMemberFilter, sprintDevelopers]);

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
              onChange={(e) => handleProjectFilterChange(e.target.value)}
              className="p-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold cursor-pointer"
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
              onChange={(e) => handleTeamFilterChange(e.target.value)}
              className="p-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold cursor-pointer"
            >
              <option value="ALL">All Teams ({teamsList.length})</option>
              {teamsList.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mr-2">Active Sprint Milestone:</label>
            <select
              value={selectedSprint?.id || ''}
              onChange={(e) => {
                const found = sprints.find(s => String(s.id) === String(e.target.value));
                if (found) {
                  setSelectedSprint(found);
                  setSelectedMemberFilter(null);
                }
              }}
              disabled={filteredSprints.length === 0}
              className="p-1.5 px-3 rounded-xl border border-indigo-400 dark:border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 text-xs font-bold cursor-pointer shadow-xs"
            >
              {filteredSprints.length === 0 ? (
                <option value="">No Sprints for Selection</option>
              ) : (
                filteredSprints.map(s => (
                  <option key={s.id} value={s.id}>
                    ⚡ {s.name} [{s.project_name || s.projectName || 'Project'}]
                  </option>
                ))
              )}
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
                  {selectedSprint.sprint_code || selectedSprint.code || (selectedSprint.id && String(selectedSprint.id).length > 8 ? 'SPRINT MILESTONE' : selectedSprint.id)}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white warm:text-[#342314]">{selectedSprint.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  ⚡ {selectedSprintMetrics.plannedPoints} Planned Story Points
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  selectedSprintMetrics.capacity
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}>
                  🎯 Capacity: {selectedSprintMetrics.capacityDisplay}
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

          {/* Verified Sprint Milestone Metrics from PostgreSQL Database */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 warm:bg-[#e8dbbe] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Sprint Timeline</span>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {selectedSprint.start_date || selectedSprint.startDate || '—'} → {selectedSprint.end_date || selectedSprint.endDate || '—'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 warm:bg-[#e8dbbe] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Sprint Capacity</span>
              <span className="font-mono text-xs font-extrabold text-slate-700 dark:text-slate-300 mt-0.5 block">
                {selectedSprintMetrics.capacityDisplay}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 warm:bg-[#e8dbbe] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Planned Points</span>
              <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                {selectedSprintMetrics.plannedPoints} SP ({selectedSprintMetrics.totalDeliverables} tasks)
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 warm:bg-[#e8dbbe] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Completed Points</span>
              <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {selectedSprintMetrics.completedPoints} SP ({selectedSprintMetrics.completedCount} finished)
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 warm:bg-[#e8dbbe] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Remaining Points</span>
              <span className="font-mono text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
                {selectedSprintMetrics.remainingPoints} SP ({selectedSprintMetrics.remainingCount} active)
              </span>
            </div>
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
                  {selectedMemberFilter && (
                    <button
                      type="button"
                      onClick={() => setSelectedMemberFilter(null)}
                      className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-200 cursor-pointer transition"
                    >
                      Clear Member Filter ✕
                    </button>
                  )}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {sprintDevelopers.map(dev => {
                  const inThisSprintCount = selectedSprintTasks.filter(t => String(t.assigned_to_id) === String(dev.id) || t.assignee === dev.full_name).length;
                  const isFiltered = String(selectedMemberFilter) === String(dev.id);
                  const roleRank = (dev.role === 'ROLE_PM' || dev.designation?.toLowerCase().includes('project manager')) ? 'PM' :
                                   (dev.role === 'ROLE_QA' || dev.designation?.toLowerCase().includes('qa') || dev.designation?.toLowerCase().includes('test')) ? 'QA' :
                                   (dev.role === 'ROLE_LEAD' || dev.role === 'ROLE_TL' || dev.designation?.toLowerCase().includes('lead')) ? 'TL' : 'DEV';

                  return (
                    <button
                      key={dev.id}
                      type="button"
                      onClick={() => setSelectedMemberFilter(prev => String(prev) === String(dev.id) ? null : dev.id)}
                      className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer w-full relative group hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 select-none ${
                        isFiltered
                          ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/70 shadow-md'
                          : dev.is_available
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      }`}
                      title={`Click to filter deliverables assigned to ${dev.full_name || dev.name}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
                            roleRank === 'PM' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                            roleRank === 'TL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                            roleRank === 'QA' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {roleRank}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate" title={dev.full_name || dev.name}>
                            {dev.full_name || dev.name}
                          </span>
                        </div>
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
                      {isFiltered && (
                        <div className="mt-1.5 pt-1 border-t border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                          <span>Filtering deliverables</span>
                          <span className="px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900">Click to reset</span>
                        </div>
                      )}
                    </button>
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
                  Sprint Deliverables & Developer Allocation ({selectedMemberFilter ? `${displayedSprintTasks.length} of ${selectedSprintTasks.length}` : selectedSprintTasks.length})
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

            {selectedMemberFilter && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-2 text-xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Filtered by team member: <strong>{sprintDevelopers.find(d => String(d.id) === String(selectedMemberFilter))?.full_name || 'Member'}</strong>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({displayedSprintTasks.length} task{displayedSprintTasks.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMemberFilter(null)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition shadow-xs"
                >
                  Clear Filter (Show All {selectedSprintTasks.length} Deliverables)
                </button>
              </div>
            )}

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

            {displayedSprintTasks.length === 0 ? (
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
                          checked={displayedSprintTasks.length > 0 && selectedTaskIds.length === displayedSprintTasks.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTaskIds(displayedSprintTasks.map(t => t.id));
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
                      <th className="p-3">Story Points</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Assigned Developer & Availability</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {displayedSprintTasks.map(task => {
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
                        <td className="p-3 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          ⚡ {getTaskStoryPoints(task)} SP <span className="text-[10px] text-slate-400 font-normal">({task.estimated_hours || 0}h)</span>
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
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRecommendingTask(task)}
                              className="px-2 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                              title="Recommend Best Developer (Skills & Capacity Match)"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> Recommend
                            </button>
                            <button
                              onClick={() => handleReturnToBacklog(task.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition"
                              title="Remove from this sprint and return to product backlog"
                            >
                              To Backlog
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
        </div>
      )}

      {/* Sprints Cards Grid */}
      {filteredSprints.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {projectFilter !== 'ALL' 
              ? `No Sprint Milestones Created for ${projectsList.find(p => p.id === projectFilter)?.name || 'Selected Project'}` 
              : 'No Sprint Milestones Created'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click <strong>"Create Strategic Sprint Milestone"</strong> to commit story points capacity, define timeboxed milestones, and assign teams.
          </p>
          <button
            type="button"
            onClick={() => {
              if (projectFilter !== 'ALL') {
                const foundP = projectsList.find(p => p.id === projectFilter);
                setFormData(prev => ({ ...prev, projectId: projectFilter, projectName: foundP?.name || '' }));
              }
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-xs transition"
          >
            Create Sprint Milestone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSprints.map(sp => {
            const spTasks = tasks.filter(t => {
              const spProjId = sp.project_id || sp.projectId;
              if (spProjId && t.project_id && String(t.project_id) !== String(spProjId)) return false;
              return (t.sprint_id && String(t.sprint_id) === String(sp.id)) || (t.sprint_name && t.sprint_name === sp.name);
            });
            const cardMetrics = calculateSprintMetrics(spTasks, sp);

            return (
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
                    ⚡ {cardMetrics.plannedPoints} Planned SP
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">{sp.startDate || sp.start_date || '—'} → {sp.endDate || sp.end_date || '—'}</span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{sp.name}</h4>
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    📁 Project: {sp.project_name || sp.projectName || 'Aureon SaaS'}
                  </div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                    👑 Scrum Master: {sp.team_lead || 'Krishna Deepesh'} ({sp.assigned_team || sp.team_name || 'Assigned Squad'})
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    🎯 Capacity: {cardMetrics.capacityDisplay}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium line-clamp-2">{sp.goal}</p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {cardMetrics.completedPoints} SP Delivered ({cardMetrics.completedCount} tasks)</span>
                    <span className="text-indigo-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {cardMetrics.remainingPoints} SP Remaining ({cardMetrics.remainingCount} tasks)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                      style={{ width: `${cardMetrics.plannedPoints > 0 ? ((cardMetrics.completedPoints / cardMetrics.plannedPoints) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
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
              <label className="block font-bold mb-1">4. Target Velocity Capacity (Story Points) (Optional)</label>
              <input
                type="number"
                value={formData.capacityStoryPoints || ''}
                onChange={(e) => setFormData({ ...formData, capacityStoryPoints: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                placeholder="Leave blank for Not configured, or enter target capacity"
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

          <div>
            <label className="block font-bold mb-1">Required Technical Skills (comma separated)</label>
            <input
              type="text"
              value={taskFormData.required_skills}
              onChange={(e) => setTaskFormData({ ...taskFormData, required_skills: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              placeholder="e.g. React, Python, PostgreSQL"
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

      {/* Skill-Based Task Recommendation Modal */}
      {recommendingTask && (
        <TaskSkillRecommendationModal
          task={recommendingTask}
          isOpen={Boolean(recommendingTask)}
          onClose={() => setRecommendingTask(null)}
          onConfirmed={(assigned) => {
            fetchSprintData();
            if (onShowToast) {
              onShowToast({
                type: 'success',
                title: 'Developer Assigned via Recommendation',
                message: `Task successfully assigned to ${assigned.user_name || 'selected candidate'}.`
              });
            }
          }}
        />
      )}
    </div>
  );
};
