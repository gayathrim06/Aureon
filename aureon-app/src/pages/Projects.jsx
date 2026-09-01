import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Table, TableRow, TableCell } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FolderKanban, Plus, Search, Filter, Layers, UserCheck, Users, Shield, ArrowRight, CheckCircle2, Clock, Activity, AlertTriangle, X, CheckSquare, Sparkles, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Projects = () => {
  const { user, showToast } = useAuth();
  const [projectsList, setProjectsList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'workload'

  // PM Form State for Project Creation & Team Allocation
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectObjectives, setProjectObjectives] = useState('');
  const [requirementsList, setRequirementsList] = useState(['User Authentication', 'Project Management', 'GitHub Integration', 'Code Quality Analysis']);
  const [reqInput, setReqInput] = useState('');
  const [techStack, setTechStack] = useState('Python, Flask, React, PostgreSQL');
  const [projectPriority, setProjectPriority] = useState('HIGH');
  const [projectStatus, setProjectStatus] = useState('PLANNING');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [startDate, setStartDate] = useState('2026-09-01');
  const [deadline, setDeadline] = useState('2026-11-30');

  // Base Team Leads (No fake non-zero numbers; stats dynamically calculated from DB)
  const baseLeads = [
    { id: 'usr_lead_1', name: 'Krishna Deepesh', role: 'Team Lead', title: 'Senior Tech Lead & Architect', email: 'krish@aureon.com' },
    { id: 'usr_lead_2', name: 'David Chen', role: 'Team Lead', title: 'Lead Systems Architect', email: 'david.c@aureon.com' },
    { id: 'usr_lead_3', name: 'Vikram Patel', role: 'Team Lead', title: 'Principal Backend Engineer', email: 'vikram.p@aureon.com' }
  ];

  // Base Team Members (No fake non-zero numbers; stats dynamically calculated from DB)
  const baseMembers = [
    { id: 'usr_dev_1', name: 'Ram Kumar', role: 'Frontend UI Engineer', type: 'DEV' },
    { id: 'usr_dev_2', name: 'Alex Rivera', role: 'DevOps & Cloud Architect', type: 'DEV' },
    { id: 'usr_dev_3', name: 'Priya Sharma', role: 'Database & Analytics Engineer', type: 'DEV' },
    { id: 'usr_dev_4', name: 'Michael Brown', role: 'Security Engineering Lead', type: 'DEV' },
    { id: 'usr_dev_5', name: 'Sneha Roy', role: 'Flutter & Mobile Engineer', type: 'DEV' },
    { id: 'usr_qa_1', name: 'Venu QA', role: 'Lead QA Automation Engineer', type: 'QA' },
    { id: 'usr_qa_2', name: 'Ananya Varma', role: 'Test Automation Specialist', type: 'QA' },
    { id: 'usr_qa_3', name: 'Sarah Thomas', role: 'Security & Regression QA', type: 'QA' }
  ];

  const fetchProjectsAndTasks = async () => {
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

    try {
      const [projRes, taskRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/projects/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/tasks/', { headers })
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjectsList(pData.projects || []);
      } else {
        setProjectsList([]);
      }

      if (taskRes.ok) {
        const tData = await taskRes.json();
        setTasksList(tData.tasks || []);
      } else {
        setTasksList([]);
      }
    } catch (err) {
      setProjectsList([]);
      setTasksList([]);
    }
  };

  useEffect(() => {
    fetchProjectsAndTasks();
    if (baseLeads.length > 0) setSelectedLeadId(baseLeads[0].id);
    setSelectedMemberIds([baseMembers[0].id, baseMembers[1].id, baseMembers[5].id]);
  }, []);

  // Compute Real Team Lead Metrics from actual DB projects/tasks
  const availableLeads = baseLeads.map(lead => {
    const assignedProjects = projectsList.filter(p => p.lead_id === lead.id || p.lead_name?.includes(lead.name));
    const assignedTasks = tasksList.filter(t => t.assigned_to === lead.name || t.assignee_id === lead.id);
    const activeTasks = assignedTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO').length;
    const completedTasks = assignedTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
    const status = activeTasks > 3 ? 'HIGH_WORKLOAD' : 'AVAILABLE';

    return {
      ...lead,
      activeTasks,
      completedTasks,
      projectsCount: assignedProjects.length,
      status
    };
  });

  // Compute Real Member Metrics from actual DB projects/tasks
  const availableMembers = baseMembers.map(member => {
    const assignedTasks = tasksList.filter(t => t.assigned_to === member.name || t.assignee_id === member.id);
    const activeTasks = assignedTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO').length;
    const completedTasks = assignedTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
    const totalTasks = assignedTasks.length;
    const finishRate = totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%';
    const workloadPct = Math.min(100, activeTasks * 25);
    const status = activeTasks > 3 ? 'HIGH_WORKLOAD' : 'AVAILABLE';

    return {
      ...member,
      activeTasks,
      completedTasks,
      totalTasks,
      finishRate,
      workloadPct,
      status
    };
  });

  // Add Requirement Handler
  const handleAddRequirement = (e) => {
    e.preventDefault();
    if (!reqInput.trim()) return;
    if (!requirementsList.includes(reqInput.trim())) {
      setRequirementsList([...requirementsList, reqInput.trim()]);
    }
    setReqInput('');
  };

  const handleRemoveRequirement = (reqToRemove) => {
    setRequirementsList(requirementsList.filter(r => r !== reqToRemove));
  };

  const handleMemberToggle = (memberId) => {
    if (selectedMemberIds.includes(memberId)) {
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== memberId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      if (showToast) showToast('Please enter a Project Name', 'warning');
      return;
    }

    const leadObj = availableLeads.find(l => l.id === selectedLeadId);
    const assignedMemberObjs = availableMembers
      .filter(m => selectedMemberIds.includes(m.id))
      .map(m => ({ id: m.id, name: m.name, role: m.role, type: m.type }));

    const newProj = {
      id: `PROJ-${Math.floor(1000 + Math.random() * 9000)}`,
      name: projectName,
      description: projectDesc || 'Enterprise Software Development Module',
      objectives: projectObjectives || 'Deliver reliable and performant software features on schedule.',
      requirements: requirementsList,
      tech_stack: techStack,
      start_date: startDate,
      target_deadline: deadline,
      priority: projectPriority,
      status: projectStatus,
      manager_name: `${user?.name || 'Gopika Manoj'} (PM)`,
      lead_id: leadObj ? leadObj.id : null,
      lead_name: leadObj ? leadObj.name : 'Unassigned Lead',
      team_members: assignedMemberObjs,
      health_score: 100,
      progress: 0
    };

    setProjectsList([newProj, ...projectsList]);

    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      await fetch('http://127.0.0.1:8000/api/v1/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(newProj)
      });
    } catch (err) {}

    if (showToast) showToast(`Project '${projectName}' created. Team Lead (${newProj.lead_name}) & ${assignedMemberObjs.length} members assigned!`, 'success');

    // Reset Form
    setProjectName('');
    setProjectDesc('');
    setProjectObjectives('');
    setIsModalOpen(false);
  };

  const filteredProjects = projectsList.filter((p) => {
    const pName = p.name || p.project_name || '';
    const pId = p.id || '';
    const pLead = p.lead_name || '';
    const matchSearch = pName.toLowerCase().includes(search.toLowerCase()) || 
                        pId.toLowerCase().includes(search.toLowerCase()) ||
                        pLead.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === 'All' || p.priority === priorityFilter;
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchPriority && matchStatus;
  });

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      {/* Header Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Project Management & Virtual Team Governance</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1">
            PM Governance: Create projects, define requirements & tech stack, appoint Team Lead, allocate members, and check workload capacity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setActiveTab(activeTab === 'projects' ? 'workload' : 'projects')}>
            {activeTab === 'projects' ? '👥 View Member Workload & Capacity' : '📁 View Projects Portfolio'}
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            PM: Create Project & Assign Team Lead
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] text-xs font-bold gap-6">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-2.5 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'projects' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FolderKanban className="w-4 h-4" /> Projects Portfolio ({projectsList.length})
        </button>
        <button
          onClick={() => setActiveTab('workload')}
          className={`pb-2.5 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'workload' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" /> Team Member Availability & Workload Monitor ({availableMembers.length + availableLeads.length})
        </button>
      </div>

      {activeTab === 'projects' ? (
        <Card>
          <CardHeader className="flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl border border-indigo-500/30">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Enterprise Software Projects</CardTitle>
                <CardDescription>PM-initialized projects, appointed Team Leads, requirements, and virtual teams</CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects or leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs text-slate-900 dark:text-white warm:text-[#342314] border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] rounded-xl focus:outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs text-slate-900 dark:text-white warm:text-[#342314] border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] rounded-xl focus:outline-none font-bold"
              >
                <option value="All">All Statuses</option>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs text-slate-900 dark:text-white warm:text-[#342314] border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] rounded-xl focus:outline-none font-bold"
              >
                <option value="All">All Priorities</option>
                <option value="CRITICAL">Critical Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </CardHeader>

          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FolderKanban className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-extrabold">No Projects Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click <strong>"PM: Create Project & Assign Team Lead"</strong> above to initialize your first project, define requirements & tech stack, select a Team Lead, and allocate team members.
              </p>
              <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
                Create First Project Now
              </Button>
            </div>
          ) : (
            <Table headers={['Project Code & Name', 'Assigned Team Lead (PM Selected)', 'Allocated Virtual Team', 'Tech Stack & Requirements', 'Status', 'Priority', 'Target Deadline']}>
              {filteredProjects.map((proj) => (
                <TableRow key={proj.id || proj.name}>
                  <TableCell>
                    <div>
                      <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] font-bold mr-2">{proj.id}</span>
                      <span className="font-bold text-slate-900 dark:text-white warm:text-[#342314]">{proj.name || proj.project_name}</span>
                      {proj.description && <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">{proj.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 warm:bg-[#f3e8d2] text-indigo-700 dark:text-indigo-300 warm:text-[#342314] text-xs font-bold border border-indigo-200 dark:border-indigo-800 warm:border-[#cbb68e] inline-flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600 warm:text-[#b45309]" />
                      {proj.lead_name || 'Unassigned Lead'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {proj.team_members && proj.team_members.length > 0 ? (
                        proj.team_members.map((m, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] text-[11px] font-semibold text-slate-700 dark:text-slate-300 warm:text-[#342314] border border-slate-200 dark:border-slate-700 warm:border-[#cbb68e]">
                            {typeof m === 'string' ? m : (m?.name || m?.full_name || m?.username || m?.role || 'Team Member')}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No members assigned</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-[11px]">
                      <div className="font-mono text-slate-700 dark:text-slate-300 font-bold">{proj.tech_stack || 'Python, Flask, React'}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">
                        Reqs: {Array.isArray(proj.requirements) ? proj.requirements.join(', ') : (proj.requirements || 'User Auth, Project Management')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={proj.status === 'COMPLETED' ? 'success' : proj.status === 'PLANNING' ? 'secondary' : 'brand'} size="sm" dot>
                      {proj.status || 'PLANNING'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={proj.priority === 'CRITICAL' ? 'error' : proj.priority === 'HIGH' ? 'error' : 'warning'} size="sm">
                      {proj.priority || 'HIGH'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-700 dark:text-slate-300 font-bold">
                    {proj.target_deadline || proj.deadline || '2026-11-30'}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </Card>
      ) : (
        /* WORKLOAD & CAPACITY MONITOR WITH REAL DATABASE NUMBERS */
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 warm:bg-[#f3e8d2] border border-indigo-200 dark:border-indigo-800 warm:border-[#cbb68e] text-xs">
            <h3 className="font-extrabold text-indigo-900 dark:text-indigo-200 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> Virtual Team Capacity & Task Finish Monitor (Live Database Metrics)
            </h3>
            <p className="text-indigo-700 dark:text-indigo-300 mt-1">
              Real-time metrics: Check every member's active tasks, completed tasks, and workload capacity before assigning them to new project modules.
            </p>
          </div>

          {/* Senior Team Leads Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Project Team Leads (3 Senior Leads)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableLeads.map((lead) => (
                <div key={lead.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">👑 Team Lead</span>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white warm:text-[#342314]">{lead.name}</h4>
                      <p className="text-[11px] text-slate-500">{lead.title}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      lead.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {lead.status === 'AVAILABLE' ? '✓ Available' : '⚠️ High Workload'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                      <span className="text-[10px] text-slate-400 block">Active Tasks</span>
                      <span className="font-bold text-indigo-600 text-sm">{lead.activeTasks}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                      <span className="text-[10px] text-slate-400 block">Completed</span>
                      <span className="font-bold text-emerald-600 text-sm">{lead.completedTasks}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                      <span className="text-[10px] text-slate-400 block">Projects</span>
                      <span className="font-bold text-purple-600 text-sm">{lead.projectsCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Developers & QA Testers Roster Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Developers & QA Testers Workload Roster</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {availableMembers.map((member) => (
                <div key={member.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[10px] font-bold uppercase ${member.type === 'QA' ? 'text-rose-600' : 'text-blue-600'}`}>
                        {member.type === 'QA' ? '🧪 QA Tester' : '💻 Developer'}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white warm:text-[#342314]">{member.name}</h4>
                      <p className="text-[10px] text-slate-500">{member.role}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      member.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                      {member.status === 'AVAILABLE' ? '✓ Ready' : '⚠️ Busy'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                      <span className="text-slate-400 block">Active Tasks</span>
                      <span className="font-bold text-blue-600 text-xs">{member.activeTasks}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                      <span className="text-slate-400 block">Finished Tasks</span>
                      <span className="font-bold text-emerald-600 text-xs">{member.completedTasks}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1 font-semibold">
                      <span className="text-slate-500">Task Finish Rate</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{member.finishRate}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          member.workloadPct >= 75 ? 'bg-rose-500' : member.workloadPct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${member.workloadPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PM INITIALIZE PROJECT & TEAM ALLOCATION MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="PM Governance: Create Project, Define Requirements & Assign Team Structure">
        <form onSubmit={handleCreateProjectSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* Step 1: Project Details */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              1. Project Name, Description & Tech Stack
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aureon Enterprise Platform"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Technology Stack</label>
                <input
                  type="text"
                  placeholder="e.g. Python, Django, React, MySQL"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">Project Description & High-Level Objectives</label>
              <textarea
                rows={2}
                placeholder="Describe project objectives and key deliverables..."
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          {/* Step 2: Define Requirements */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              2. Define Project Requirements (What Needs to be Built)
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add requirement (e.g. User Authentication, Code Quality Analysis)"
                value={reqInput}
                onChange={(e) => setReqInput(e.target.value)}
                className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
              />
              <button
                type="button"
                onClick={handleAddRequirement}
                className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Add Requirement
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {requirementsList.map((req, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1">
                  ✓ {req}
                  <button type="button" onClick={() => handleRemoveRequirement(req)} className="text-rose-500 hover:text-rose-700 ml-1">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Step 3: Assign Team Lead */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/70 warm:bg-[#f3e8d2] border border-indigo-200 dark:border-indigo-800 space-y-2">
            <span className="font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider block">
              3. Assign Team Lead for this Project
            </span>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white"
            >
              {availableLeads.map(lead => (
                <option key={lead.id} value={lead.id}>
                  👑 {lead.name} — {lead.title} (Active Tasks: {lead.activeTasks}, Completed: {lead.completedTasks})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
              The assigned Team Lead receives the project requirements and divides technical tasks among developers.
            </p>
          </div>

          {/* Step 4: Allocate Team Members with Workload Status */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/70 warm:bg-[#f3e8d2] border border-purple-200 dark:border-purple-800 space-y-2">
            <span className="font-extrabold text-purple-900 dark:text-purple-200 uppercase tracking-wider block">
              4. Assign Team Members (Select Developers & QA with Availability Check)
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              {availableMembers.map(member => (
                <label key={member.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 dark:text-white flex justify-between">
                      <span>{member.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 rounded ${member.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {member.status === 'AVAILABLE' ? '✓ Free' : '⚠️ Busy'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">{member.role} • Active: {member.activeTasks}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Step 5: Timeline & Priority */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Target Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Project Priority</label>
              <select
                value={projectPriority}
                onChange={(e) => setProjectPriority(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical Priority</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Plus}>
              Save & Initialize Project Structure
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
