import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { CircularProgress } from '../components/common/CircularProgress';
import { Badge } from '../components/common/Badge';
import { Activity, ShieldCheck, Zap, RotateCcw, AlertCircle } from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../services/apiClient';

export const ProjectHealth = () => {
  const [healthScore, setHealthScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
        const res = await fetch(`${API_BASE_URL}/projects/health-summary`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.portfolio_avg_score !== undefined) {
            setHealthScore(data.portfolio_avg_score);
          }
        }
      } catch (err) {
        console.error('Error fetching platform health:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC]">Project Health & Telemetry</h2>
        <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">Multi-factor health calculations derived from PostgreSQL project records</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 flex items-center justify-center p-8">
          {healthScore !== null ? (
            <CircularProgress 
              score={healthScore} 
              size={160} 
              strokeWidth={12} 
              label="Platform Health Score" 
              sublabel={healthScore >= 80 ? 'Grade A (Healthy)' : healthScore >= 60 ? 'Grade B (Warning)' : 'Grade C (At Risk)'} 
            />
          ) : (
            <div className="text-center py-6 text-slate-400">
              <Activity className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <div className="text-sm font-bold">Telemetry Not Initialized</div>
              <p className="text-xs mt-1">No active project health calculation recorded in database</p>
            </div>
          )}
        </Card>

        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Continuous PostgreSQL Quality Gates</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Aureon calculates project health across four deterministic pillars: Sprint Deliverables (30%), GitHub Activity (25%), Static Code Quality (25%), and Engineering Risk (20%). DORA metrics require continuous deployment telemetry to be connected.
          </p>
          <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Connect CI/CD webhooks or a Git repository to start streaming DORA telemetry.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
