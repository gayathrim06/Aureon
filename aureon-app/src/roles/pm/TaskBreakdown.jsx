import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { CheckSquare, Plus, Filter, FolderKanban, Users, Clock, AlertCircle } from 'lucide-react';

export const TaskBreakdown = ({ onShowToast }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [sprintsList, setSprintsList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Available Teams & Members Mapping
  const teamMembersMap = {
    'Frontend Development Team': [
      { name: 'Ram Kumar', role: 'Frontend UI Engineer' },
      { id: 'usr_dev_1', name: 'Sainu Anna', role: 'React Engineer' }
    ],
    'Backend & Microservices Team': [
      { name: 'David Chen', role: 'Lead Architect' },
      { name: 'Priya Sharma', role: 'Database Engineer' },
      { name: 'Rinta Thomas', role: 'Full Stack Dev' }
    ],
    'QA & Test Automation Team': [
      { name: 'Venu QA', role: 'Lead QA Engineer' },
      { name: 'Ananya Varma', role: 'Test Specialist' }
    ],
    'DevOps & Cloud Infra Team': [
      { name: 'Alex Rivera', role: 'DevOps Lead' },
      { name: 'Michael Brown', role: 'Security Engineer' }
    ]
  };

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    projectName: '',
    assignedTeam: 'Frontend Development Team',
    assignee: 'Ram Kumar',
    priority: 'HIGH',
    type: 'Feature',
    estimatedHours: 8,
    dueDate: '2026-09-15'
  });

  const fetchData = async () => {
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

    try {
      const [tRes, pRes, sRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/tasks/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/projects/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/sprints/', { headers })
      ]);

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

      if (sRes.ok) {
        const sData = await sRes.json();
        setSprintsList(sData.sprints || []);
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
    setFormData(prev => ({
      ...prev,
      projectId: projId,
      projectName: found ? found.name : ''
    }));
  };

  const handleTeamSelect = (teamName) => {
    const members = teamMembersMap[teamName] || [];
    setFormData(prev => ({
      ...prev,
      assignedTeam: teamName,
      assignee: members.length > 0 ? members[0].name : 'Unassigned'
    }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newTask = {
      id: `TASK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: formData.title,
      description: formData.description,
      project_id: formData.projectId,
      project_name: formData.projectName || (projectsList.find(p => p.id === formData.projectId)?.name || 'General System'),
      assigned_team: formData.assignedTeam,
      assignee: formData.assignee,
      priority: formData.priority,
      status: 'TODO',
      type: formData.type,
      dueDate: formData.dueDate,
      estimatedHours: Number(formData.estimatedHours) || 8,
      loggedHours: 0
    };

    setTasks([newTask, ...tasks]);

    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      await fetch('http://127.0.0.1:8000/api/v1/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(newTask)
      });
    } catch (err) {}

    logAuditEvent({
      user,
      role: user?.role,
      action: 'TASK_CREATE',
      resource: `Created Task: ${newTask.title} for ${newTask.assignee} (${newTask.assigned_team})`,
      status: 'SUCCESS'
    });

    if (onShowToast) onShowToast({ type: 'success', title: 'Task Assigned', message: `Task '${newTask.title}' assigned to ${newTask.assignee}.` });
    setIsModalOpen(false);
    setFormData({
      title: '',
      description: '',
      projectId: projectsList[0]?.id || '',
      projectName: projectsList[0]?.name || '',
      assignedTeam: 'Frontend Development Team',
      assignee: 'Ram Kumar',
      priority: 'HIGH',
      type: 'Feature',
      estimatedHours: 8,
      dueDate: '2026-09-15'
    });
  };

  const filteredTasks = tasks.filter(t => {
    const matchProj = projectFilter === 'ALL' || t.project_id === projectFilter || t.project_name === projectFilter;
    const matchTeam = teamFilter === 'ALL' || t.assigned_team === teamFilter;
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchProj && matchTeam && matchStatus;
  });

  const priorityColors = {
    CRITICAL: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold border border-rose-300',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-bold border border-orange-300',
    MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-300',
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold border border-blue-300'
  };

  const statusColors = {
    TODO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
  };

  const columns = [
    {
      key: 'id',
      label: 'Task ID',
      render: (val) => <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{val}</span>
    },
    {
      key: 'title',
      label: 'Task Title & Project',
      render: (val, row) => (
        <div>
          <div className="font-extrabold text-slate-900 dark:text-white">{val}</div>
          <div className="text-[10px] text-slate-500 font-medium">📁 Project: {row.project_name || 'General System'}</div>
        </div>
      )
    },
    {
      key: 'assigned_team',
      label: 'Assigned Department',
      render: (val, row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
          {val || row.assigned_team || 'Development Team'}
        </span>
      )
    },
    {
      key: 'assignee',
      label: 'Assignee Member',
      render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val || 'Unassigned'}</span>
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] ${priorityColors[val] || 'bg-slate-100'}`}>{val}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[val] || 'bg-slate-100'}`}>{(val || 'TODO').replace('_',' ')}</span>
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (val) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400 font-bold">{val || '2026-09-15'}</span>
    }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Task Breakdown" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-500" />
            Task Breakdown & Multi-Team Task Allocation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            PM Governance: Assign tasks to specific project modules, select target department team (Frontend, Backend, QA, DevOps), and assign team members.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create & Assign Task
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <Filter className="w-4 h-4 text-indigo-500" /> Filter Tasks By:
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
            <label className="text-[10px] font-bold text-slate-500 uppercase mr-2">Department / Team:</label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="p-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
            >
              <option value="ALL">All Teams</option>
              {Object.keys(teamMembersMap).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mr-2">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">In Review</option>
              <option value="DONE">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['TODO','IN_PROGRESS','REVIEW','DONE'].map(s => {
          const count = filteredTasks.filter(t => t.status === s).length;
          const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', REVIEW: 'In Review', DONE: 'Completed' };
          const colors = { TODO: 'border-l-slate-500', IN_PROGRESS: 'border-l-blue-500', REVIEW: 'border-l-amber-500', DONE: 'border-l-emerald-500' };
          return (
            <div key={s} className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border-l-4 ${colors[s]} border-y border-r border-slate-200 dark:border-slate-800 shadow-xs`}>
              <div className="text-[11px] font-bold text-slate-500 uppercase">{labels[s]}</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Tasks Table */}
      <DataTable
        columns={columns}
        data={filteredTasks}
        searchPlaceholder="Search tasks by title, project, assignee..."
      />

      {/* CREATE & ASSIGN TASK MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="PM Governance: Create Task & Assign Member">
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">1. Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  <option value="">No projects created yet (Create Project first)</option>
                ) : (
                  projectsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">3. Department / Team *</label>
              <select
                required
                value={formData.assignedTeam}
                onChange={(e) => handleTeamSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              >
                {Object.keys(teamMembersMap).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">4. Assignee Member *</label>
              <select
                required
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              >
                {(teamMembersMap[formData.assignedTeam] || []).map(m => (
                  <option key={m.name} value={m.name}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">5. Task Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Estimated Hours</label>
              <input
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Due Date</label>
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
              Save & Assign Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
