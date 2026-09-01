import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { CheckSquare, Plus, Filter, Search, UserCheck, Layers, ArrowRight, Code2, Bug } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Tasks = () => {
  const { user, showToast } = useAuth();
  const [taskList, setTaskList] = useState([
    { id: 'TASK-201', title: 'Implement REST API OAuth2 Authentication', project: 'Aureon Core API Gateway', assignee: 'Jiya Thomas (Backend Dev)', assigned_by: 'David Chen (Tech Lead)', status: 'In Progress', priority: 'HIGH', module: 'Backend REST API' },
    { id: 'TASK-202', title: 'Design High-Contrast Theme System in React', project: 'Aureon Core API Gateway', assignee: 'Sainu Anna Sajan (Frontend Dev)', assigned_by: 'David Chen (Tech Lead)', status: 'In Progress', priority: 'HIGH', module: 'Frontend UI/UX' },
    { id: 'TASK-203', title: 'Automated Pytest & SonarQube Quality Scanner', project: 'SonarQube Scanner', assignee: 'Venu QA (QA Lead)', assigned_by: 'Krishna Deepesh (Tech Lead)', status: 'Completed', priority: 'HIGH', module: 'QA Test Automation' },
    { id: 'TASK-204', title: 'Cloud Telemetry Prometheus Collector', project: 'Cloud Telemetry Mesh', assignee: 'Alex Rivera (DevOps)', assigned_by: 'Krishna Deepesh (Tech Lead)', status: 'In Progress', priority: 'MEDIUM', module: 'Infrastructure' }
  ]);

  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Team Lead Work Distribution State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProject, setTaskProject] = useState('Aureon Core API Gateway');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState('HIGH');
  const [taskModule, setTaskModule] = useState('Backend API');

  const teamMembers = [
    { id: 'usr_dev_1', name: 'Sainu Anna Sajan (Frontend Dev)', role: 'Developer' },
    { id: 'usr_dev_2', name: 'Jiya Thomas (Software Dev)', role: 'Developer' },
    { id: 'usr_dev_3', name: 'Rinta Thomas (Full Stack Dev)', role: 'Developer' },
    { id: 'usr_dev_4', name: 'Ram Kumar (React Engineer)', role: 'Developer' },
    { id: 'usr_qa_1', name: 'Venu QA (QA Automation Lead)', role: 'QA Tester' },
    { id: 'usr_qa_2', name: 'Feba Biju (Executive QA)', role: 'QA Tester' }
  ];

  const fetchTasks = async () => {
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/tasks/', {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tasks && data.tasks.length > 0) {
          setTaskList(data.tasks);
        }
      }
    } catch (err) {
      // Fallback
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedAssignee) {
      showToast('Please enter task title and select an assignee', 'warning');
      return;
    }

    const newTask = {
      id: `TASK-${Math.floor(200 + Math.random() * 800)}`,
      title: taskTitle,
      project: taskProject,
      assignee: selectedAssignee,
      assigned_by: `${user?.name || 'David Chen'} (Tech Lead)`,
      status: 'In Progress',
      priority: taskPriority,
      module: taskModule
    };

    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      await fetch('http://127.0.0.1:8000/api/v1/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          title: taskTitle,
          project_name: taskProject,
          assigned_to: selectedAssignee,
          priority: taskPriority,
          module: taskModule
        })
      });
    } catch (err) {
      // Fallback
    }

    setTaskList([newTask, ...taskList]);
    showToast(`Task '${taskTitle}' assigned to ${selectedAssignee.split(' (')[0]}.`, 'success');
    
    setTaskTitle('');
    setSelectedAssignee('');
    setIsModalOpen(false);
  };

  const filtered = taskList.filter(t => filter === 'All' || t.status === filter);
  const isLeadOrAdmin = !user?.role || user.role === 'ROLE_LEAD' || user.role === 'ROLE_ADMIN';

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Technical Work Distribution & Task Board</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1">
            Team Leads assign technical work modules to Frontend Devs, Backend Devs, and QA Testers.
          </p>
        </div>
        {isLeadOrAdmin && (
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Team Lead: Distribute Technical Task
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle icon={CheckSquare}>Technical Task Allocation Matrix</CardTitle>
          <div className="flex flex-wrap gap-2">
            {['All', 'In Progress', 'Completed', 'Overdue'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 text-xs rounded-xl font-bold transition-all ${
                  filter === tab
                    ? 'bg-indigo-600 dark:bg-indigo-600 warm:bg-[#b45309] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] text-slate-700 dark:text-slate-300 warm:text-[#342314]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardHeader>

        <div className="space-y-3 p-4">
          {filtered.map(t => (
            <div key={t.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]">{t.id}</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white warm:text-[#342314]">{t.title}</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 flex flex-wrap items-center gap-2">
                  <span>Project: <strong>{t.project}</strong></span>
                  <span>•</span>
                  <span>Assignee: <strong className="text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]">{t.assignee}</strong></span>
                  <span>•</span>
                  <span>Lead: <strong>{t.assigned_by || 'David Chen (Tech Lead)'}</strong></span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={t.priority === 'HIGH' ? 'error' : 'warning'} size="sm">{t.priority}</Badge>
                <Badge variant={t.status === 'Completed' ? 'success' : 'brand'} size="sm">{t.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Team Lead Modal: Distribute Technical Task */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Team Lead Governance: Distribute Technical Work">
        <form onSubmit={handleCreateTaskSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">Technical Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement REST API Authentication Endpoint"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs font-sans text-slate-900 dark:text-white warm:text-[#342314]"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Project Container</label>
            <select
              value={taskProject}
              onChange={(e) => setTaskProject(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs font-sans text-slate-900 dark:text-white warm:text-[#342314]"
            >
              <option value="Aureon Core API Gateway">Aureon Core API Gateway</option>
              <option value="Cloud Telemetry Mesh">Cloud Telemetry Mesh</option>
              <option value="SonarQube Vulnerability Scanner">SonarQube Vulnerability Scanner</option>
            </select>
          </div>

          {/* 💻 TEAM LEAD STEP: ASSIGN TECHNICAL WORK TO DEVELOPER OR QA */}
          <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 warm:bg-[#f3e8d2] border border-indigo-200 dark:border-indigo-800 warm:border-[#cbb68e] space-y-2">
            <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 warm:text-[#b45309] uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600 warm:text-[#b45309]" /> Team Lead Step: Select Developer / QA Assignee
            </span>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] text-xs font-bold text-slate-900 dark:text-white warm:text-[#342314]"
            >
              <option value="">-- Select Team Member --</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.name}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Technical Module</label>
              <input
                type="text"
                placeholder="e.g. Auth & Security REST API"
                value={taskModule}
                onChange={(e) => setTaskModule(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Assign Technical Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
