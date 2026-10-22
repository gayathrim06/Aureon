import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { CheckSquare, Plus, Filter, FolderKanban, Users, Clock, AlertCircle, GitBranch, Columns, List, Shield, Bug, Wrench, FileCode, CheckCircle2 } from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';

export const TaskBreakdown = ({ onShowToast }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [sprintsList, setSprintsList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'

  // Filters
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [sprintFilter, setSprintFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Live Database Teams and Developers
  const [teamsList, setTeamsList] = useState([]);
  const [developersList, setDevelopersList] = useState([]);

  // Form State for Work Ticket Creation
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ticketType: 'Feature', // Feature, Bug Fix, Code Refactor, QA Test, Vulnerability
    parentSprintId: '',
    projectId: '',
    projectName: '',
    assignedTeam: '',
    assignedToId: '',
    assignee: '',
    priority: 'HIGH',
    gitBranch: 'feature/auth-module',
    estimatedHours: 8,
    dueDate: '2026-09-25'
  });

  const fetchData = async () => {
    const headers = getAuthHeaders();

    try {
      const [tRes, pRes, sRes, tmRes, uRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tasks/`, { headers }),
        fetch(`${API_BASE_URL}/projects/`, { headers }),
        fetch(`${API_BASE_URL}/sprints/`, { headers }),
        fetch(`${API_BASE_URL}/teams/`, { headers }),
        fetch(`${API_BASE_URL}/users/`, { headers })
      ]);

      let fetchedProjects = [];
      if (pRes.ok) {
        const pData = await pRes.json();
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

      if (sRes.ok) {
        const sData = await sRes.json();
        const spr = sData.sprints || [];
        setSprintsList(spr);
        if (spr.length > 0 && !formData.parentSprintId) {
          setFormData(prev => ({ ...prev, parentSprintId: spr[0].id }));
        }
      }

      if (tmRes.ok) {
        const tmData = await tmRes.json();
        const tms = tmData.teams || [];
        setTeamsList(tms);
        if (tms.length > 0 && !formData.assignedTeam) {
          setFormData(prev => ({ ...prev, assignedTeam: tms[0].name }));
        }
      }

      if (uRes.ok) {
        const uData = await uRes.json();
        const usrs = uData.users || [];
        setDevelopersList(usrs);
        if (usrs.length > 0 && !formData.assignedToId) {
          setFormData(prev => ({
            ...prev,
            assignedToId: usrs[0].id,
            assignee: usrs[0].full_name || usrs[0].email
          }));
        }
      }

      if (tRes.ok) {
        const tData = await tRes.json();
        setTasks(tData.tasks || []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProjectSelect = (projId) => {
    const found = projectsList.find(p => p.id === projId);
    const projSprints = sprintsList.filter(s => String(s.project_id) === String(projId));
    setFormData(prev => ({
      ...prev,
      projectId: projId,
      projectName: found ? found.name : '',
      parentSprintId: projSprints[0]?.id || ''
    }));
  };

  const handleSprintSelect = (sprintId) => {
    const foundSprint = sprintsList.find(s => String(s.id) === String(sprintId));
    setFormData(prev => ({
      ...prev,
      parentSprintId: sprintId,
      projectId: foundSprint?.project_id || prev.projectId,
      projectName: foundSprint?.project_name || prev.projectName
    }));
  };

  const handleDeveloperSelect = (devId) => {
    const dev = developersList.find(d => String(d.id) === String(devId));
    setFormData(prev => ({
      ...prev,
      assignedToId: devId,
      assignee: dev ? (dev.full_name || dev.email) : ''
    }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const parentSprint = sprintsList.find(s => String(s.id) === String(formData.parentSprintId));

    const payload = {
      title: formData.title,
      description: formData.description,
      ticket_type: formData.ticketType,
      sprint_id: formData.parentSprintId,
      project_id: formData.projectId,
      assigned_to: formData.assignedToId,
      priority: formData.priority,
      git_branch: formData.gitBranch || `feature/${formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      due_date: formData.dueDate,
      estimated_hours: Number(formData.estimatedHours) || 8
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
        logAuditEvent({
          user,
          role: user?.role,
          action: 'TASK_CREATE',
          resource: `Created Work Ticket: ${formData.title} in sprint ${parentSprint?.name || 'Sprint'} for ${formData.assignee}`,
          status: 'SUCCESS'
        });

        if (onShowToast) {
          onShowToast({
            type: 'success',
            title: 'Work Ticket Assigned',
            message: `Task committed to sprint ${parentSprint?.name || ''} and assigned to ${formData.assignee}.`
          });
        }
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        if (onShowToast) {
          onShowToast({
            type: 'error',
            title: 'Task Creation Failed',
            message: err.message || 'Could not create task.'
          });
        }
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
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
  };

  const handleApproveTask = async (taskId) => {
    if (!taskId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ approval_notes: 'Deliverable reviewed and approved by PM.' })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'COMPLETED', team_leader_review: 'Deliverable reviewed and approved by PM.' } : t));
        if (typeof onShowToast === 'function') {
          onShowToast({ type: 'success', title: 'Task Approved', message: 'Task marked COMPLETED and developer freed.' });
        }
      }
    } catch (err) {}
  };

  const filteredTasks = tasks.filter(t => {
    const matchProj = projectFilter === 'ALL' || !projectFilter || t.project_id === projectFilter || t.project_name === projectFilter || !t.project_id;
    const matchTeam = teamFilter === 'ALL' || !teamFilter || t.assigned_team === teamFilter || !t.assigned_team;
    const matchSprint = sprintFilter === 'ALL' || !sprintFilter || t.sprint_id === sprintFilter || t.sprint_name === sprintFilter || !t.sprint_id;
    const matchStatus = statusFilter === 'ALL' || !statusFilter || t.status === statusFilter;
    return matchProj && matchTeam && matchSprint && matchStatus;
  });

  const ticketTypeIcons = {
    Feature: <FileCode className="w-3.5 h-3.5 text-blue-500" />,
    'Bug Fix': <Bug className="w-3.5 h-3.5 text-rose-500" />,
    'Code Refactor': <Wrench className="w-3.5 h-3.5 text-purple-500" />,
    'QA Test': <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />,
    Vulnerability: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
  };

  const priorityColors = {
    CRITICAL: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold border border-rose-300',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-extrabold border border-orange-300',
    MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold border border-amber-300',
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-extrabold border border-blue-300'
  };

  const columns = [
    {
      key: 'id',
      label: 'Ticket ID & Type',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          {ticketTypeIcons[row.ticket_type] || <FileCode className="w-3.5 h-3.5 text-blue-500" />}
          <div>
            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{val ? String(val).substring(0, 8) : 'TCK'}</span>
            <span className="text-[10px] text-slate-400 font-medium">{row.ticket_type || 'Feature'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Work Ticket Summary & Git Branch',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">{val}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-500 font-medium">📁 {row.project_name || 'General System'}</span>
            <span className="font-mono text-[10px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded flex items-center gap-1">
              <GitBranch className="w-3 h-3" /> {row.git_branch || 'feature/main'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'sprint_name',
      label: 'Sprint Milestone',
      render: (val, row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
          ⚡ {val || (row?.is_orphan ? 'No Sprint (Needs Review)' : 'Backlog')}
        </span>
      )
    },
    {
      key: 'assigned_team',
      label: 'Department Team',
      render: (val) => (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
          {val || 'Development Team'}
        </span>
      )
    },
    {
      key: 'assignee',
      label: 'Developer Assignee',
      render: (val, row) => {
        const name = val || row?.assignee_name;
        if (!name || row?.needs_assignment) {
          return <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">⚠️ Needs Assignment</span>;
        }
        return <span className="font-extrabold text-slate-900 dark:text-white">{name}</span>;
      }
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] ${priorityColors[val] || 'bg-slate-100'}`}>{val}</span>
    },
    {
      key: 'status',
      label: 'Status & Approval',
      render: (val, row) => {
        if (val === 'IN_REVIEW') {
          return (
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-[11px] border border-amber-300">
                In Review
              </span>
              <button
                onClick={() => handleApproveTask(row.id)}
                className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
              >
                <CheckCircle2 className="w-3 h-3" /> Approve
              </button>
            </div>
          );
        }
        return (
          <select
            value={val}
            onChange={(e) => handleUpdateTaskStatus(row.id, e.target.value)}
            className="p-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="DONE">Done</option>
          </select>
        );
      }
    },
    {
      key: 'dueDate',
      label: 'Target Due Date',
      render: (val, row) => (
        <span className={`font-mono text-xs font-bold ${row?.is_overdue ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'}`}>
          {val || '2026-09-15'}
          {row?.is_overdue && <span className="block text-[9px] text-rose-500 font-extrabold uppercase">Overdue</span>}
        </span>
      )
    }
  ];

  const kanbanColumns = [
    { id: 'TODO', label: '📋 To Do', bg: 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800' },
    { id: 'IN_PROGRESS', label: '🚀 In Progress', bg: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900' },
    { id: 'REVIEW', label: '🔍 Code Review', bg: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900' },
    { id: 'DONE', label: '✅ Completed', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900' }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Task Breakdown" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-mono text-[10px] font-extrabold uppercase tracking-wider border border-purple-200">
              Engineering Work Ticket Board
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Engineering Tickets & Kanban Execution
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create actionable work tickets (Bugs, Features, Refactors), link to Sprint Milestones, assign to team developers, and track Kanban progress.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
              }`}
            >
              <Columns className="w-3.5 h-3.5" /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table List
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Create Work Ticket
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <Filter className="w-4 h-4 text-purple-500" /> Filter Ticket Board:
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
            <label className="text-[10px] font-bold text-slate-500 uppercase mr-2">Parent Sprint:</label>
            <select
              value={sprintFilter}
              onChange={(e) => setSprintFilter(e.target.value)}
              className="p-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
            >
              <option value="ALL">All Sprints ({sprintsList.length})</option>
              {sprintsList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mr-2">Department Team:</label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="p-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
            >
              <option value="ALL">All Departments</option>
              {teamsList.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* KANBAN BOARD COLUMNS */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {kanbanColumns.map(col => {
            const columnTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`p-4 rounded-3xl ${col.bg} border space-y-3 min-h-[500px] flex flex-col`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <h3 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300">{col.label}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnTasks.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs italic">
                      No tickets in this column
                    </div>
                  ) : (
                    columnTasks.map(ticket => (
                      <div
                        key={ticket.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            {ticket.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] ${priorityColors[ticket.priority] || 'bg-slate-100'}`}>
                            {ticket.priority}
                          </span>
                        </div>

                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                          {ticket.title}
                        </h4>

                        <div className="text-[10px] text-slate-500 font-medium">
                          📁 {ticket.project_name || 'Aureon SaaS'}
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            👤 {ticket.assignee || 'Unassigned'}
                          </span>
                          <select
                            value={ticket.status}
                            onChange={(e) => handleUpdateTaskStatus(ticket.id, e.target.value)}
                            className="p-0.5 px-1.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-300"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVIEW">Code Review</option>
                            <option value="DONE">Done</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TASKS TABLE VIEW */
        <DataTable
          columns={columns}
          data={filteredTasks}
          searchPlaceholder="Search tickets by ID, summary, assignee, branch..."
        />
      )}

      {/* CREATE WORK TICKET MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Engineering Work Ticket & Developer Assignment">
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          {/* Step 1 & Step 2: Project -> Sprint Hierarchy */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
            <div>
              <label className="block font-bold mb-1 text-indigo-900 dark:text-indigo-200">1. Target Project *</label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
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
              <label className="block font-bold mb-1 text-indigo-900 dark:text-indigo-200">2. Sprint Milestone *</label>
              <select
                required
                value={formData.parentSprintId}
                onChange={(e) => handleSprintSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
              >
                {sprintsList.filter(s => !formData.projectId || String(s.project_id) === String(formData.projectId)).length === 0 ? (
                  <option value="">No Sprints for this project</option>
                ) : (
                  sprintsList
                    .filter(s => !formData.projectId || String(s.project_id) === String(formData.projectId))
                    .map(s => (
                      <option key={s.id} value={s.id}>⚡ {s.name}</option>
                    ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">3. Work Ticket Summary / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement JWT Token Rotation & Blacklist Redis Key"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">4. Technical Scope & Description</label>
            <textarea
              rows={2}
              placeholder="Describe deliverables and testing criteria..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">5. Assign Developer *</label>
              <select
                required
                value={formData.assignedToId}
                onChange={(e) => handleDeveloperSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              >
                <option value="">Select Developer</option>
                {developersList.map(dev => (
                  <option key={dev.id} value={dev.id}>
                    👤 {dev.full_name || dev.email} ({dev.role || 'DEV'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">6. Ticket Category</label>
              <select
                value={formData.ticketType}
                onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              >
                <option value="Feature">💻 Feature Development</option>
                <option value="Bug Fix">🐞 Bug Fix / Incident</option>
                <option value="Code Refactor">🛠️ Code Refactor / Debt</option>
                <option value="QA Test">🧪 QA Test Suite</option>
                <option value="Vulnerability">🛡️ Security Vulnerability</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              >
                <option value="LOW">🔵 Low Priority</option>
                <option value="MEDIUM">🟡 Medium Priority</option>
                <option value="HIGH">🟠 High Priority</option>
                <option value="CRITICAL">🔴 Critical Priority</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Target Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>
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
              Create Work Ticket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
