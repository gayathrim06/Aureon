import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { Users, GitCommit, CheckSquare, Code2, Clock, Plus, Layers, TrendingUp, ShieldCheck, UserCheck, Award } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export const DeveloperRoster = ({ onShowToast }) => {
  const { user } = useAuth();

  // Developers Team Roster with Performance & Improvement Metrics
  const initialRoster = [
    {
      id: 'DEV-001',
      name: 'Sainu Anna Sajan',
      email: 'sainu@aureon.com',
      role: 'React UI Developer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      velocity: 96,
      improvementRate: '+14%',
      status: 'AVAILABLE',
      commits: 48,
      tasksCompleted: 16,
      prs: 9,
      codeReviews: 14,
      avgTaskTime: '3.5h',
      radar: [
        { metric: 'Commits', value: 90 },
        { metric: 'Tasks', value: 85 },
        { metric: 'PRs', value: 88 },
        { metric: 'Reviews', value: 92 },
        { metric: 'Velocity', value: 96 }
      ]
    },
    {
      id: 'DEV-002',
      name: 'Ram Kumar',
      email: 'ram@aureon.com',
      role: 'Full Stack Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      velocity: 92,
      improvementRate: '+10%',
      status: 'HIGH_CAPACITY',
      commits: 42,
      tasksCompleted: 14,
      prs: 7,
      codeReviews: 12,
      avgTaskTime: '4.1h',
      radar: [
        { metric: 'Commits', value: 84 },
        { metric: 'Tasks', value: 80 },
        { metric: 'PRs', value: 78 },
        { metric: 'Reviews', value: 85 },
        { metric: 'Velocity', value: 92 }
      ]
    },
    {
      id: 'DEV-003',
      name: 'Priya Sharma',
      email: 'priya@aureon.com',
      role: 'Database Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      velocity: 89,
      improvementRate: '+8%',
      status: 'AVAILABLE',
      commits: 35,
      tasksCompleted: 12,
      prs: 6,
      codeReviews: 15,
      avgTaskTime: '4.8h',
      radar: [
        { metric: 'Commits', value: 75 },
        { metric: 'Tasks', value: 78 },
        { metric: 'PRs', value: 70 },
        { metric: 'Reviews', value: 95 },
        { metric: 'Velocity', value: 89 }
      ]
    },
    {
      id: 'DEV-004',
      name: 'Venu QA',
      email: 'venu@aureon.com',
      role: 'Lead QA Engineer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      velocity: 95,
      improvementRate: '+15%',
      status: 'AVAILABLE',
      commits: 38,
      tasksCompleted: 18,
      prs: 8,
      codeReviews: 22,
      avgTaskTime: '2.9h',
      radar: [
        { metric: 'Commits', value: 80 },
        { metric: 'Tasks', value: 95 },
        { metric: 'PRs', value: 82 },
        { metric: 'Reviews', value: 98 },
        { metric: 'Velocity', value: 95 }
      ]
    }
  ];

  const [roster, setRoster] = useState(initialRoster);
  const [projectsList, setProjectsList] = useState([]);

  // Assignment Modal States
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

  useEffect(() => {
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

    fetch('http://127.0.0.1:8000/api/v1/projects/', { headers })
      .then(res => res.json())
      .then(data => {
        const projs = data.projects || [];
        setProjectsList(projs);
        if (projs.length > 0) {
          setTaskFormData(prev => ({ ...prev, projectId: projs[0].id }));
          setSprintFormData(prev => ({ ...prev, projectId: projs[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  const handleAssignTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskFormData.title.trim() || !taskModalDev) return;

    const foundProj = projectsList.find(p => p.id === taskFormData.projectId);

    const newTask = {
      title: taskFormData.title,
      description: taskFormData.description,
      priority: taskFormData.priority,
      status: 'TODO',
      project_id: taskFormData.projectId,
      assigned_to: taskModalDev.name,
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

    // Update local state metrics for dev
    setRoster(prev => prev.map(d => d.name === taskModalDev.name ? { ...d, tasksCompleted: d.tasksCompleted + 1 } : d));

    logAuditEvent({
      user,
      role: user?.role,
      action: 'LEAD_TASK_ASSIGN',
      resource: `Assigned task '${newTask.title}' to ${taskModalDev.name}`,
      status: 'SUCCESS'
    });

    if (onShowToast) onShowToast({ type: 'success', title: 'Task Assigned', message: `Work ticket assigned directly to ${taskModalDev.name}.` });
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
      scrum_master: sprintModalDev.name,
      assigned_team: sprintModalDev.role.includes('QA') ? 'QA & Test Automation Team' : 'Frontend Development Team',
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
      resource: `Assigned sprint '${newSprint.name}' to ${sprintModalDev.name}`,
      status: 'SUCCESS'
    });

    if (onShowToast) onShowToast({ type: 'success', title: 'Sprint Milestone Assigned', message: `Sprint '${newSprint.name}' assigned to ${sprintModalDev.name}.` });
    setSprintModalDev(null);
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Developer Roster" />

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Developer Roster & Performance Improvement Hub
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View team member productivity, track velocity improvement rates, and assign tasks and sprints directly to developers.
        </p>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roster.map((dev) => (
          <div key={dev.id} className="p-6 rounded-3xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-4 hover:shadow-md transition-all">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src={dev.avatar} alt={dev.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-200 dark:border-indigo-800 shadow-sm" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white warm:text-[#342314]">{dev.name}</h3>
                  <p className="text-xs text-slate-500 font-bold">{dev.role} • <span className="font-mono text-indigo-600 dark:text-indigo-400">{dev.email}</span></p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] flex items-center gap-1 border border-emerald-300">
                      ⚡ {dev.velocity}% Velocity Rate
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-extrabold text-[10px] flex items-center gap-1 border border-purple-300">
                      <TrendingUp className="w-3 h-3 text-purple-600" /> {dev.improvementRate} Improvement
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Direct Assignment */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <button
                  onClick={() => setTaskModalDev(dev)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Assign Task
                </button>
                <button
                  onClick={() => setSprintModalDev(dev)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Layers className="w-3.5 h-3.5" /> Assign Sprint
                </button>
              </div>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] border border-slate-100 dark:border-slate-800">
                <GitCommit className="w-3.5 h-3.5 mx-auto text-blue-500" />
                <div className="text-xs font-black text-slate-900 dark:text-white mt-1">{dev.commits}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Commits</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] border border-slate-100 dark:border-slate-800">
                <CheckSquare className="w-3.5 h-3.5 mx-auto text-emerald-500" />
                <div className="text-xs font-black text-slate-900 dark:text-white mt-1">{dev.tasksCompleted}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Done</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] border border-slate-100 dark:border-slate-800">
                <Code2 className="w-3.5 h-3.5 mx-auto text-purple-500" />
                <div className="text-xs font-black text-slate-900 dark:text-white mt-1">{dev.prs}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">PRs</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] border border-slate-100 dark:border-slate-800">
                <Users className="w-3.5 h-3.5 mx-auto text-amber-500" />
                <div className="text-xs font-black text-slate-900 dark:text-white mt-1">{dev.codeReviews}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Reviews</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] border border-slate-100 dark:border-slate-800">
                <Clock className="w-3.5 h-3.5 mx-auto text-indigo-500" />
                <div className="text-xs font-black text-slate-900 dark:text-white mt-1">{dev.avgTaskTime}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Turnaround</div>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={dev.radar}>
                  <PolarGrid stroke="#475569" opacity={0.3} />
                  <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={9} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                  <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ASSIGN TASK DIRECTLY TO DEVELOPER */}
      <Modal isOpen={Boolean(taskModalDev)} onClose={() => setTaskModalDev(null)} title={`Assign Work Ticket directly to ${taskModalDev?.name || 'Developer'}`}>
        <form onSubmit={handleAssignTaskSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">Work Ticket Summary / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement OAuth2 Token Refresh and Redis Cache Strategy"
              value={taskFormData.title}
              onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
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
              <label className="block font-bold mb-1">Git Repository Branch</label>
              <input
                type="text"
                placeholder="e.g. feature/auth-oauth2"
                value={taskFormData.gitBranch}
                onChange={(e) => setTaskFormData({ ...taskFormData, gitBranch: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Target Due Date</label>
              <input
                type="date"
                value={taskFormData.dueDate}
                onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button type="button" onClick={() => setTaskModalDev(null)} className="px-3 py-2 text-xs font-bold text-slate-500">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">Assign Task Ticket</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ASSIGN SPRINT DIRECTLY TO DEVELOPER */}
      <Modal isOpen={Boolean(sprintModalDev)} onClose={() => setSprintModalDev(null)} title={`Assign Sprint Milestone to ${sprintModalDev?.name || 'Developer'}`}>
        <form onSubmit={handleAssignSprintSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">Sprint Milestone Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sprint 2026-Q3-02: Microservices Refactor Milestone"
              value={sprintFormData.name}
              onChange={(e) => setSprintFormData({ ...sprintFormData, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
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
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
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
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Start Date</label>
              <input
                type="date"
                value={sprintFormData.startDate}
                onChange={(e) => setSprintFormData({ ...sprintFormData, startDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">End Date</label>
              <input
                type="date"
                value={sprintFormData.endDate}
                onChange={(e) => setSprintFormData({ ...sprintFormData, endDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
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
