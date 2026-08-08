import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../common/Card';
import { Badge } from '../common/Badge';
import { Activity, FolderKanban, CheckSquare, GitBranch, ShieldCheck, FileText } from 'lucide-react';

export const RecentActivities = ({ activities }) => {
  const iconMap = {
    project: FolderKanban,
    task: CheckSquare,
    repo: GitBranch,
    quality: ShieldCheck,
    report: FileText,
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle icon={Activity}>Recent Platform Activities</CardTitle>
          <CardDescription>Chronological engineering audit log & telemetry stream</CardDescription>
        </div>
      </CardHeader>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#334155]">
        {activities.map((act) => {
          const Icon = iconMap[act.type] || Activity;
          return (
            <div key={act.id} className="relative flex items-start justify-between gap-4 group">
              {/* Timeline Bullet Node */}
              <div className="absolute -left-6 p-1 bg-[#1F2937] border border-[#2563EB] text-[#2563EB] rounded-full group-hover:scale-125 transition-transform">
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="space-y-0.5">
                <h5 className="text-xs font-semibold text-[#F8FAFC]">{act.title}</h5>
                <p className="text-xs text-[#94A3B8]">{act.detail}</p>
                <span className="text-[10px] text-[#38BDF8] font-medium">By {act.user}</span>
              </div>

              <span className="text-[10px] text-[#64748B] whitespace-nowrap shrink-0">{act.time}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
