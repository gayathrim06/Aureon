import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { Users, CheckSquare, Plus, Layers, ShieldCheck, UserCheck, CheckCircle2 } from 'lucide-react';

export const DeveloperRoster = ({ onShowToast }) => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [taskModalDev, setTaskModalDev] = useState(null);
  const [sprintModalDev, setSprintModalDev] = useState(null);

  // Form Data for Task Assignment
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'HIGH',
    gitBranch: 'feature/auth-module',
    dueDate: '2026-09-15'
  });

  // Form Data for Sprint Assignment
  const [sprintFormData, setSprintFormData] = useState({
    name: '',
    goal: '',
    projectId: '',
    storyPoints: 40,
    startDate: '2026-09-01',
    endDate: '2026-09-15'
  });

  const defaultTeamDevelopers = [
    { id: '22222222-2222-2222-2222-222222222222', full_name: 'Sainu Anna Sajan', email: 'sainu@aureon.com', designation: 'React UI Developer', role_name: 'ROLE_DEV' },
    { id: '44444444-4444-4444-4444-444444444444', full_name: 'Ram Kumar', email: 'ram@aureon.com', designation: 'Full Stack Engineer', role_name: 'ROLE_DEV' },
    { id: '55555555-5555-5555-5555-555555555555', full_name: 'Priya Sharma', email: 'priya@aureon.com', designation: 'Database Engineer', role_name: 'ROLE_DEV' },
    { id: '66666666-6666-6666-6666-666666666666', full_name: 'Venu QA', email: 'venu@aureon.com', designation: 'Lead QA Engineer', role_name: 'ROLE_QA' }
  ];

  const fetchData = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

    try {
      const [uRes, tRes, pRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/users/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/tasks/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/projects/', { headers })
      ]);

      let realUsers = [];
      let realTasks = [];
      let realProjs = [];

      if (uRes.ok) {
        const uData = await uRes.json();
        realUsers = uData.users || [];
      }

      if (tRes.ok) {
        const tData = await tRes.json();
        realTasks = tData.tasks || [];
        setTasksList(realTasks);
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        realProjs = pData.projects || [];
        setProjectsList(realProjs);
        if (realProjs.length > 0) {
          setTaskFormData(prev => ({ ...prev, projectId: realProjs[0].id }));
          setSprintFormData(prev => ({ ...prev, projectId: realProjs[0].id }));
        }
      }

      // Filter out Project Managers (PMs like Gopika Manoj should NOT be listed in developer team roster)
      const teamDevsOnly = realUsers.filter(u => {
        const rName = (u.role_name || u.role || u.role_code || '').toUpperCase();
        const desig = (u.designation || '').toLowerCase();
        return rName !== 'ROLE_PM' && !desig.includes('project manager') && !desig.includes('manager');
      });

      if (teamDevsOnly.length > 0) {
        setUsersList(teamDevsOnly);
      } else {
        setUsersList(defaultTeamDevelopers);
      }
    } catch (err) {
      setUsersList(defaultTeamDevelopers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handleAssignTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskFormData.title.trim() || !taskModalDev) return;

    const newTask = {
      title: taskFormData.title,
      description: taskFormData.description,
      priority: taskFormData.priority,
      status: 'TODO',
      project_id: taskFormData.projectId,
      assigned_to: taskModalDev.full_name || taskModalDev.name,
      assigned_to_id: taskModalDev.id,
      dueDate: taskFormData.dueDate,
      git_branch: taskFormData.gitBranch
    };

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

    fetchData(); // Refresh live tasks

    logAuditEvent({
      user,
      role: user?.role,
      action: 'LEAD_TASK_ASSIGN',
      resource: `Assigned task '${newTask.title}' to ${taskModalDev.full_name || taskModalDev.name}`,
      status: 'SUCCESS'
    });

    if (typeof onShowToast === 'function') {
      onShowToast({ type: 'success', title: 'Task Assigned', message: `Work ticket assigned directly to ${taskModalDev.full_name || taskModalDev.name}.` });
    }
    setTaskModalDev(null);
  };

  const handleAssignSprintSubmit = async (e) => {
    e.preventDefault();
    if (!sprintFormData.name.trim() || !sprintModalDev) return;

    const foundProj = projectsList.find(p => p.id === sprintFormData.projectId);

    const newSprint = {
      name: sprintFormData.name,
      goal: sprintFormData.goal,
      story_points: Number(sprintFormData.storyPoints) || 40,
      project_id: sprintFormData.projectId,
      project_name: foundProj ? foundProj.name : 'Verona Organic',
      scrum_master: sprintModalDev.full_name || sprintModalDev.name,
      assigned_team: 'Engineering Team',
      start_date: sprintFormData.startDate,
      end_date: sprintFormData.endDate,
      status: 'PLANNING'
    };

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
      action: 'LEAD_SPRINT_ASSIGN',
      resource: `Assigned sprint '${newSprint.name}' to ${sprintModalDev.full_name || sprintModalDev.name}`,
      status: 'SUCCESS'
    });

    if (typeof onShowToast === 'function') {
      onShowToast({ type: 'success', title: 'Sprint Milestone Assigned', message: `Sprint '${newSprint.name}' assigned to ${sprintModalDev.full_name || sprintModalDev.name}.` });
    }
    setSprintModalDev(null);
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Developer Roster" />

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Virtual Team Developers & Engineer Allocation
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Engineering team members assisting Tech Lead Krishna Deepesh on project deliverables, live task execution metrics, and direct work allocation.
        </p>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {usersList.map((u) => {
          const uName = u.full_name || u.name || u.username || 'Team Member';
          const userTasks = tasksList.filter(t => {
            const assigneeStr = (t.assignee_name || t.assignee || '').toLowerCase();
            const searchStr = uName.toLowerCase();
            return assigneeStr.includes(searchStr) || searchStr.includes(assigneeStr);
          });
          const doneTasks = userTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED');
          const totalAssigned = userTasks.length;
          const completedCount = doneTasks.length;
          const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

          return (
            <div key={u.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {getInitials(uName)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{uName}</h3>
                  <p className="text-[11px] text-slate-500 font-bold truncate">{u.designation || u.role_name || u.role || 'Software Engineer'}</p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono truncate">{u.email}</p>
                </div>
              </div>

              {/* Real Task Metrics */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Assigned Work Tickets:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{totalAssigned} Tasks</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Finished Deliverables:</span>
                  <strong className="text-emerald-600 font-mono">{completedCount} Finished</strong>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                    <span>Task Completion Rate</span>
                    <span className="text-indigo-600">{completionRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setTaskModalDev(u)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Assign Task
                </button>
                <button
                  onClick={() => setSprintModalDev(u)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Layers className="w-3.5 h-3.5" /> Assign Sprint
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ASSIGN TASK DIRECTLY TO USER */}
      <Modal isOpen={Boolean(taskModalDev)} onClose={() => setTaskModalDev(null)} title={`Assign Work Ticket directly to ${taskModalDev?.full_name || taskModalDev?.name || 'User'}`}>
        <form onSubmit={handleAssignTaskSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">Work Ticket Summary / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement OAuth2 Token Refresh and Redis Cache Strategy"
              value={taskFormData.title}
              onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Target Project *</label>
              <select
                required
                value={taskFormData.projectId}
                onChange={(e) => setTaskFormData({ ...taskFormData, projectId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              >
                {projectsList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Priority</label>
              <select
                value={taskFormData.priority}
                onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
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
              <label className="block font-bold mb-1">Git Repository Branch</label>
              <input
                type="text"
                placeholder="e.g. feature/auth-oauth2"
                value={taskFormData.gitBranch}
                onChange={(e) => setTaskFormData({ ...taskFormData, gitBranch: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Target Due Date</label>
              <input
                type="date"
                value={taskFormData.dueDate}
                onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button type="button" onClick={() => setTaskModalDev(null)} className="px-3 py-2 text-xs font-bold text-slate-500">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">Assign Task Ticket</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ASSIGN SPRINT DIRECTLY TO USER */}
      <Modal isOpen={Boolean(sprintModalDev)} onClose={() => setSprintModalDev(null)} title={`Assign Sprint Milestone to ${sprintModalDev?.full_name || sprintModalDev?.name || 'User'}`}>
        <form onSubmit={handleAssignSprintSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">Sprint Milestone Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sprint 2026-Q3-02: Microservices Refactor Milestone"
              value={sprintFormData.name}
              onChange={(e) => setSprintFormData({ ...sprintFormData, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Target Project *</label>
              <select
                required
                value={sprintFormData.projectId}
                onChange={(e) => setSprintFormData({ ...sprintFormData, projectId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              >
                {projectsList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Story Points Capacity</label>
              <input
                type="number"
                value={sprintFormData.storyPoints}
                onChange={(e) => setSprintFormData({ ...sprintFormData, storyPoints: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Sprint Goal Deliverables</label>
            <input
              type="text"
              placeholder="e.g. Deliver core auth endpoints and 100% unit test coverage."
              value={sprintFormData.goal}
              onChange={(e) => setSprintFormData({ ...sprintFormData, goal: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Start Date</label>
              <input
                type="date"
                value={sprintFormData.startDate}
                onChange={(e) => setSprintFormData({ ...sprintFormData, startDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">End Date</label>
              <input
                type="date"
                value={sprintFormData.endDate}
                onChange={(e) => setSprintFormData({ ...sprintFormData, endDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button type="button" onClick={() => setSprintModalDev(null)} className="px-3 py-2 text-xs font-bold text-slate-500">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">Assign Sprint Milestone</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
