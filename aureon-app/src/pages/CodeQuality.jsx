import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { apiClient } from '../services/apiClient';
import { ShieldCheck, Cpu, Bug, AlertCircle, CheckCircle, FileCode, RefreshCw } from 'lucide-react';

export const CodeQuality = () => {
  const [qualitySummary, setQualitySummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuality = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analysis/quality-summary');
      if (res?.success && Array.isArray(res?.data)) {
        setQualitySummary(res.data);
      }
    } catch (e) {
      console.error('Error fetching quality summary:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuality();
  }, []);

  const totalBugs = qualitySummary.reduce((acc, q) => acc + (q.bugs || 0), 0);
  const totalSmells = qualitySummary.reduce((acc, q) => acc + (q.code_smells || 0), 0);
  const avgCoverage = qualitySummary.length > 0 
    ? Math.round(qualitySummary.reduce((acc, q) => acc + (parseFloat(q.coverage) || 0), 0) / qualitySummary.length)
    : 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Code Quality & Telemetry</h2>
          <p className="text-xs text-[#94A3B8] mt-1">Live SonarQube static analysis compliance from PostgreSQL database</p>
        </div>
        <button
          onClick={fetchQuality}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle icon={ShieldCheck}>Maintainability Index</CardTitle>
            <Badge variant="success">Grade A</Badge>
          </CardHeader>
          <div className="text-4xl font-extrabold text-[#F8FAFC]">{avgCoverage}%</div>
          <p className="text-xs text-[#10B981] mt-2 font-semibold">Average Test Coverage across PostgreSQL repositories</p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle icon={Cpu}>Analyzed Projects</CardTitle>
            <Badge variant="info">Active</Badge>
          </CardHeader>
          <div className="text-4xl font-extrabold text-[#F8FAFC]">{qualitySummary.length}</div>
          <p className="text-xs text-[#38BDF8] mt-2 font-semibold">Tracked project repositories</p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle icon={Bug}>Code Smells & Vulnerabilities</CardTitle>
            <Badge variant={totalSmells === 0 ? "success" : "warning"}>{totalSmells} Smells</Badge>
          </CardHeader>
          <div className="text-4xl font-extrabold text-[#10B981]">{totalSmells}</div>
          <p className="text-xs text-[#94A3B8] mt-2">{totalBugs} static analysis bugs reported</p>
        </Card>
      </div>
    </div>
  );
};
