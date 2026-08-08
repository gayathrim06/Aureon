import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../common/Card';
import { Badge } from '../common/Badge';
import { Users, Shield, FolderKanban, Terminal, Code2 } from 'lucide-react';

export const TeamOverview = ({ teamBreakdown }) => {
  const roles = [
    { key: 'administrators', name: 'Administrators', count: teamBreakdown.administrators.count, icon: Shield, color: 'text-purple-400', desc: 'Full System & IAM Config' },
    { key: 'projectManagers', name: 'Project Managers', count: teamBreakdown.projectManagers.count, icon: FolderKanban, color: 'text-[#2563EB]', desc: 'Sprint & Delivery Tracking' },
    { key: 'teamLeads', name: 'Team Leads', count: teamBreakdown.teamLeads.count, icon: Terminal, color: 'text-[#10B981]', desc: 'Architecture & Code Reviews' },
    { key: 'developers', name: 'Developers', count: teamBreakdown.developers.count, icon: Code2, color: 'text-[#38BDF8]', desc: 'Active Feature Implementation' },
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle icon={Users}>Engineering Team Allocation</CardTitle>
          <CardDescription>Squad member distribution across organization roles</CardDescription>
        </div>
      </CardHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roles.map((role) => {
          const RoleIcon = role.icon;
          return (
            <div
              key={role.key}
              className="p-4 bg-[#111827] border border-[#334155] rounded-[12px] hover:border-[#2563EB]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 bg-[#1F2937] rounded-[8px] ${role.color}`}>
                  <RoleIcon className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold text-[#F8FAFC]">{role.count}</span>
              </div>
              <h4 className="text-sm font-semibold text-[#F8FAFC] mt-2">{role.name}</h4>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">{role.desc}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
