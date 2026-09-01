import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Table, TableRow, TableCell } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';
import { FolderKanban, Plus, Search, Filter, Layers, UserCheck, Users, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Projects = () => {
  const { user, showToast } = useAuth();
  const [projectsList, setProjectsList] = useState([
    { id: 'PROJ-101', name: 'Aureon Core API Gateway', manager_name: 'Elizabeth Mathew (PM)', lead_name: 'David Chen (Tech Lead)', status: 'IN_PROGRESS', priority: 'HIGH', health_score: 96, target_deadline: '2026-10-15', team_members: [{ name: 'Sainu Anna' }, { name: 'Jiya Thomas' }] },
    { id: 'PROJ-102', name: 'Cloud Telemetry Mesh', manager_name: 'Sarah Jenkins (PM)', lead_name: 'Krishna Deepesh (Tech Lead)', status: 'IN_PROGRESS', priority: 'HIGH', health_score: 89, target_deadline: '2026-11-01', team_members: [{ name: 'Ram Kumar' }, { name: 'Venu QA' }] },
    { id: 'PROJ-103', name: 'Enterprise Auth & OAuth2', manager_name: 'Elizabeth Mathew (PM)', lead_name: 'Vikram Patel (Tech Lead)', status: 'COMPLETED', priority: 'MEDIUM', health_score: 98, target_deadline: '2026-08-30', team_members: [{ name: 'Alex Rivera' }] },
    { id: 'PROJ-104', name: 'SonarQube Vulnerability Scanner', manager_name: 'Sarah Jenkins (PM)', lead_name: 'David Chen (Tech Lead)', status: 'IN_PROGRESS', priority: 'HIGH', health_score: 94, target_deadline: '2026-12-05', team_members: [{ name: 'Michael Brown' }, { name: 'Ananya Varma' }] },
    { id: 'PROJ-105', name: 'Executive PDF/CSV Reports Engine', manager_name: 'Elizabeth Mathew (PM)', lead_name: 'Krishna Deepesh (Tech Lead)', status: 'COMPLETED', priority: 'LOW', health_score: 95, target_deadline: '2026-07-20', team_members: [{ name: 'Sneha Roy' }] }
  ]);

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // PM Form State for Assigning Team Lead & Team Members
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectPriority, setProjectPriority] = useState('HIGH');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [deadline, setDeadline] = useState('');

  // Available Tech Leads & Developers
  const availableLeads = [
    { id: 'usr_lead_1', name: 'Krishna Deepesh (Tech Lead)', email: 'krish@aureon.com' },
    { id: 'usr_lead_2', name: 'David Chen (Lead Architect)', email: 'david.c@aureon.com' },
    { id: 'usr_lead_3', name: 'Vikram Patel (Systems Lead)', email: 'vikram.p@aureon.com' }
  ];

  const availableMembers = [
    { id: 'usr_dev_1', name: 'Sainu Anna Sajan (Frontend Dev)', role: 'Developer' },
    { id: 'usr_dev_2', name: 'Jiya Thomas (Software Dev)', role: 'Developer' },
    { id: 'usr_dev_3', name: 'Rinta Thomas (Full Stack Dev)', role: 'Developer' },
    { id: 'usr_dev_4', name: 'Ram Kumar (React Engineer)', role: 'Developer' },
    { id: 'usr_qa_1', name: 'Venu QA (QA Lead)', role: 'QA Tester' },
    { id: 'usr_qa_2', name: 'Feba Biju (Executive QA)', role: 'QA Tester' },
    { id: 'usr_qa_3', name: 'Ananya Varma (Automation QA)', role: 'QA Tester' }
  ];

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
      // Fallback
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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
      showToast('Project Name is required', 'warning');
      return;
    }

    const leadObj = availableLeads.find(l => l.id === selectedLeadId);
    const assignedMemberObjs = availableMembers
      .filter(m => selectedMemberIds.includes(m.id))
      .map(m => ({ name: m.name.split(' (')[0] }));

    const newProj = {
      id: `PROJ-${Math.floor(100 + Math.random() * 900)}`,
      name: projectName,
      description: projectDesc,
      manager_name: `${user?.name || 'Elizabeth Mathew'} (PM)`,
      lead_name: leadObj ? leadObj.name : 'Unassigned Lead',
      status: 'IN_PROGRESS',
      priority: projectPriority,
      health_score: 95,
      target_deadline: deadline || '2026-12-31',
      team_members: assignedMemberObjs
    };

    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      await fetch('http://127.0.0.1:8000/api/v1/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDesc,
          priority: projectPriority,
          team_lead_id: selectedLeadId,
          member_ids: selectedMemberIds,
          target_deadline: deadline
        })
      });
    } catch (err) {
      // Fallback
    }

    setProjectsList([newProj, ...projectsList]);
    showToast(`Project '${projectName}' created. Team Lead & Members assigned.`, 'success');
    
    // Reset form
    setProjectName('');
    setProjectDesc('');
    setSelectedLeadId('');
    setSelectedMemberIds([]);
    setDeadline('');
    setIsModalOpen(false);
  };

  const filtered = projectsList.filter((p) => {
    const pName = p.name || p.project_name || '';
    const pId = p.id || '';
    const matchSearch = pName.toLowerCase().includes(search.toLowerCase()) || pId.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === 'All' || p.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  const isPM = !user?.role || user.role === 'ROLE_PM' || user.role === 'ROLE_ADMIN';

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Project Management & Team Governance Hub</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1">
            PMs define projects and assign Team Leads + Members. Team Leads distribute technical tasks.
          </p>
        </div>
        {isPM && (
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            PM: Initialize Project & Assign Team Lead
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl border border-indigo-500/30">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Enterprise Project Portfolio</CardTitle>
              <CardDescription>PM-assigned projects, appointed Team Leads, and allocated team members</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs text-slate-900 dark:text-white warm:text-[#342314] border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] rounded-xl focus:outline-none"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs text-slate-900 dark:text-white warm:text-[#342314] border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] rounded-xl focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </CardHeader>

        <Table headers={['Project Name', 'Assigned Team Lead (PM Selected)', 'Allocated Team Members', 'Status', 'Priority', 'Health', 'Target Deadline']}>
          {filtered.map((proj) => (
            <TableRow key={proj.id || proj.name}>
              <TableCell>
                <div>
                  <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] font-bold mr-2">{proj.id}</span>
                  <span className="font-bold text-slate-900 dark:text-white warm:text-[#342314]">{proj.name || proj.project_name}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 warm:bg-[#f3e8d2] text-indigo-700 dark:text-indigo-300 warm:text-[#342314] text-xs font-bold border border-indigo-200 dark:border-indigo-800 warm:border-[#cbb68e] inline-flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600 warm:text-[#b45309]" />
                  {proj.lead_name || 'Unassigned Lead'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {proj.team_members && proj.team_members.length > 0 ? (
                    proj.team_members.map((m, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] text-[11px] font-semibold text-slate-700 dark:text-slate-300 warm:text-[#342314] border border-slate-200 dark:border-slate-700 warm:border-[#cbb68e]">
                        {m.name || m}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">PM Members Pending</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={proj.status === 'COMPLETED' ? 'success' : 'brand'} size="sm" dot>
                  {proj.status || 'IN_PROGRESS'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={proj.priority === 'HIGH' ? 'error' : 'warning'} size="sm">
                  {proj.priority || 'HIGH'}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-xs font-bold text-emerald-500">{proj.health_score || 95}%</span>
              </TableCell>
              <TableCell className="text-xs font-mono text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
                {proj.target_deadline || '2026-12-31'}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>

      {/* PM Modal: Create Project & Assign Team Lead + Members */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="PM Governance: Initialize Project & Assign Team Lead">
        <form onSubmit={handleCreateProjectSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">Project Name</label>
            <input
              type="text"
              required
              placeholder="e.g. NextGen Microservices Refactor"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs font-sans text-slate-900 dark:text-white warm:text-[#342314]"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Project Description & Scope</label>
            <textarea
              rows={2}
              placeholder="Project requirements, budget, technology stack..."
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs font-sans text-slate-900 dark:text-white warm:text-[#342314]"
            />
          </div>

          {/* 👑 PM STEP 1: SELECT & ASSIGN TEAM LEAD */}
          <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 warm:bg-[#f3e8d2] border border-indigo-200 dark:border-indigo-800 warm:border-[#cbb68e] space-y-2">
            <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 warm:text-[#b45309] uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600 warm:text-[#b45309]" /> PM Governance Step 1: Assign Team Lead
            </span>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] text-xs font-bold text-slate-900 dark:text-white warm:text-[#342314]"
            >
              <option value="">-- Select Senior Team Lead --</option>
              {availableLeads.map(lead => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} ({lead.email})
                </option>
              ))}
            </select>
          </div>

          {/* 👥 PM STEP 2: ALLOCATE TEAM MEMBERS (DEVS & QA) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-700 warm:border-[#cbb68e] space-y-2">
            <span className="text-[11px] font-extrabold text-slate-900 dark:text-white warm:text-[#342314] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-500" /> PM Governance Step 2: Assign Developers & QA Testers
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pt-1">
              {availableMembers.map(member => (
                <label key={member.id} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] cursor-pointer hover:border-indigo-500">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white warm:text-[#342314] block text-[11px]">{member.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 warm:text-[#69523c]">{member.role}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Priority Level</label>
              <select
                value={projectPriority}
                onChange={(e) => setProjectPriority(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Target Deadline</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Initialize Project & Assign Team Lead
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
