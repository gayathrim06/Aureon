import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Table, TableRow, TableCell } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FolderKanban, Plus, Search, Filter, Layers, UserCheck, Users, Shield, ArrowRight, CheckCircle2, Clock, Activity, AlertTriangle, X, CheckSquare, Sparkles, Hash, GitBranch, GitCommit, GitPullRequest, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TeamWorkload } from '../roles/pm/TeamWorkload';

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
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [startDate, setStartDate] = useState('2026-09-01');
  const [deadline, setDeadline] = useState('2026-11-30');

  const [rawLeads, setRawLeads] = useState([]);
  const [rawMembers, setRawMembers] = useState([]);

  const fetchProjectsAndTasks = async () => {
    const rawToken = sessionStorage.getItem('aureon_jwt_access_token') || localStorage.getItem('aureon_jwt_access_token') || sessionStorage.getItem('aureon_access_token');
    const isRealJwt = rawToken && rawToken.startsWith('ey') && rawToken.split('.').length === 3;
    const headers = isRealJwt ? { 'Authorization': `Bearer ${rawToken}` } : {};

    try {
      const [projRes, taskRes, usersRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/projects/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/tasks/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/users/', { headers })
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

      if (usersRes.ok) {
        const uData = await usersRes.json();
        const allUsers = uData.users || [];
        const leads = allUsers
          .filter(u => u.role === 'ROLE_LEAD' || u.role_name === 'ROLE_LEAD')
          .map(u => ({
            id: u.id,
            name: u.full_name || u.name,
            role: 'Team Lead',
            title: u.designation || 'Senior Tech Lead',
            email: u.email
          }));
        setRawLeads(leads);
        if (leads.length > 0) setSelectedLeadId(leads[0].id);

        const members = allUsers
          .filter(u => u.role !== 'ROLE_LEAD' && u.role_name !== 'ROLE_LEAD' && u.role !== 'ROLE_ADMIN' && u.role_name !== 'ROLE_ADMIN')
          .map(u => ({
            id: u.id,
            name: u.full_name || u.name,
            role: u.designation || (u.role === 'ROLE_QA' ? 'QA Automation Engineer' : 'Software Engineer'),
            type: u.role === 'ROLE_QA' ? 'QA' : 'DEV',
            email: u.email
          }));
        setRawMembers(members);
      }
    } catch (err) {
      setProjectsList([]);
      setTasksList([]);
    }
  };

  useEffect(() => {
    fetchProjectsAndTasks();
  }, []);

  // Compute Real Team Lead Metrics from actual DB projects/tasks
  const availableLeads = rawLeads.map(lead => {
    const assignedProjects = projectsList.filter(p => p.lead_id === lead.id || p.lead_name?.includes(lead.name));
    const assignedTasks = tasksList.filter(t => t.assigned_to === lead.name || t.assignee_id === lead.id || t.assigned_to_id === lead.id);
    const activeTasks = assignedTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO' || t.status === 'IN_REVIEW').length;
    const completedTasks = assignedTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
    const status = activeTasks > 0 ? 'BUSY' : 'AVAILABLE';

    return {
      ...lead,
      activeTasks,
      completedTasks,
      projectsCount: assignedProjects.length,
      status
    };
  });

  // Compute Real Member Metrics from actual DB projects/tasks
  const availableMembers = rawMembers.map(member => {
    const assignedTasks = tasksList.filter(t => t.assigned_to === member.name || t.assignee_id === member.id || t.assigned_to_id === member.id);
    const activeTasks = assignedTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO' || t.status === 'IN_REVIEW').length;
    const completedTasks = assignedTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
    const totalTasks = assignedTasks.length;
    const finishRate = totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%';
    const workloadPct = Math.min(100, activeTasks * 33);
    const status = activeTasks > 0 ? 'BUSY' : 'AVAILABLE';

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
    setGithubRepoUrl('');
    setIsModalOpen(false);
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
        const res = await fetch(`http://127.0.0.1:8000/api/v1/repositories/${repoId}`, { headers });
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
      const res = await fetch(`http://127.0.0.1:8000/api/v1/repositories/${repoId}/sync`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        // Refetch repo details
        const rRes = await fetch(`http://127.0.0.1:8000/api/v1/repositories/${repoId}`, { headers });
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
      const res = await fetch('http://127.0.0.1:8000/api/v1/repositories/connect', {
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
                            {proj.repository?.name || proj.github_repo_name || 'verona-organics'}
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
                  {gitRepoDetails.full_name || selectedProjectForGit?.repository?.full_name || 'verona-organics'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                  {gitRepoDetails.default_branch || selectedProjectForGit?.repository?.default_branch || 'main'}
                </span>
              </div>
              <a 
                href={gitRepoDetails.repository_url || selectedProjectForGit?.repository?.url || 'https://github.com/aureon-maker/verona-organics'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1 mt-0.5"
              >
                {gitRepoDetails.repository_url || selectedProjectForGit?.repository?.url || 'https://github.com/aureon-maker/verona-organics'} <ExternalLink className="w-3 h-3" />
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
