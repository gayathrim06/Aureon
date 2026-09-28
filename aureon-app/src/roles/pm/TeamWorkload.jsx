import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Users, Activity, AlertTriangle, CheckCircle2, GitCommit, ShieldCheck, CheckSquare, Clock } from 'lucide-react';
import { getAuthHeaders } from '../../services/apiClient';

export const TeamWorkload = () => {
  const [projectsList, setProjectsList] = useState([]);
  const [tasksList, setTasksList] = useState([]);

  const [rawLeads, setRawLeads] = useState([]);
  const [rawMembers, setRawMembers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const headers = getAuthHeaders();
      try {
        const [projRes, taskRes, usersRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/v1/projects/', { headers }),
          fetch('http://127.0.0.1:8000/api/v1/tasks/', { headers }),
          fetch('http://127.0.0.1:8000/api/v1/users/', { headers })
        ]);
        if (projRes.ok) {
          const pData = await projRes.json();
          setProjectsList(pData.projects || []);
        }
        if (taskRes.ok) {
          const tData = await taskRes.json();
          setTasksList(tData.tasks || []);
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
              title: u.designation || 'Senior Tech Lead & Architect',
              email: u.email
            }));
          setRawLeads(leads);

          const members = allUsers
            .filter(u => u.role !== 'ROLE_LEAD' && u.role_name !== 'ROLE_LEAD' && u.role !== 'ROLE_ADMIN' && u.role_name !== 'ROLE_ADMIN')
            .map(u => ({
              id: u.id,
              name: u.full_name || u.name,
              role: u.designation || (u.role === 'ROLE_QA' ? 'QA Automation Specialist' : 'Software Engineer'),
              type: u.role === 'ROLE_QA' ? 'QA' : 'DEV',
              email: u.email
            }));
          setRawMembers(members);
        }
      } catch (err) {}
    };
    fetchData();
  }, []);

  // Compute Real Team Lead Metrics from actual DB projects/tasks
  const availableLeads = rawLeads.map(lead => {
    const assignedProjects = projectsList.filter(p => p.lead_id === lead.id || p.lead_name?.includes(lead.name));
    const assignedTasks = tasksList.filter(t => t.assigned_to === lead.name || t.assignee_id === lead.id || t.assigned_to_id === lead.id);
    const activeTasks = assignedTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO' || t.status === 'IN_REVIEW').length;
    const completedTasks = assignedTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
    const capacityPct = Math.min(100, activeTasks * 33);
    const status = activeTasks > 0 ? 'BUSY' : 'AVAILABLE';

    return {
      ...lead,
      activeTasks,
      completedTasks,
      projectsCount: assignedProjects.length,
      capacityPct,
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

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Team Members" />

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Team Members Availability & Workload Monitor
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real database metrics: Inspect active vs completed tasks and check workload capacity before assigning new project deliverables.
        </p>
      </div>

      {/* Senior Team Leads Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Project Team Leads (3 Senior Leads)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableLeads.map((lead) => (
            <div key={lead.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">👑 Team Lead</span>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white warm:text-[#342314]">{lead.name}</h4>
                  <p className="text-[11px] text-slate-500">{lead.title}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  lead.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}>
                  {lead.status === 'AVAILABLE' ? '✓ Ready for Project' : '⚠️ High Workload'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                  <span className="text-[10px] text-slate-400 block">Active Tasks</span>
                  <span className="font-bold text-indigo-600 text-sm">{lead.activeTasks}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                  <span className="text-[10px] text-slate-400 block">Finished Tasks</span>
                  <span className="font-bold text-emerald-600 text-sm">{lead.completedTasks}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                  <span className="text-[10px] text-slate-400 block">Projects</span>
                  <span className="font-bold text-purple-600 text-sm">{lead.projectsCount}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 font-semibold">
                  <span className="text-slate-500">Workload Capacity</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{lead.capacityPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${lead.capacityPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${lead.capacityPct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Developers & QA Roster */}
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
                  {member.status === 'AVAILABLE' ? '✓ Free' : '⚠️ Busy'}
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
  );
};
