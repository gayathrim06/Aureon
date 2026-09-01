import React from 'react';
import {
  FolderKanban,
  CheckCircle2,
  ListTodo,
  GitBranch,
  Users,
  Activity,
  ShieldCheck,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card } from '../common/Card';

export const MetricCards = ({ metrics }) => {
  const iconMap = {
    FolderKanban: FolderKanban,
    CheckCircle2: CheckCircle2,
    ListTodo: ListTodo,
    GitBranch: GitBranch,
    Users: Users,
    Activity: Activity,
    ShieldCheck: ShieldCheck,
    FileText: FileText,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((item, index) => {
        const IconComponent = iconMap[item.iconName] || FolderKanban;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card hoverEffect className="relative overflow-hidden group border-[#334155]">
              {/* Subtle accent glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#2563EB]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    {item.title}
                  </span>
                  <div className="text-2xl lg:text-3xl font-extrabold text-[#F8FAFC] tracking-tight mt-1">
                    {item.value}
                  </div>
                </div>

                <div className="p-3 bg-[#111827] text-[#2563EB] rounded-[12px] border border-[#334155] group-hover:scale-105 transition-transform">
                  <IconComponent className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#334155]/50">
                <div className="flex items-center gap-1 text-xs font-semibold">
                  {item.isPositive ? (
                    <span className="text-[#10B981] flex items-center gap-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      {item.trend}
                    </span>
                  ) : (
                    <span className="text-[#EF4444] flex items-center gap-0.5">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      {item.trend}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#64748B] truncate">{item.description}</span>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
