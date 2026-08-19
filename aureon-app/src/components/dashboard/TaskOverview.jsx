import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../common/Card';
import { Badge } from '../common/Badge';
import { CheckSquare, Clock, AlertTriangle, PlayCircle, CheckCircle2 } from 'lucide-react';

export const TaskOverview = ({ taskCounts, recentTasks }) => {
  const [filter, setFilter] = useState('All');

  const filterTasks = recentTasks.filter(t => {
    if (filter === 'All') return true;
    if (filter === 'Completed') return t.status === 'Completed';
    if (filter === 'In Progress') return t.status === 'In Progress';
    if (filter === 'Pending') return t.status === 'Pending';
    if (filter === 'Overdue') return t.status === 'Overdue';
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle icon={CheckSquare}>Sprint Deliverables & Tasks</CardTitle>
          <CardDescription>Real-time progress across active engineering stories</CardDescription>
        </div>
        <div className="flex items-center gap-1.5 bg-[#111827] p-1 rounded-[10px] border border-[#334155]">
          {['All', 'In Progress', 'Pending', 'Overdue', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`
                px-2.5 py-1 text-xs font-semibold rounded-[8px] transition-colors
                ${filter === tab ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'}
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </CardHeader>

      {/* Task Summary Stat Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-[#111827] border border-[#334155] rounded-[12px] flex items-center gap-3">
          <div className="p-2 bg-[#10B981]/15 text-[#10B981] rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#94A3B8]">Completed</span>
            <p className="text-lg font-bold text-[#F8FAFC]">{taskCounts.completed}</p>
          </div>
        </div>

        <div className="p-3 bg-[#111827] border border-[#334155] rounded-[12px] flex items-center gap-3">
          <div className="p-2 bg-[#2563EB]/15 text-[#2563EB] rounded-lg">
            <PlayCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#94A3B8]">In Progress</span>
            <p className="text-lg font-bold text-[#F8FAFC]">{taskCounts.inProgress}</p>
          </div>
        </div>

        <div className="p-3 bg-[#111827] border border-[#334155] rounded-[12px] flex items-center gap-3">
          <div className="p-2 bg-[#F59E0B]/15 text-[#F59E0B] rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#94A3B8]">Pending</span>
            <p className="text-lg font-bold text-[#F8FAFC]">{taskCounts.pending}</p>
          </div>
        </div>

        <div className="p-3 bg-[#111827] border border-[#334155] rounded-[12px] flex items-center gap-3">
          <div className="p-2 bg-[#EF4444]/15 text-[#EF4444] rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#94A3B8]">Overdue</span>
            <p className="text-lg font-bold text-[#F8FAFC]">{taskCounts.overdue}</p>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filterTasks.map((t) => (
          <div
            key={t.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#111827]/70 border border-[#334155]/60 rounded-[12px] hover:border-[#2563EB]/40 transition-colors gap-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#38BDF8] font-semibold">{t.id}</span>
              <div>
                <h5 className="text-xs font-semibold text-[#F8FAFC]">{t.title}</h5>
                <span className="text-[11px] text-[#94A3B8]">{t.project} • Assignee: {t.assignee}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Badge variant={t.priority === 'Urgent' ? 'error' : t.priority === 'High' ? 'warning' : 'neutral'} size="sm">
                {t.priority}
              </Badge>
              <Badge variant={t.status === 'Completed' ? 'success' : t.status === 'In Progress' ? 'brand' : t.status === 'Overdue' ? 'error' : 'neutral'} size="sm">
                {t.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
