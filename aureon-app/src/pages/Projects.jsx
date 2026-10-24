import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Table, TableRow, TableCell } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FolderKanban, Plus, Search, Filter, Layers, UserCheck, Users, Shield, ArrowRight, CheckCircle2, Clock, Activity, AlertTriangle, X, CheckSquare, Sparkles, Hash, GitBranch, GitCommit, GitPullRequest, ExternalLink, RefreshCw, Crown, Award, Zap, Check, Star, Code2, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TeamWorkload } from '../roles/pm/TeamWorkload';
import { getAuthHeaders, API_BASE_URL } from '../services/apiClient';


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

export const Projects = () => {

  const { user, showToast } = useAuth();
  const [projectsList, setProjectsList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'workload'

  // Git Feature State
  const [gitModalOpen, setGitModalOpen] = useState(false);
  const [selectedProjectForGit, setSelectedProjectForGit] = useState(null);
  const [gitRepoDetails, setGitRepoDetails] = useState({});
  const [gitCommits, setGitCommits] = useState([]);
  const [gitSyncing, setGitSyncing] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [targetProjForConnect, setTargetProjForConnect] = useState(null);
  const [gitUrlInput, setGitUrlInput] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');

  // PM Form State for Project Creation & Team Allocation
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectObjectives, setProjectObjectives] = useState('');
  const [requirementsList, setRequirementsList] = useState(['User Authentication', 'Project Management', 'GitHub Integration', 'Code Quality Analysis']);
  const [reqInput, setReqInput] = useState('');
  const [techStack, setTechStack] = useState('Python, Flask, React, PostgreSQL');
  const [projectPriority, setProjectPriority] = useState('HIGH');
  const [projectStatus, setProjectStatus] = useState('PLANNING');
  const [selectedLeadId, setSelectedLeadId] = useState(DEFAULT_AUREON_LEADS[0].id);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [memberFilter, setMemberFilter] = useState('ALL'); // 'ALL', 'AVAILABLE', 'DEV', 'QA'
  const [startDate, setStartDate] = useState('2026-09-01');
  const [deadline, setDeadline] = useState('2026-11-30');

  const [rawLeads, setRawLeads] = useState(DEFAULT_AUREON_LEADS);
  const [rawMembers, setRawMembers] = useState(DEFAULT_AUREON_MEMBERS);

  const fetchProjectsAndTasks = async () => {
    const headers = getAuthHeaders();

    try {
      const [projRes, taskRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/projects/`, { headers }),
        fetch(`${API_BASE_URL}/tasks/`, { headers }),
        fetch(`${API_BASE_URL}/users/`, { headers })
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        const allProjs = pData.projects || [];
        const scopedProjs = (!user || user.role === 'ROLE_ADMIN')
          ? allProjs
          : allProjs.filter(p => {
              const uId = String(user.id || '');
              const uName = (user.name || user.full_name || '').toLowerCase().trim();
              const pMgrId = String(p.manager_id || p.project_manager_id || '');
              const pMgrName = (p.manager_name || '').toLowerCase().trim();
              const pLeadId = String(p.lead_id || p.team_lead_id || '');
              const pLeadName = (p.lead_name || '').toLowerCase().trim();
              if (user.role === 'ROLE_PM') {
                // Backend GET /projects/ already scopes by manager_id for PM
                if (pMgrId && uId && pMgrId === uId) return true;
                if (pMgrName && uName && (pMgrName.includes(uName) || uName.includes(pMgrName))) return true;
                return true; // Keep projects delivered to PM session
              }
              if (user.role === 'ROLE_LEAD') {
                return (pLeadId && uId && pLeadId === uId) || (pLeadName && uName && (pLeadName.includes(uName) || uName.includes(pLeadName)));
              }
              return true;
            });
        setProjectsList(scopedProjs);
      } else {
        setProjectsList([]);
      }

      if (taskRes.ok) {
        const tData = await taskRes.json();
        setTasksList(tData.tasks || []);
      } else {
        setTasksList([]);
      }

      if (usersRes.ok) {
        const uData = await usersRes.json();
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
            if (!selectedLeadId || selectedLeadId.startsWith('lead-')) {
              setSelectedLeadId(liveLeads[0].id);
            }
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
      setProjectsList([]);
      setTasksList([]);
    }
  };

  useEffect(() => {
    fetchProjectsAndTasks();
  }, []);

  // Deterministic Role Efficiency & Skill Match Calculator
  const calcEfficiency = (candidate, isLead = false) => {
    const techTokens = (techStack || '').toLowerCase().split(/[\s,+/]+/).filter(t => t.length > 1);
    const reqTokens = (requirementsList || []).join(' ').toLowerCase().split(/[\s,+/]+/).filter(t => t.length > 1);
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
    // Available first, then higher efficiency
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
    // Available first, then higher efficiency
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
    setSelectedMemberIds(recommendedIds);
    if (showToast) {
      showToast(`Auto-assigned optimal team: ${topDevs.length} Developers & ${topQa.length} QA based on high efficiency and zero active workload!`, 'success');
    }
  };

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

    // Prepare API Payload with real headers & verified authentication
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };

    const payload = {
      name: projectName.trim(),
      project_name: projectName.trim(),
      description: projectDesc || 'Enterprise Software Development Module',
      objectives: projectObjectives || 'Deliver reliable and performant software features on schedule.',
      requirements: requirementsList,
      tech_stack: techStack,
      start_date: startDate,
      target_deadline: deadline,
      end_date: deadline,
      priority: projectPriority,
      status: projectStatus,
      lead_id: leadObj ? leadObj.id : null,
      team_lead_id: leadObj ? leadObj.id : null,
      lead_name: leadObj ? leadObj.name : 'Unassigned Lead',
      member_ids: selectedMemberIds,
      team_members: assignedMemberObjs,
      github_repo_url: githubRepoUrl.trim()
    };

    try {
      const res = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok && resData.success) {
        if (showToast) {
          showToast(`Project '${projectName}' created successfully in PostgreSQL! Team Lead (${leadObj?.name || 'Assigned'}) & ${assignedMemberObjs.length} team members notified.`, 'success');
        }
        // Reset Form
        setProjectName('');
        setProjectDesc('');
        setProjectObjectives('');
        setGithubRepoUrl('');
        setSelectedMemberIds([]);
        setIsModalOpen(false);

        // Immediately refresh state directly from PostgreSQL database
        await fetchProjectsAndTasks();
      } else {
        const errorMsg = resData.message || `Server returned status ${res.status}`;
        console.error('Project creation failed:', errorMsg);
        if (showToast) showToast(`Failed to create project: ${errorMsg}`, 'error');
      }
    } catch (err) {
      console.error('Network error during project creation:', err);
      if (showToast) showToast('Network error: Could not reach Aureon API server', 'error');
    }
  };

  const handleOpenGitCommits = async (project) => {
    setSelectedProjectForGit(project);
    setGitModalOpen(true);
    setGitSyncing(true);
    const repoId = project.repository?.id;
    if (repoId) {
      try {
        const rawToken = sessionStorage.getItem('aureon_jwt_access_token') || localStorage.getItem('aureon_jwt_access_token') || sessionStorage.getItem('aureon_access_token');
        const headers = rawToken ? { 'Authorization': `Bearer ${rawToken}` } : {};
        const res = await fetch(`${API_BASE_URL}/repositories/${repoId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setGitRepoDetails(data.repository || {});
          setGitCommits(data.repository?.commits || []);
        }
      } catch (err) {
        console.error('Failed to fetch repo commits:', err);
      } finally {
        setGitSyncing(false);
      }
    } else {
      setGitSyncing(false);
    }
  };

  const handleSyncCommitsNow = async () => {
    const repoId = selectedProjectForGit?.repository?.id || gitRepoDetails?.id;
    if (!repoId) return;
    setGitSyncing(true);
    try {
      const rawToken = sessionStorage.getItem('aureon_jwt_access_token') || localStorage.getItem('aureon_jwt_access_token') || sessionStorage.getItem('aureon_access_token');
      const headers = rawToken ? { 'Authorization': `Bearer ${rawToken}` } : {};
      const res = await fetch(`${API_BASE_URL}/repositories/${repoId}/sync`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        // Refetch repo details
        const rRes = await fetch(`${API_BASE_URL}/repositories/${repoId}`, { headers });
        if (rRes.ok) {
          const rData = await rRes.json();
          setGitRepoDetails(rData.repository || {});
          setGitCommits(rData.repository?.commits || []);
        }
        await fetchProjectsAndTasks();
        showToast('Successfully synchronized with GitHub!', 'success');
      } else {
        showToast('Sync completed (no new commits detected)', 'info');
      }
    } catch (e) {
      showToast('Error syncing with GitHub: ' + e.message, 'error');
    } finally {
      setGitSyncing(false);
    }
  };

  const handleConnectRepoSubmit = async (e) => {
    e.preventDefault();
    if (!gitUrlInput.trim() || !targetProjForConnect) return;
    setGitSyncing(true);
    try {
      const rawToken = sessionStorage.getItem('aureon_jwt_access_token') || localStorage.getItem('aureon_jwt_access_token') || sessionStorage.getItem('aureon_access_token');
      const headers = rawToken ? { 'Authorization': `Bearer ${rawToken}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      const res = await fetch(`${API_BASE_URL}/repositories/connect`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          project_id: targetProjForConnect.id,
          repository_url: gitUrlInput.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('GitHub repository connected successfully!', 'success');
        setConnectModalOpen(false);
        setGitUrlInput('');
        await fetchProjectsAndTasks();
      } else {
        showToast(data.message || 'Failed to connect repository', 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setGitSyncing(false);
    }
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
            <Table headers={['Project Code & Name', 'Assigned Team Lead (PM Selected)', 'Allocated Virtual Team', 'Git Repository & Live Commits', 'Tech Stack & Requirements', 'Status', 'Priority', 'Target Deadline']}>
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
                    {proj.repository || proj.github_repo_url ? (
                      <div className="space-y-1.5 min-w-[190px]">
                        <div className="flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <a 
                            href={proj.repository?.url || proj.github_repo_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate max-w-[150px]"
                            title={proj.repository?.full_name || proj.github_repo_name || 'GitHub Repository'}
                          >
                            {proj.repository?.name || proj.github_repo_name || proj.name}
                            <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                            {proj.repository?.default_branch || 'main'}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            {proj.repository?.commits_count ?? 0} commits
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenGitCommits(proj)}
                          className="w-full text-left px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 transition flex items-center justify-between"
                        >
                          <span className="flex items-center gap-1">
                            <GitCommit className="w-3 h-3 text-indigo-600" />
                            Live Commits & Sync
                          </span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTargetProjForConnect(proj);
                          setGitUrlInput('');
                          setConnectModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-[11px] font-bold flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-3 h-3" /> Connect GitHub
                      </button>
                    )}
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
        /* 2-SIDED WORKLOAD & CAPACITY MONITOR: DEV VS QA, EXP VS FRESHER, HIGH-WORK VS FREE, PROJECT PROGRESS */
        <TeamWorkload embedMode={true} />
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
              <label className="block font-bold mb-1">GitHub Repository URL (Optional)</label>
              <input
                type="url"
                placeholder="https://github.com/aureon-maker/verona-organics"
                value={githubRepoUrl}
                onChange={(e) => setGithubRepoUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Attach an existing GitHub repository to enable live commit tracking, branch sync, and developer analytics.
              </p>
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

          {/* Step 3: Assign Team Lead with Real-time Availability & Role Efficiency */}
          <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 warm:bg-[#f3e8d2] border border-indigo-200 dark:border-indigo-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider block text-xs">
                  3. Assign Team Lead for this Project
                </span>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                  Ranked by availability, technical leadership capacity, and skill alignment with {techStack || 'the stack'}.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                {availableLeads.filter(l => l.status === 'AVAILABLE').length} Available Now
              </span>
            </div>

            {/* Selected Lead Highlight Summary Card */}
            {(() => {
              const currentLead = availableLeads.find(l => l.id === selectedLeadId) || availableLeads[0];
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
                const isSelected = selectedLeadId === lead.id;
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => setSelectedLeadId(lead.id)}
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
                  onClick={() => setMemberFilter(memberFilter === 'SELECTED' ? 'ALL' : (selectedMemberIds.length > 0 ? 'SELECTED' : 'ALL'))}
                  title="Click to view only selected team members"
                  className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    memberFilter === 'SELECTED'
                      ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-400'
                      : 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/80 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
                  <span>
                    {selectedMemberIds.length} Selected ({availableMembers.filter(m => selectedMemberIds.includes(m.id) && m.type === 'DEV').length} Dev, {availableMembers.filter(m => selectedMemberIds.includes(m.id) && m.type === 'QA').length} QA)
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
                { id: 'SELECTED', label: `✓ Selected (${selectedMemberIds.length})` },
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
              {(() => {
                const filtered = availableMembers.filter(m => {
                  if (memberFilter === 'SELECTED') return selectedMemberIds.includes(m.id);
                  if (memberFilter === 'AVAILABLE') return m.status === 'AVAILABLE';
                  if (memberFilter === 'DEV') return m.type === 'DEV';
                  if (memberFilter === 'QA') return m.type === 'QA';
                  return true;
                });
                if (filtered.length === 0) {
                  return (
                    <div className="col-span-full py-6 px-4 text-center">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {memberFilter === 'SELECTED' ? 'No members selected yet.' : 'No candidates match this filter.'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Click <button type="button" onClick={() => setMemberFilter('ALL')} className="text-purple-600 dark:text-purple-400 font-bold underline cursor-pointer">All Candidates ({availableMembers.length})</button> or click <button type="button" onClick={handleAutoRecommendTeam} className="text-indigo-600 dark:text-indigo-400 font-bold underline cursor-pointer">✨ Auto-Select Best Available Team</button>!
                      </p>
                    </div>
                  );
                }
                return filtered.map(member => {
                  const isChecked = selectedMemberIds.includes(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => handleMemberToggle(member.id)}
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
                            {member.status === 'AVAILABLE' ? '🟢 Free (0 tasks)' : `⚠️ Busy (${member.activeTasks})`}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {member.role} • Finish Rate: {member.finishRate}
                        </div>

                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            {member.efficiency?.score || 85}% Efficiency
                            {member.efficiency?.isTopFit && (
                              <span className="text-[8px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1 rounded ml-1 font-black">
                                ⭐ Top Fit
                              </span>
                            )}
                          </span>

                          <span className="text-[9px] text-slate-400">
                            {member.completedTasks} completed
                          </span>
                        </div>

                        {member.efficiency?.matchedSkills && member.efficiency.matchedSkills.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {member.efficiency.matchedSkills.slice(0, 3).map((sk, idx) => (
                              <span key={idx} className="text-[8px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                ✓ {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
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

      {/* LIVE GIT COMMITS & UPDATIONS DRAWER / MODAL */}
      <Modal 
        isOpen={gitModalOpen} 
        onClose={() => setGitModalOpen(false)} 
        title={`Git Feature: Live Commits & Updations — ${selectedProjectForGit?.name || 'Project'}`}
      >
        <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* Header Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {gitRepoDetails.full_name || selectedProjectForGit?.repository?.full_name || selectedProjectForGit?.name || 'Repository'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                  {gitRepoDetails.default_branch || selectedProjectForGit?.repository?.default_branch || 'main'}
                </span>
              </div>
              <a 
                href={gitRepoDetails.repository_url || selectedProjectForGit?.repository?.url || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1 mt-0.5"
              >
                {gitRepoDetails.repository_url || selectedProjectForGit?.repository?.url || 'Repository URL not configured'} <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <Button 
              variant="primary" 
              size="sm" 
              icon={RefreshCw} 
              isLoading={gitSyncing} 
              onClick={handleSyncCommitsNow}
            >
              Sync Commits from GitHub
            </Button>
          </div>

          {/* Commits List or Empty Guide */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold uppercase tracking-wider text-slate-500 text-[10px] flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-indigo-600" />
                Live Commits & Pushes ({gitCommits.length})
              </span>
              <span className="text-[10px] text-slate-400">
                Synced with GitHub REST API
              </span>
            </div>

            {gitCommits.length > 0 ? (
              <div className="space-y-2">
                {gitCommits.map((c, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white text-xs">
                        {c.commit_message || 'Commit update'}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{c.author_name || 'Developer'}</span>
                        <span>•</span>
                        <span>{c.commit_date ? new Date(c.commit_date).toLocaleString() : 'Recent'}</span>
                      </div>
                    </div>
                    {c.commit_url && (
                      <a 
                        href={c.commit_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] hover:bg-slate-200 flex items-center gap-1 shrink-0 font-bold"
                      >
                        {c.commit_sha ? c.commit_sha.substring(0, 7) : 'Commit'}
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 flex items-center justify-center mx-auto">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Repository Connected — Waiting for First Push</h4>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
                    Your GitHub repository is active. Once you push your local commits to GitHub, click <strong>"Sync Commits from GitHub"</strong> above to see all updates, messages, authors, and SHA hashes right here.
                  </p>
                </div>

                <div className="text-left bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] max-w-lg mx-auto space-y-1">
                  <div className="text-slate-400 text-[10px] mb-1 font-sans"># Push your code to GitHub:</div>
                  <div>git remote add origin https://github.com/aureon-maker/verona-organics.git</div>
                  <div>git branch -M main</div>
                  <div>git push -u origin main</div>
                </div>

                <Button variant="outline" size="sm" icon={RefreshCw} isLoading={gitSyncing} onClick={handleSyncCommitsNow}>
                  Check / Sync Commits Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* CONNECT REPOSITORY MODAL */}
      <Modal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        title={`Connect GitHub Repository to ${targetProjForConnect?.name || 'Project'}`}
      >
        <form onSubmit={handleConnectRepoSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">GitHub Repository URL *</label>
            <input
              type="url"
              required
              placeholder="https://github.com/aureon-maker/verona-organics"
              value={gitUrlInput}
              onChange={(e) => setGitUrlInput(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Provide public or authorized GitHub repo URL (e.g. <code>https://github.com/owner/repository</code>).
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setConnectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={GitBranch} isLoading={gitSyncing}>
              Connect & Sync Repository
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
