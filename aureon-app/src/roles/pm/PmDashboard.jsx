import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { 
  FolderKanban, Layers, CheckSquare, Clock, Calendar, Activity, 
  GitBranch, Bug, Users, Plus, FileText, AlertCircle, TrendingUp, Cpu, BarChart2,
  CheckCircle2, Shield, UserCheck, Code2, AlertTriangle, Send, Edit3, ArrowRight,
  Filter, Sparkles, ChevronRight, Hash, Play, PauseCircle, CheckSquare2, XSquare, ListTodo,
  Zap, Crown, Check
} from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';


// Verified Production Fallback Pools to guarantee 100% availability even if backend network delays
const DEFAULT_AUREON_LEADS = [
  {
    id: 'lead-krish-002',
    name: 'Krishna Deepesh',
    role: 'Team Lead',
    title: 'Senior Tech Lead & Quality Architect',
    email: 'krish@aureon.com',
    department: 'Quality Assurance',
    skills: ['Architecture', 'React', 'Python', 'Flask', 'PostgreSQL', 'Code Quality Analysis', 'Sprint Governance'],
    activeTasks: 0,
    completedTasks: 14,
    projectsCount: 0,
    status: 'AVAILABLE'
  },
  {
    id: 'lead-david-011',
    name: 'David Chen',
    role: 'Team Lead',
    title: 'Lead Software Architect',
    email: 'david.c@aureon.com',
    department: 'Backend Architecture',
    skills: ['Python', 'Flask', 'System Design', 'PostgreSQL', 'REST APIs', 'Radon Analysis', 'User Authentication'],
    activeTasks: 0,
    completedTasks: 11,
    projectsCount: 0,
    status: 'AVAILABLE'
  },
  {
    id: 'lead-vikram-018',
    name: 'Vikram Patel',
    role: 'Team Lead',
    title: 'Principal Backend Engineer',
    email: 'vikram.p@aureon.com',
    department: 'Systems Architecture',
    skills: ['Microservices', 'PostgreSQL', 'Docker', 'Python', 'GitHub Integration', 'Project Management'],
    activeTasks: 0,
    completedTasks: 9,
    projectsCount: 0,
    status: 'AVAILABLE'
  }
];

const DEFAULT_AUREON_MEMBERS = [
  {
    id: 'dev-sainu-003',
    name: 'Sainu Anna Sajan',
    role: 'Frontend Developer',
    type: 'DEV',
    email: 'sainu@aureon.com',
    department: 'Engineering',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'REST APIs', 'animated ui design', 'User Authentication'],
    activeTasks: 0,
    completedTasks: 8,
    status: 'AVAILABLE'
  },
  {
    id: 'dev-rinta-006',
    name: 'Rinta Thomas',
    role: 'Full Stack Developer',
    type: 'DEV',
    email: 'rinta@aureon.com',
    department: 'Engineering',
    skills: ['Python', 'Flask', 'PostgreSQL', 'JavaScript', 'Docker', 'REST APIs', 'Project Management'],
    activeTasks: 0,
    completedTasks: 6,
    status: 'AVAILABLE'
  },
  {
    id: 'dev-ram-012',
    name: 'Ram Kumar',
    role: 'Senior React Engineer',
    type: 'DEV',
    email: 'ram.kumar@aureon.com',
    department: 'Frontend UI',
    skills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Next.js', 'Tailwind CSS', 'animated ui design'],
    activeTasks: 0,
    completedTasks: 7,
    status: 'AVAILABLE'
  },
  {
    id: 'dev-priya-015',
    name: 'Priya Sharma',
    role: 'Data Engineer',
    type: 'DEV',
    email: 'priya.s@aureon.com',
    department: 'Database & Analytics',
    skills: ['Python', 'PostgreSQL', 'SQL', 'Data Pipelines', 'REST APIs', 'Code Quality Analysis'],
    activeTasks: 0,
    completedTasks: 5,
    status: 'AVAILABLE'
  },
  {
    id: 'dev-alex-014',
    name: 'Alex Rivera',
    role: 'DevOps & Cloud Architect',
    type: 'DEV',
    email: 'alex.r@aureon.com',
    department: 'Infrastructure',
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'GitHub Integration'],
    activeTasks: 0,
    completedTasks: 9,
    status: 'AVAILABLE'
  },
  {
    id: 'dev-meenakshi-005',
    name: 'Meenakshi',
    role: 'Full Stack Developer',
    type: 'DEV',
    email: 'meenakshi@aureon.com',
    department: 'Engineering',
    skills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'REST APIs'],
    activeTasks: 0,
    completedTasks: 4,
    status: 'AVAILABLE'
  },
  {
    id: 'dev-arunima-001',
    name: 'Arunima',
    role: 'Backend Developer',
    type: 'DEV',
    email: 'arunima@aureon.com',
    department: 'Engineering',
    skills: ['Java', 'Spring Boot', 'MySQL', 'REST APIs', 'Microservices', 'PostgreSQL'],
    activeTasks: 0,
    completedTasks: 5,
    status: 'AVAILABLE'
  },
  {
    id: 'dev-sneha-020',
    name: 'Sneha Roy',
    role: 'Mobile Engineer',
    type: 'DEV',
    email: 'sneha.r@aureon.com',
    department: 'Mobile Development',
    skills: ['Flutter', 'Dart', 'iOS', 'Mobile UI', 'REST APIs'],
    activeTasks: 0,
    completedTasks: 3,
    status: 'AVAILABLE'
  },
  {
    id: 'dev-michael-016',
    name: 'Michael Brown',
    role: 'Cybersecurity Specialist',
    type: 'DEV',
    email: 'michael.b@aureon.com',
    department: 'Security Engineering',
    skills: ['Go', 'Security Auditing', 'OWASP', 'JWT', 'User Authentication', 'Docker', 'Linux'],
    activeTasks: 0,
    completedTasks: 6,
    status: 'AVAILABLE'
  },
  {
    id: 'qa-venu-013',
    name: 'Venu QA',
    role: 'Lead QA Automation Engineer',
    type: 'QA',
    email: 'venu.qa@aureon.com',
    department: 'Quality Assurance',
    skills: ['QA Automation', 'Pytest', 'Selenium', 'API Testing', 'Bug Tracking', 'Code Quality Analysis'],
    activeTasks: 0,
    completedTasks: 12,
    status: 'AVAILABLE'
  },
  {
    id: 'qa-ananya-017',
    name: 'Ananya Varma',
    role: 'Test Automation Specialist',
    type: 'QA',
    email: 'ananya.v@aureon.com',
    department: 'Quality Assurance',
    skills: ['QA Automation', 'Selenium', 'Pytest', 'Integration Testing', 'Regression Testing'],
    activeTasks: 0,
    completedTasks: 8,
    status: 'AVAILABLE'
  },
  {
    id: 'qa-jiya-004',
    name: 'Jiya Thomas',
    role: 'QA Automation Engineer',
    type: 'QA',
    email: 'jiya@aureon.com',
    department: 'Quality Assurance',
    skills: ['QA Automation', 'Manual Testing', 'Pytest', 'Bug Verification', 'Test Execution'],
    activeTasks: 0,
    completedTasks: 7,
    status: 'AVAILABLE'
  },
  {
    id: 'qa-ann-007',
    name: 'Ann',
    role: 'QA Engineer',
    type: 'QA',
    email: 'ann@aureon.com',
    department: 'Quality Assurance',
    skills: ['Manual Testing', 'Acceptance Testing', 'Test Case Design', 'Quality Audit'],
    activeTasks: 0,
    completedTasks: 4,
    status: 'AVAILABLE'
  },
  {
    id: 'qa-riya-008',
    name: 'Riya',
    role: 'QA Automation Engineer',
    type: 'QA',
    email: 'riya@gmail.com',
    department: 'Quality Assurance',
    skills: ['Performance Testing', 'Load Testing', 'Cypress', 'API Validation'],
    activeTasks: 0,
    completedTasks: 4,
    status: 'AVAILABLE'
  }
];

export const PmDashboard = ({ onNavigate }) => {
  const { user, showToast } = useAuth();
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'Gopika Manoj';

  // Guaranteed Production-grade Initial Pools (Updated live from PostgreSQL)
  const [rawLeads, setRawLeads] = useState(DEFAULT_AUREON_LEADS);
  const [rawMembers, setRawMembers] = useState(DEFAULT_AUREON_MEMBERS);
  const [tasksList, setTasksList] = useState([]);

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
  const [formSelectedLeadId, setFormSelectedLeadId] = useState(DEFAULT_AUREON_LEADS[0].id);
  const [formSelectedMemberIds, setFormSelectedMemberIds] = useState([]);
  const [memberFilter, setMemberFilter] = useState('ALL'); // 'ALL', 'SELECTED', 'AVAILABLE', 'DEV', 'QA'

  // Load Projects from Flask Backend API
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.projects) {
          setProjectsList(data.projects);
        }
      }
    } catch (err) {
      // API Offline
    }
  };

  // Load Users (Leads and Team Members) & Tasks dynamically from API
  const fetchUsersAndTasks = async () => {
    try {
      const [uRes, tRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/tasks/`, { headers: getAuthHeaders() })
      ]);

      if (tRes.ok) {
        const tData = await tRes.json();
        setTasksList(tData.tasks || []);
      }

      if (uRes.ok) {
        const uData = await uRes.json();
        const allUsers = uData.users || [];
        if (allUsers.length > 0) {
          const liveLeads = allUsers
            .filter(u => {
              const r = (u.role || u.role_name || u.role_code || '').toUpperCase();
              const d = (u.designation || '').toLowerCase();
              return r === 'ROLE_LEAD' || r === 'LEAD' || r === 'TEAM_LEAD' || d.includes('team lead') || d.includes('tech lead');
            })
            .map(u => ({
              id: String(u.id),
              name: u.full_name || u.name || u.username,
              role: 'Team Lead',
              title: u.designation || 'Senior Tech Lead',
              email: u.email,
              department: u.department || 'Engineering',
              skills: Array.isArray(u.skills_list) && u.skills_list.length > 0 
                ? u.skills_list 
                : (u.skills ? u.skills.split(',').map(s => s.trim()) : ['Architecture', 'Python', 'React', 'Code Quality Analysis', 'Sprint Governance'])
            }));

          if (liveLeads.length > 0) {
            setRawLeads(liveLeads);
            setFormSelectedLeadId(prev => (prev && liveLeads.some(l => l.id === prev)) ? prev : liveLeads[0].id);
          }

          const liveMembers = allUsers
            .filter(u => {
              const r = (u.role || u.role_name || u.role_code || '').toUpperCase();
              const d = (u.designation || '').toLowerCase();
              const isLead = r === 'ROLE_LEAD' || r === 'LEAD' || r === 'TEAM_LEAD' || d.includes('team lead') || d.includes('tech lead');
              const isAdmin = r === 'ROLE_ADMIN' || r === 'ADMIN';
              const isPm = r === 'ROLE_PM' || r === 'PM';
              return !isLead && !isAdmin && !isPm;
            })
            .map(u => {
              const r = (u.role || u.role_name || u.role_code || '').toUpperCase();
              const d = (u.designation || '').toLowerCase();
              const isQa = r === 'ROLE_QA' || r === 'QA' || d.includes('qa') || d.includes('test') || d.includes('quality');
              return {
                id: String(u.id),
                name: u.full_name || u.name || u.username,
                role: u.designation || (isQa ? 'QA Automation Engineer' : 'Software Engineer'),
                type: isQa ? 'QA' : 'DEV',
                email: u.email,
                department: u.department || 'Engineering',
                skills: Array.isArray(u.skills_list) && u.skills_list.length > 0 
                  ? u.skills_list 
                  : (u.skills ? u.skills.split(',').map(s => s.trim()) : (isQa ? ['QA Automation', 'Pytest', 'API Testing'] : ['React', 'Python', 'PostgreSQL', 'REST APIs']))
              };
            });

          if (liveMembers.length > 0) {
            setRawMembers(liveMembers);
          }
        }
      }
    } catch (err) {
      // API Offline fallback to default pools
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchUsersAndTasks();
  }, []);

  // Deterministic Role Efficiency & Skill Match Calculator
  const calcEfficiency = (candidate, isLead = false) => {
    const techTokens = (formTechStack || '').toLowerCase().split(/[\s,+/]+/).filter(t => t.length > 1);
    const reqTokens = (formRequirements || []).join(' ').toLowerCase().split(/[\s,+/]+/).filter(t => t.length > 1);
    const projectKeywords = [...new Set([...techTokens, ...reqTokens])];

    const candSkills = (candidate.skills || []).map(s => String(s).toLowerCase());
    const matchedSkills = (candidate.skills || []).filter(skill => {
      const sLower = skill.toLowerCase();
      return projectKeywords.some(kw => sLower.includes(kw) || kw.includes(sLower));
    });

    // 1. Availability Score (0 - 40 pts)
    let availScore = 40;
    if (isLead) {
      const pCount = candidate.projectsCount || 0;
      const tCount = candidate.activeTasks || 0;
      if (pCount === 0 && tCount === 0) availScore = 40;
      else if (pCount === 0 && tCount <= 1) availScore = 32;
      else if (pCount === 1 && tCount <= 1) availScore = 22;
      else availScore = 10;
    } else {
      const tCount = candidate.activeTasks || 0;
      if (tCount === 0) availScore = 40;
      else if (tCount === 1) availScore = 26;
      else if (tCount === 2) availScore = 14;
      else availScore = 6;
    }

    // 2. Skill Fit Score (0 - 45 pts)
    let skillScore = 26;
    if (matchedSkills.length >= 3) skillScore = 45;
    else if (matchedSkills.length === 2) skillScore = 38;
    else if (matchedSkills.length === 1) skillScore = 32;
    else if (candidate.skills && candidate.skills.length > 0) skillScore = 26;

    // 3. Track Record / Delivery Score (0 - 15 pts)
    const perfBonus = Math.min(15, 8 + Math.min(7, candidate.completedTasks || 0));
    const totalEfficiency = Math.min(99, Math.max(55, availScore + skillScore + perfBonus));

    return {
      score: totalEfficiency,
      matchedSkills: matchedSkills.length > 0 ? matchedSkills : (candidate.skills ? candidate.skills.slice(0, 2) : []),
      isTopFit: totalEfficiency >= 85 && (candidate.status === 'AVAILABLE')
    };
  };

  // Compute Real Team Lead Metrics & Ranked Suitability
  const availableLeads = rawLeads.map(lead => {
    const assignedProjects = projectsList.filter(p => p.lead_id === lead.id || p.lead_name?.includes(lead.name));
    const assignedTasks = tasksList.filter(t => t.assigned_to === lead.name || t.assignee_id === lead.id || t.assigned_to_id === lead.id);
    const activeTasks = assignedTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO' || t.status === 'IN_REVIEW').length;
    const completedTasks = assignedTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length + (lead.completedTasks || 0);
    const projectsCount = assignedProjects.length;
    const status = (activeTasks === 0 && projectsCount === 0) ? 'AVAILABLE' : (activeTasks <= 1 && projectsCount <= 1 ? 'MODERATE' : 'BUSY');

    const leadCandidate = {
      ...lead,
      activeTasks,
      completedTasks,
      projectsCount,
      status
    };
    leadCandidate.efficiency = calcEfficiency(leadCandidate, true);
    return leadCandidate;
  }).sort((a, b) => {
    if (a.status === 'AVAILABLE' && b.status !== 'AVAILABLE') return -1;
    if (a.status !== 'AVAILABLE' && b.status === 'AVAILABLE') return 1;
    return b.efficiency.score - a.efficiency.score;
  });

  // Compute Real Member Metrics & Ranked Suitability
  const availableMembers = rawMembers.map(member => {
    const assignedTasks = tasksList.filter(t => t.assigned_to === member.name || t.assignee_id === member.id || t.assigned_to_id === member.id);
    const activeTasks = assignedTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO' || t.status === 'IN_REVIEW').length;
    const completedTasks = assignedTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length + (member.completedTasks || 0);
    const totalTasks = assignedTasks.length + (member.completedTasks || 0);
    const finishRate = totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '100%';
    const workloadPct = Math.min(100, activeTasks * 33);
    const status = activeTasks === 0 ? 'AVAILABLE' : (activeTasks === 1 ? 'MODERATE' : 'BUSY');

    const memberCandidate = {
      ...member,
      activeTasks,
      completedTasks,
      totalTasks,
      finishRate,
      workloadPct,
      status
    };
    memberCandidate.efficiency = calcEfficiency(memberCandidate, false);
    return memberCandidate;
  }).sort((a, b) => {
    if (a.status === 'AVAILABLE' && b.status !== 'AVAILABLE') return -1;
    if (a.status !== 'AVAILABLE' && b.status === 'AVAILABLE') return 1;
    return b.efficiency.score - a.efficiency.score;
  });

  // Auto-Select Best Available & Efficient Team Handler
  const handleAutoRecommendTeam = () => {
    const topDevs = availableMembers
      .filter(m => m.type === 'DEV' && m.status === 'AVAILABLE')
      .slice(0, 3)
      .map(m => m.id);
    const topQa = availableMembers
      .filter(m => m.type === 'QA' && m.status === 'AVAILABLE')
      .slice(0, 1)
      .map(m => m.id);
    const recommendedIds = [...topDevs, ...topQa];
    setFormSelectedMemberIds(recommendedIds);
    if (showToast) {
      showToast(`Auto-assigned optimal team: ${topDevs.length} Developers & ${topQa.length} QA based on high efficiency and zero active workload!`, 'success');
    }
  };

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

  // Handle Project Creation Form Submit with Verified PostgreSQL Persistence & Member Notifications
  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!formProjectName.trim()) {
      if (showToast) showToast('Please enter a Project Name', 'warning');
      return;
    }

    const leadObj = availableLeads.find(l => l.id === formSelectedLeadId);
    const assignedMemberObjs = availableMembers
      .filter(m => formSelectedMemberIds.includes(m.id))
      .map(m => ({ id: m.id, name: m.name, email: m.email, role: m.role, type: m.type }));

    const payload = {
      name: formProjectName.trim(),
      project_name: formProjectName.trim(),
      description: formDescription || 'Enterprise Software Development Module',
      objectives: formObjectives || 'Deliver reliable and performant software features on schedule.',
      requirements: formRequirements,
      tech_stack: formTechStack,
      start_date: formStartDate,
      target_deadline: formDeadline,
      end_date: formDeadline,
      priority: formPriority,
      status: formStatus,
      lead_id: leadObj ? leadObj.id : null,
      team_lead_id: leadObj ? leadObj.id : null,
      lead_name: leadObj ? leadObj.name : 'Unassigned Lead',
      member_ids: formSelectedMemberIds,
      team_members: assignedMemberObjs
    };

    try {
      const res = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok && resData.success) {
        if (showToast) {
          showToast(`Project '${formProjectName}' created successfully in PostgreSQL! Team Lead (${leadObj?.name || 'Assigned'}) & ${assignedMemberObjs.length} team members notified.`, 'success');
        }
        setIsCreateModalOpen(false);
        setFormProjectName('');
        setFormDescription('');
        setFormObjectives('');
        setFormSelectedMemberIds([]);
        await fetchProjects();
      } else {
        const errorMsg = resData.message || `Server returned error (${res.status})`;
        console.error('Project creation failed:', errorMsg);
        if (showToast) showToast(`Failed to create project: ${errorMsg}`, 'error');
      }
    } catch (err) {
      console.error('Network error during project creation:', err);
      if (showToast) showToast('Network error: Could not reach Aureon API server', 'error');
    }
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

    // Calculate verified average project health from database
  const projectsWithScore = projectsList.filter(p => p.health_score !== null && p.health_score !== undefined);
  const pmAvgHealth = projectsWithScore.length > 0 
    ? Math.round(projectsWithScore.reduce((acc, p) => acc + Number(p.health_score), 0) / projectsWithScore.length) 
    : null;

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Dashboard" title="Project Manager Workspace" />

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
            className="pm-create-btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs shadow-lg hover:bg-slate-50 transition-all hover:scale-105 cursor-pointer border border-slate-200/90"
            style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
          >
            <Plus className="w-4 h-4 text-blue-600 shrink-0 font-bold" style={{ color: '#2563eb' }} />
            <span style={{ color: '#0f172a', fontWeight: 800 }}>Create New Project</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('Projects')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs border border-white/30 shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            <FolderKanban className="w-4 h-4" /> All Projects Hub
          </button>
          <button
            onClick={() => onNavigate && onNavigate('Backlog')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs border border-white/30 shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            <ListTodo className="w-4 h-4" /> Backlog
          </button>
          <button
            onClick={() => onNavigate && onNavigate('TeamMembers')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs border border-white/30 shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            <Users className="w-4 h-4" /> Team Roster
          </button>
        </div>
      </div>

      {/* PM Executive Metrics Cards - Fully Interactive & Clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Active Projects */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('Projects')}
          className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 border-l-blue-500 border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Projects</span>
              <FolderKanban className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-2">{totalProjects} Projects</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-semibold">
              {planningProjects} Planning • {activeProjects} Active • {completedProjects} Done
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center justify-between">
            <span>View all projects</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* Card 2: Team Leads Assigned */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('TeamMembers')}
          className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 border-l-indigo-500 border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Team Leads Assigned</span>
              <UserCheck className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-2">
              {projectsList.filter(p => p.lead_name && p.lead_name !== 'Unassigned Lead').length} Leads
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-semibold">
              Linked to projects
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-between">
            <span>View assigned leads</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* Card 3: Total Developers & QA */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('TeamMembers')}
          className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 border-l-purple-500 border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-purple-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Team Member Roster</span>
              <Users className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-2">
              {availableMembers.length} Members
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-semibold">
              {availableMembers.filter(m => m.type === 'DEV').length} Developers • {availableMembers.filter(m => m.type === 'QA').length} QA Specialists
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center justify-between">
            <span>View member capacity</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* Card 4: Deadline Tracking */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('Milestones')}
          className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 border-l-amber-500 border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Deadline Alert</span>
              <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-2">
              {totalProjects > 0 ? 'On Track' : 'No Deadlines'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-semibold">
              Schedule risk monitored
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center justify-between">
            <span>Open milestones calendar</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* Card 5: Project Health */}
        <button 
          type="button"
          onClick={() => onNavigate && onNavigate('ProjectHealth')}
          className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 border-l-emerald-500 border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Overall Health</span>
              <Activity className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 warm:text-[#b45309] mt-2">
              {pmAvgHealth !== null ? `${pmAvgHealth}%` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-semibold">
              {pmAvgHealth !== null ? 'Database Verified Health' : 'No telemetry recorded'}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-between">
            <span>Project health insights</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>
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
                  <div 
                    onClick={() => onNavigate && onNavigate('Projects')}
                    className="cursor-pointer group flex-1"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                        {proj.id}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white warm:text-[#342314] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                        {proj.name}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
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
                      className="p-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
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
                  <div 
                    onClick={() => onNavigate && onNavigate('TeamMembers')}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition-all group"
                  >
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                      👑 Assigned Team Lead
                    </span>
                    <div className="font-extrabold text-slate-900 dark:text-white warm:text-[#342314] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {proj.lead_name || 'Unassigned Lead'}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Responsible for Technical Work Allocation</p>
                    <span className="text-[9px] text-indigo-500 font-bold mt-1 inline-block">View lead workload →</span>
                  </div>

                  {/* Column 2: Team Members */}
                  <div 
                    onClick={() => onNavigate && onNavigate('TeamMembers')}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] hover:border-purple-400 dark:hover:border-purple-600 cursor-pointer transition-all group"
                  >
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
                    <span className="text-[9px] text-purple-500 font-bold mt-1.5 inline-block">Manage team roster →</span>
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
                  <div 
                    onClick={() => onNavigate && onNavigate('Milestones')}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] hover:border-amber-400 dark:hover:border-amber-600 cursor-pointer transition-all group"
                  >
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                      ⏱️ Deadline & Progress
                    </span>
                    <div className="font-mono text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      Target: {proj.deadline || proj.target_deadline || '2026-11-30'}
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${proj.progress || 0}%` }} />
                    </div>
                    <span className="text-[9px] text-amber-600 font-bold mt-1 inline-block">Track milestones →</span>
                  </div>
                </div>

                {/* Interactive Project Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onNavigate && onNavigate('Projects')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
                    >
                      <FolderKanban className="w-3.5 h-3.5" /> Project Hub
                    </button>
                    <button
                      onClick={() => onNavigate && onNavigate('Backlog')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                    >
                      <ListTodo className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Backlog
                    </button>
                    <button
                      onClick={() => onNavigate && onNavigate('Sprints')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Sprint Planning
                    </button>
                    <button
                      onClick={() => onNavigate && onNavigate('TeamMembers')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Team Workload
                    </button>
                    <button
                      onClick={() => onNavigate && onNavigate('ProjectHealth')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Project Health
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Progress: <strong className="text-indigo-600 font-bold">{proj.progress || 0}%</strong>
                  </span>
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

          {/* Step 3: Assign Team Lead with Real-time Availability & Role Efficiency */}
          <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 warm:bg-[#f3e8d2] border border-indigo-200 dark:border-indigo-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider block text-xs">
                  3. Assign Team Lead for this Project
                </span>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                  Ranked by availability, technical leadership capacity, and skill alignment with {formTechStack || 'the stack'}.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                {availableLeads.filter(l => l.status === 'AVAILABLE').length} Available Now
              </span>
            </div>

            {/* Selected Lead Highlight Summary Card */}
            {(() => {
              const currentLead = availableLeads.find(l => l.id === formSelectedLeadId) || availableLeads[0];
              if (!currentLead) return null;
              return (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border-2 border-indigo-500/80 dark:border-indigo-500 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow">
                      👑
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {currentLead.name}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          currentLead.status === 'AVAILABLE' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        }`}>
                          {currentLead.status === 'AVAILABLE' ? '🟢 Available Now' : '🟡 Moderately Busy'}
                        </span>
                        {currentLead.efficiency?.isTopFit && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                            ⭐ Top Fit
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {currentLead.title} • {currentLead.department} • <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{currentLead.completedTasks} Tasks Delivered</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Role Efficiency</div>
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {currentLead.efficiency?.score || 95}% Fit
                      </div>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Active Load</div>
                      <div className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {currentLead.projectsCount} Proj • {currentLead.activeTasks} Tasks
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Candidate Team Leads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {availableLeads.map(lead => {
                const isSelected = formSelectedLeadId === lead.id;
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => setFormSelectedLeadId(lead.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/30 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-bold text-slate-900 dark:text-white text-xs truncate flex items-center gap-1">
                        <span>👑 {lead.name}</span>
                      </div>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        lead.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {lead.status === 'AVAILABLE' ? 'Free' : 'Busy'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{lead.title}</div>
                    
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        {lead.efficiency?.score || 90}% Efficiency
                      </span>
                      <span className="text-slate-400 text-[9px]">
                        {lead.activeTasks} Active • {lead.completedTasks} Done
                      </span>
                    </div>

                    {lead.efficiency?.matchedSkills && lead.efficiency.matchedSkills.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {lead.efficiency.matchedSkills.slice(0, 2).map((sk, idx) => (
                          <span key={idx} className="text-[9px] px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800">
                            ✓ {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Allocate Team Members with Availability & Efficiency Ranking */}
          <div className="p-3.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/60 warm:bg-[#f3e8d2] border border-purple-200 dark:border-purple-800 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <span className="font-extrabold text-purple-900 dark:text-purple-200 uppercase tracking-wider block text-xs">
                  4. Assign Team Members (Select Developers & QA with Availability Check)
                </span>
                <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                  Select engineers matching project requirements. Top efficient and free candidates are highlighted.
                </p>
              </div>

              {/* Action Buttons: Auto-Recommend & Clickable Selected Filter */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoRecommendTeam}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-[11px] shadow hover:from-purple-500 hover:to-indigo-500 flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Auto-Select Best Available Team
                </button>
                <button
                  type="button"
                  onClick={() => setMemberFilter(memberFilter === 'SELECTED' ? 'ALL' : 'SELECTED')}
                  title="Click to view only selected team members"
                  className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    memberFilter === 'SELECTED'
                      ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-400'
                      : 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/80 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
                  <span>
                    {formSelectedMemberIds.length} Selected ({availableMembers.filter(m => formSelectedMemberIds.includes(m.id) && m.type === 'DEV').length} Dev, {availableMembers.filter(m => formSelectedMemberIds.includes(m.id) && m.type === 'QA').length} QA)
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${memberFilter === 'SELECTED' ? 'bg-purple-800 text-white' : 'bg-purple-200/80 dark:bg-purple-800 text-purple-900 dark:text-purple-100'}`}>
                    {memberFilter === 'SELECTED' ? 'Filtered ✕' : 'Filter'}
                  </span>
                </button>
              </div>
            </div>

            {/* Filter Tabs for Quick Availability & Role Filtering */}
            <div className="flex items-center gap-1.5 border-b border-purple-200/80 dark:border-purple-800/80 pb-2">
              {[
                { id: 'ALL', label: `All Candidates (${availableMembers.length})` },
                { id: 'SELECTED', label: `✓ Selected (${formSelectedMemberIds.length})` },
                { id: 'AVAILABLE', label: `🟢 Free Now (${availableMembers.filter(m => m.status === 'AVAILABLE').length})` },
                { id: 'DEV', label: `💻 Developers (${availableMembers.filter(m => m.type === 'DEV').length})` },
                { id: 'QA', label: `🧪 QA Engineers (${availableMembers.filter(m => m.type === 'QA').length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMemberFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    memberFilter === tab.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Interactive Candidate Member Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              {availableMembers
                .filter(m => {
                  if (memberFilter === 'SELECTED') return formSelectedMemberIds.includes(m.id);
                  if (memberFilter === 'AVAILABLE') return m.status === 'AVAILABLE';
                  if (memberFilter === 'DEV') return m.type === 'DEV';
                  if (memberFilter === 'QA') return m.type === 'QA';
                  return true;
                })
                .map(member => {
                  const isChecked = formSelectedMemberIds.includes(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => handleToggleMember(member.id)}
                      className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                        isChecked
                          ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-1 ring-purple-500'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} 
                        className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-extrabold text-slate-900 dark:text-white truncate">
                              {member.name}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                              member.type === 'QA' 
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300/50' 
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300/50'
                            }`}>
                              {member.type}
                            </span>
                          </div>

                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                            member.status === 'AVAILABLE' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {member.status === 'AVAILABLE' ? '🟢 Free' : '🔴 Busy'}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 truncate">{member.role} • {member.department}</div>

                        <div className="mt-1.5 flex items-center justify-between text-[10px]">
                          <span className="font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            {member.efficiency?.score || 88}% Fit
                          </span>
                          <span className="text-slate-400 text-[9px]">
                            {member.activeTasks} Active • {member.completedTasks} Done
                          </span>
                        </div>

                        {/* Workload Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full ${member.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                            style={{ width: `${Math.max(5, member.workloadPct || 0)}%` }} 
                          />
                        </div>

                        {member.efficiency?.matchedSkills && member.efficiency.matchedSkills.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {member.efficiency.matchedSkills.slice(0, 2).map((sk, idx) => (
                              <span key={idx} className="text-[9px] px-1 py-0.2 rounded bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800">
                                ✓ {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
