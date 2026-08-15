import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { CircularProgress } from '../components/common/CircularProgress';
import { Badge } from '../components/common/Badge';
import { Activity, ShieldCheck, Zap, RotateCcw } from 'lucide-react';

export const ProjectHealth = () => {
  const doraMetrics = [
    { title: 'Deployment Frequency', value: '14.2 / day', status: 'Elite', icon: Zap, color: 'text-[#10B981]' },
    { title: 'Lead Time for Changes', value: '45 mins', status: 'Elite', icon: ShieldCheck, color: 'text-[#2563EB]' },
    { title: 'Mean Time to Restore (MTTR)', value: '12 mins', status: 'High', icon: RotateCcw, color: 'text-[#38BDF8]' },
    { title: 'Change Failure Rate', value: '0.4%', status: 'Low Risk', icon: Activity, color: 'text-[#10B981]' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Project Health & DORA Telemetry</h2>
        <p className="text-xs text-[#94A3B8] mt-1">DevOps Research & Assessment (DORA) high-velocity metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 flex items-center justify-center p-8">
          <CircularProgress score={94} size={160} strokeWidth={12} label="Platform Health Score" sublabel="Grade A+" />
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {doraMetrics.map((d, i) => {
            const Icon = d.icon;
            return (
              <Card key={i} hoverEffect>
                <div className="flex items-center justify-between">
                  <div className={`p-3 bg-[#111827] rounded-[12px] ${d.color} border border-[#334155]`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="success" size="sm">{d.status}</Badge>
                </div>
                <h4 className="text-xs font-semibold text-[#94A3B8] uppercase mt-4">{d.title}</h4>
                <div className="text-2xl font-extrabold text-[#F8FAFC] mt-1">{d.value}</div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
