import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../common/Card';
import { CircularProgress } from '../common/CircularProgress';
import { Badge } from '../common/Badge';
import { Activity, ShieldCheck, Cpu, GitCommit } from 'lucide-react';

export const ProjectHealthCard = ({ healthScore = 94 }) => {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div>
          <CardTitle icon={Activity}>Project Health Index</CardTitle>
          <CardDescription>Real-time engineering compliance & build stability</CardDescription>
        </div>
        <Badge variant="success" dot>Optimal</Badge>
      </CardHeader>

      <div className="py-4 flex flex-col sm:flex-row items-center justify-around gap-6">
        <CircularProgress
          score={healthScore}
          size={130}
          strokeWidth={10}
          label="Overall Platform Health"
          sublabel="Grade A+"
          color="#2563EB"
        />

        <div className="w-full sm:w-auto space-y-3">
          <div className="flex items-center justify-between gap-6 p-2.5 bg-[#111827] rounded-[12px] border border-[#334155]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span className="text-xs font-semibold text-[#CBD5E1]">Build Stability</span>
            </div>
            <span className="text-xs font-bold text-[#10B981]">99.8%</span>
          </div>

          <div className="flex items-center justify-between gap-6 p-2.5 bg-[#111827] rounded-[12px] border border-[#334155]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#38BDF8]" />
              <span className="text-xs font-semibold text-[#CBD5E1]">CI/CD Webhooks</span>
            </div>
            <span className="text-xs font-bold text-[#38BDF8]">19 Active</span>
          </div>

          <div className="flex items-center justify-between gap-6 p-2.5 bg-[#111827] rounded-[12px] border border-[#334155]">
            <div className="flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-xs font-semibold text-[#CBD5E1]">Open Flaws</span>
            </div>
            <span className="text-xs font-bold text-[#F59E0B]">0 Critical</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
