import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../common/Card';
import { CircularProgress } from '../common/CircularProgress';
import { Badge } from '../common/Badge';
import { Activity, ShieldCheck, Cpu, GitCommit } from 'lucide-react';

export const ProjectHealthCard = ({ healthScore = null, buildStability = null, webhooksCount = 0, openFlaws = 0 }) => {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div>
          <CardTitle icon={Activity}>Project Health Index</CardTitle>
          <CardDescription>Real-time engineering compliance & build stability</CardDescription>
        </div>
        <Badge variant={healthScore && healthScore >= 80 ? 'success' : 'warning'} dot>
          {healthScore && healthScore >= 80 ? 'Optimal' : (healthScore ? 'Review' : 'No Data')}
        </Badge>
      </CardHeader>

      <div className="py-4 flex flex-col sm:flex-row items-center justify-around gap-6">
        {healthScore !== null ? (
          <CircularProgress
            score={healthScore}
            size={130}
            strokeWidth={10}
            label="Platform Health"
            sublabel={healthScore >= 80 ? 'Grade A' : 'Grade B'}
            color="#2563EB"
          />
        ) : (
          <div className="text-center py-4 text-xs text-slate-400">
            No health score calculated
          </div>
        )}

        <div className="w-full sm:w-auto space-y-3">
          <div className="flex items-center justify-between gap-6 p-2.5 bg-slate-900 rounded-[12px] border border-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">Build Stability</span>
            </div>
            <span className="text-xs font-bold text-emerald-400">
              {buildStability !== null ? `${buildStability}%` : 'N/A'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-6 p-2.5 bg-slate-900 rounded-[12px] border border-slate-700">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-semibold text-slate-300">CI/CD Webhooks</span>
            </div>
            <span className="text-xs font-bold text-sky-400">
              {webhooksCount > 0 ? `${webhooksCount} Active` : '0 Active'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-6 p-2.5 bg-slate-900 rounded-[12px] border border-slate-700">
            <div className="flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">Open Flaws</span>
            </div>
            <span className="text-xs font-bold text-amber-400">
              {openFlaws} Critical
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
