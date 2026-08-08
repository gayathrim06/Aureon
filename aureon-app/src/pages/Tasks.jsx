import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { mockRecentTasks, mockTaskCounts } from '../mock/mockData';
import { CheckSquare, Plus, Filter, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Tasks = () => {
  const { showToast } = useAuth();
  const [filter, setFilter] = useState('All');

  const filtered = mockRecentTasks.filter(t => filter === 'All' || t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Sprint Tasks & Deliverables</h2>
          <p className="text-xs text-[#94A3B8] mt-1">Track story status, assignee workload, and critical blockers</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => showToast('New Task modal opened', 'info')}>
          Create Task
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle icon={CheckSquare}>Task Board Matrix</CardTitle>
          <div className="flex gap-2">
            {['All', 'In Progress', 'Pending', 'Completed', 'Overdue'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 text-xs rounded-[8px] font-semibold ${filter === tab ? 'bg-[#2563EB] text-white' : 'bg-[#111827] text-[#94A3B8]'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardHeader>

        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="p-4 bg-[#111827] border border-[#334155] rounded-[12px] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#38BDF8]">{t.id}</span>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">{t.title}</h4>
                </div>
                <p className="text-xs text-[#94A3B8] mt-1">{t.project} • Assignee: {t.assignee}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={t.priority === 'Urgent' ? 'error' : 'warning'} size="sm">{t.priority}</Badge>
                <Badge variant={t.status === 'Completed' ? 'success' : 'brand'} size="sm">{t.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
