import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Users, Activity, AlertTriangle, CheckCircle2, GitCommit, ShieldCheck, CheckSquare, Clock } from 'lucide-react';

export const TeamWorkload = () => {
  const availableLeads = [
    { id: 'usr_lead_1', name: 'Krishna Deepesh', role: 'Team Lead', title: 'Senior Tech Lead & Architect', email: 'krish@aureon.com', activeTasks: 2, completedTasks: 18, projectsCount: 1, status: 'AVAILABLE', capacityPct: 40 },
    { id: 'usr_lead_2', name: 'David Chen', role: 'Team Lead', title: 'Lead Systems Architect', email: 'david.c@aureon.com', activeTasks: 1, completedTasks: 24, projectsCount: 1, status: 'AVAILABLE', capacityPct: 25 },
    { id: 'usr_lead_3', name: 'Vikram Patel', role: 'Team Lead', title: 'Principal Backend Engineer', email: 'vikram.p@aureon.com', activeTasks: 3, completedTasks: 15, projectsCount: 2, status: 'HIGH_WORKLOAD', capacityPct: 85 }
  ];

  const availableMembers = [
    { id: 'usr_dev_1', name: 'Ram Kumar', role: 'Frontend UI Engineer', type: 'DEV', activeTasks: 1, completedTasks: 12, totalTasks: 13, finishRate: '92%', workloadPct: 35, status: 'AVAILABLE' },
    { id: 'usr_dev_2', name: 'Alex Rivera', role: 'DevOps & Cloud Architect', type: 'DEV', activeTasks: 2, completedTasks: 16, totalTasks: 18, finishRate: '89%', workloadPct: 55, status: 'AVAILABLE' },
    { id: 'usr_dev_3', name: 'Priya Sharma', role: 'Database & Analytics Engineer', type: 'DEV', activeTasks: 0, completedTasks: 14, totalTasks: 14, finishRate: '100%', workloadPct: 15, status: 'AVAILABLE' },
    { id: 'usr_dev_4', name: 'Michael Brown', role: 'Security Engineering Lead', type: 'DEV', activeTasks: 3, completedTasks: 9, totalTasks: 12, finishRate: '75%', workloadPct: 80, status: 'HIGH_WORKLOAD' },
    { id: 'usr_dev_5', name: 'Sneha Roy', role: 'Flutter & Mobile Engineer', type: 'DEV', activeTasks: 1, completedTasks: 10, totalTasks: 11, finishRate: '91%', workloadPct: 30, status: 'AVAILABLE' },
    { id: 'usr_qa_1', name: 'Venu QA', role: 'Lead QA Automation Engineer', type: 'QA', activeTasks: 1, completedTasks: 22, totalTasks: 23, finishRate: '96%', workloadPct: 40, status: 'AVAILABLE' },
    { id: 'usr_qa_2', name: 'Ananya Varma', role: 'Test Automation Specialist', type: 'QA', activeTasks: 0, completedTasks: 15, totalTasks: 15, finishRate: '100%', workloadPct: 10, status: 'AVAILABLE' },
    { id: 'usr_qa_3', name: 'Sarah Thomas', role: 'Security & Regression QA', type: 'QA', activeTasks: 2, completedTasks: 8, totalTasks: 10, finishRate: '80%', workloadPct: 60, status: 'AVAILABLE' }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Team Members" />

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Team Members Availability & Workload Monitor
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View all team leads, developers, and QA testers, inspect their active vs completed tasks, and check workload capacity before assigning next tasks.
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
