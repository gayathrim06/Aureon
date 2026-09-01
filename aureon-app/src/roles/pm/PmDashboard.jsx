import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { 
  FolderKanban, Layers, CheckSquare, Clock, Calendar, Activity, 
  GitBranch, Bug, Users, Plus, FileText, AlertCircle, TrendingUp, Cpu, BarChart2,
  CheckCircle2, Shield, UserCheck, Code2, AlertTriangle, Send, Edit3, ArrowRight,
  Filter, Sparkles, ChevronRight, Hash, Play, PauseCircle, CheckSquare2, XSquare
} from 'lucide-react';

export const PmDashboard = ({ onNavigate }) => {
  const { user, showToast } = useAuth();
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'Gopika Manoj';

  // Available Team Leads for PM Assignment
  const availableLeads = [
    { id: 'usr_lead_1', name: 'David Chen', title: 'Senior Tech Lead & Architect', email: 'david.c@aureon.com', status: 'AVAILABLE' },
    { id: 'usr_lead_2', name: 'Krishna Deepesh', title: 'Lead Backend Engineer', email: 'krish@aureon.com', status: 'AVAILABLE' },
    { id: 'usr_lead_3', name: 'Vikram Patel', title: 'Principal Systems Lead', email: 'vikram.p@aureon.com', status: 'AVAILABLE' }
  ];

  // Available Team Members (Developers & QA)
  const availableMembers = [
    { id: 'usr_dev_1', name: 'Ram Kumar', role: 'Frontend UI Engineer', type: 'DEV' },
    { id: 'usr_dev_2', name: 'Alex Rivera', role: 'DevOps & Cloud Architect', type: 'DEV' },
    { id: 'usr_dev_3', name: 'Priya Sharma', role: 'Database & Data Engineer', type: 'DEV' },
    { id: 'usr_dev_4', name: 'Michael Brown', role: 'Cybersecurity Specialist', type: 'DEV' },
    { id: 'usr_dev_5', name: 'Sneha Roy', role: 'Flutter & Mobile Developer', type: 'DEV' },
    { id: 'usr_qa_1', name: 'Venu QA', role: 'Lead QA Automation Engineer', type: 'QA' },
    { id: 'usr_qa_2', name: 'Ananya Varma', role: 'QA Test Specialist', type: 'QA' },
    { id: 'usr_qa_3', name: 'Sarah Thomas', role: 'Security QA Engineer', type: 'QA' }
  ];

  // Projects State
  const [projectsList, setProjectsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState(null);

  // Announcement Feed State
  const [announcements, setAnnouncements] = useState([
    { id: 1, author: 'Gopika Manoj (PM)', text: 'Welcome to Aureon Project Governance workspace. All Team Leads prepare sprint backlogs.', time: '10 mins ago' }
  ]);
  const [newAnnouncementText, setNewAnnouncementText] = useState('');

  // Form State for Project Creation / Editing
  const [formProjectName, setFormProjectName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formObjectives, setFormObjectives] = useState('');
  const [formRequirements, setFormRequirements] = useState(['User Authentication', 'Project Management', 'GitHub Integration', 'Code Quality Analysis']);
  const [reqInput, setReqInput] = useState('');
  const [formTechStack, setFormTechStack] = useState('Python, Flask, React, PostgreSQL');
  const [formStartDate, setFormStartDate] = useState('2026-09-01');
  const [formDeadline, setFormDeadline] = useState('2026-11-30');
  const [formPriority, setFormPriority] = useState('HIGH');
  const [formStatus, setFormStatus] = useState('PLANNING');
  const [formSelectedLeadId, setFormSelectedLeadId] = useState(availableLeads[0].id);
  const [formSelectedMemberIds, setFormSelectedMemberIds] = useState([availableMembers[0].id, availableMembers[1].id, availableMembers[5].id]);

  // Load Projects from Flask Backend API
  const fetchProjects = async () => {
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/projects/', {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.projects && data.projects.length > 0) {
          setProjectsList(data.projects);
        }
      }
    } catch (err) {
      // API Offline
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle Add Requirement
  const handleAddRequirement = (e) => {
    e.preventDefault();
    if (!reqInput.trim()) return;
    if (!formRequirements.includes(reqInput.trim())) {
      setFormRequirements([...formRequirements, reqInput.trim()]);
    }
    setReqInput('');
  };

  // Handle Toggle Member Selection
  const handleToggleMember = (memberId) => {
    if (formSelectedMemberIds.includes(memberId)) {
      setFormSelectedMemberIds(formSelectedMemberIds.filter(id => id !== memberId));
    } else {
      setFormSelectedMemberIds([...formSelectedMemberIds, memberId]);
    }
  };

  // Handle Project Creation Form Submit
  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!formProjectName.trim()) {
      if (showToast) showToast('Please enter a Project Name', 'warning');
      return;
    }

    const leadObj = availableLeads.find(l => l.id === formSelectedLeadId);
    const assignedMemberObjs = availableMembers
      .filter(m => formSelectedMemberIds.includes(m.id))
      .map(m => ({ name: m.name, role: m.role, type: m.type }));

    const newProject = {
      id: `PROJ-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formProjectName,
      description: formDescription || 'Enterprise Software Development Module',
      objectives: formObjectives || 'Deliver reliable and performant software features on schedule.',
      requirements: formRequirements,
      tech_stack: formTechStack,
      start_date: formStartDate,
      deadline: formDeadline,
      priority: formPriority,
      status: formStatus,
      manager_name: `${userName} (PM)`,
      lead_id: leadObj ? leadObj.id : null,
      lead_name: leadObj ? leadObj.name : 'Unassigned Lead',
      team_members: assignedMemberObjs,
      total_tasks: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      pending_tasks: 0,
      progress: 0,
      health_score: 100
    };

    // Save to Local State
    const updatedProjects = [newProject, ...projectsList];
    setProjectsList(updatedProjects);

    // Save to Backend API
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      await fetch('http://127.0.0.1:8000/api/v1/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(newProject)
      });
    } catch (err) {
      // Fallback
    }

    if (showToast) showToast(`Project "${newProject.name}" initialized successfully! Assigned Team Lead: ${newProject.lead_name}.`, 'success');
    setIsCreateModalOpen(false);

    // Reset Form
    setFormProjectName('');
    setFormDescription('');
    setFormObjectives('');
  };

  // Handle Update Project Status
  const handleUpdateStatus = (projectId, newStatus) => {
    const updated = projectsList.map(p => p.id === projectId ? { ...p, status: newStatus } : p);
    setProjectsList(updated);
    if (showToast) showToast(`Project status updated to ${newStatus}`, 'info');
  };

  // Handle Post PM Announcement
  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;
    const newMsg = {
      id: Date.now(),
      author: `${userName} (PM)`,
      text: newAnnouncementText.trim(),
      time: 'Just now'
    };
    setAnnouncements([newMsg, ...announcements]);
    setNewAnnouncementText('');
    if (showToast) showToast('Project Announcement broadcasted to Team Lead & Members!', 'success');
  };

  // Computed Metrics
  const totalProjects = projectsList.length;
  const activeProjects = projectsList.filter(p => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length;
  const planningProjects = projectsList.filter(p => p.status === 'PLANNING').length;
  const completedProjects = projectsList.filter(p => p.status === 'COMPLETED').length;

  const filteredProjects = projectsList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.lead_name && p.lead_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Dashboard" title="Project Manager Workspace" />

      {/* Governance Scope Notice Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 warm:bg-[#f3e8d2] border border-indigo-200 dark:border-indigo-800 warm:border-[#cbb68e] shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <strong className="text-indigo-900 dark:text-indigo-200 warm:text-[#342314] font-extrabold">Project Manager Governance Rule:</strong>
            <span className="text-indigo-700 dark:text-indigo-300 warm:text-[#69523c] ml-1.5 font-medium">
              PM creates projects, sets deadlines & priorities, assigns Team Lead & Team Members. Team Lead allocates technical work.
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shrink-0 flex items-center gap-1.5 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" /> Create New Project
        </button>
      </div>

      {/* Theme-Aware PM Header Banner */}
      <div className="relative p-6 rounded-2xl aureon-theme-banner overflow-hidden transition-all duration-300 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/20">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] uppercase font-bold tracking-wider border border-white/30">
              Project Manager — {userName}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 font-mono text-[10px] uppercase font-bold border border-emerald-300/30">
              Workspace Operational
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2">{userName}'s Project Management Hub</h1>
          <p className="text-xs banner-subtext mt-1 max-w-xl">
            Project Creation • Team Formation • Team Lead Selection • Requirements & Deadline Management • Live Governance
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 relative z-10">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 text-indigo-600" /> Initialize Project
          </button>
          <button
            onClick={() => onNavigate && onNavigate('Projects')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs border border-white/30 shadow-md transition-all hover:scale-105"
          >
            <FolderKanban className="w-4 h-4" /> All Projects Hub
          </button>
        </div>
      </div>

      {/* PM Executive Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Active Projects */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 border-l-blue-500 border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Projects</span>
            <FolderKanban className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-2">{totalProjects} Projects</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-semibold">
            {planningProjects} Planning • {activeProjects} Active • {completedProjects} Done
          </div>
        </div>

        {/* Card 2: Team Leads Assigned */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 border-l-indigo-500 border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Team Leads Assigned</span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-2">
            {projectsList.filter(p => p.lead_name && p.lead_name !== 'Unassigned Lead').length} Leads
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-semibold">
            Linked to projects
          </div>
        </div>

        {/* Card 3: Total Developers & QA */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 border-l-purple-500 border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Team Member Roster</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-2">
            {availableMembers.length} Members
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-semibold">
            5 Developers • 3 QA Testers
          </div>
        </div>

        {/* Card 4: Deadline Tracking */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 border-l-amber-500 border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Deadline Alert</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-2">
            {totalProjects > 0 ? 'On Track' : 'No Deadlines'}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-semibold">
            Schedule risk monitored
          </div>
        </div>

        {/* Card 5: Project Health */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 border-l-emerald-500 border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overall Health</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 warm:text-[#b45309] mt-2">100%</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-semibold">
            BCNF Governance Normal
          </div>
        </div>
      </div>

      {/* Projects Governance Hub Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white warm:text-[#342314] flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> PM Managed Projects & Team Structures
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-0.5">
              Review project status, requirements, deadlines, assigned Team Lead, and team allocations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by project or Team Lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs font-sans text-slate-900 dark:text-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Project List Cards */}
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] rounded-2xl space-y-3">
            <FolderKanban className="w-12 h-12 text-slate-300 dark:text-slate-700 warm:text-[#69523c] mx-auto" />
            <h3 className="text-base font-extrabold text-slate-700 dark:text-slate-300 warm:text-[#342314]">No Projects Created Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c] max-w-md mx-auto">
              As Project Manager, click <strong>"Create New Project"</strong> above to initialize your first project, define requirements, set deadline & priority, and assign a Team Lead & members.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create First Project Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Top Row: Title, Priority, Status Dropdown */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                        {proj.id}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white warm:text-[#342314]">{proj.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${
                        proj.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border-rose-300' :
                        proj.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {proj.priority || 'HIGH'} Priority
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 warm:text-[#69523c] mt-1 font-medium">{proj.description}</p>
                  </div>

                  {/* Status Change Manager */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Status:</span>
                    <select
                      value={proj.status}
                      onChange={(e) => handleUpdateStatus(proj.id, e.target.value)}
                      className="p-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="PLANNING">Planning</option>
                      <option value="ACTIVE">Active</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Grid Info: Team Lead, Team Members, Tech Stack, Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  {/* Column 1: Team Lead */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e]">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                      👑 Assigned Team Lead
                    </span>
                    <div className="font-extrabold text-slate-900 dark:text-white warm:text-[#342314]">
                      {proj.lead_name || 'Unassigned Lead'}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Responsible for Technical Work Allocation</p>
                  </div>

                  {/* Column 2: Team Members */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e]">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block mb-1">
                      👥 Allocated Virtual Team
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {proj.team_members && proj.team_members.length > 0 ? (
                        proj.team_members.map((m, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            {typeof m === 'string' ? m : (m?.name || m?.full_name || m?.username || m?.role || 'Team Member')}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No members assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Tech Stack & Requirements */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e]">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                      🛠️ Tech Stack & Requirements
                    </span>
                    <div className="font-mono text-[10px] text-slate-700 dark:text-slate-300 font-bold truncate">
                      {proj.tech_stack || 'Python, Flask, React, PostgreSQL'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      Reqs: {Array.isArray(proj.requirements) ? proj.requirements.join(', ') : (proj.requirements || 'User Auth, Project Management')}
                    </div>
                  </div>

                  {/* Column 4: Timeline & Target Deadline */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e]">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                      ⏱️ Deadline & Progress
                    </span>
                    <div className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                      Target: {proj.deadline || proj.target_deadline || '2026-11-30'}
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${proj.progress || 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Coordination & Announcements Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PM Broadcast Announcements */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white warm:text-[#342314] flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Send className="w-4 h-4 text-indigo-500" /> PM Announcements & Team Coordination
          </h3>

          <form onSubmit={handlePostAnnouncement} className="flex gap-2">
            <input
              type="text"
              placeholder="Broadcast project announcement to Team Leads & Members..."
              value={newAnnouncementText}
              onChange={(e) => setNewAnnouncementText(e.target.value)}
              className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs font-sans text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shrink-0 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> Broadcast
            </button>
          </form>

          <div className="space-y-2.5">
            {announcements.map((msg) => (
              <div key={msg.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 warm:bg-[#f3e8d2] border border-slate-200/60 dark:border-slate-800/60 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{msg.author}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{msg.time}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 warm:text-[#342314]">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Governance Notifications & Alerts Stream */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white warm:text-[#342314] flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" /> PM System Notifications & Risk Radar
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 warm:bg-[#f3e8d2] border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900 dark:text-emerald-200">System Ready:</span>
                <p className="text-emerald-700 dark:text-emerald-300 text-[11px]">Virtual project governance workflow active. Select Team Leads & allocate Developers.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 warm:bg-[#f3e8d2] border border-blue-200 dark:border-blue-800/60 flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <span className="font-bold text-blue-900 dark:text-blue-200">Team Lead Assignment Notice:</span>
                <p className="text-blue-700 dark:text-blue-300 text-[11px]">Assigned Team Leads will automatically receive project requirements on their Lead Workstation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE NEW PROJECT & TEAM INITIALIZATION MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initialize New Software Project & Team Structure"
      >
        <form onSubmit={handleCreateProjectSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* Step 1: Project Details */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              1. Project Name & Description
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Aureon SaaS Platform"
                  value={formProjectName}
                  onChange={(e) => setFormProjectName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Technology Stack</label>
                <input
                  type="text"
                  placeholder="e.g. Python, Flask, React, PostgreSQL"
                  value={formTechStack}
                  onChange={(e) => setFormTechStack(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">Project Description & Objectives</label>
              <textarea
                rows={2}
                placeholder="Describe what needs to be built and high-level project goals..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          {/* Step 2: Define Requirements */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              2. Define Overall Requirements
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add requirement (e.g. GitHub Integration, Code Quality Analysis)"
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
              {formRequirements.map((req, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1">
                  ✓ {req}
                  <button type="button" onClick={() => setFormRequirements(formRequirements.filter(r => r !== req))} className="text-rose-500 hover:text-rose-700 ml-1">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Step 3: Select Team Lead */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/70 warm:bg-[#f3e8d2] border border-indigo-200 dark:border-indigo-800 space-y-2">
            <span className="font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider block">
              3. Assign Team Lead (Select Senior Lead)
            </span>
            <select
              value={formSelectedLeadId}
              onChange={(e) => setFormSelectedLeadId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white"
            >
              {availableLeads.map(lead => (
                <option key={lead.id} value={lead.id}>
                  👑 {lead.name} — {lead.title} ({lead.email})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
              The assigned Team Lead will break down requirements into technical tasks and coordinate developers.
            </p>
          </div>

          {/* Step 4: Allocate Team Members */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/70 warm:bg-[#f3e8d2] border border-purple-200 dark:border-purple-800 space-y-2">
            <span className="font-extrabold text-purple-900 dark:text-purple-200 uppercase tracking-wider block">
              4. Assign Team Members (Select Developers & QA Testers)
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              {availableMembers.map(member => (
                <label key={member.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formSelectedMemberIds.includes(member.id)}
                    onChange={() => handleToggleMember(member.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{member.name}</div>
                    <div className="text-[10px] text-slate-500">{member.role}</div>
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
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Target Deadline</label>
              <input
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Project Priority</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Save & Initialize Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
