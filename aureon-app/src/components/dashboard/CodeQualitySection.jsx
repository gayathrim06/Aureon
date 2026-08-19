import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../common/Card';
import { Badge } from '../common/Badge';
import { ShieldCheck, Cpu, Bug, Layers, CheckCircle } from 'lucide-react';

export const CodeQualitySection = ({ quality }) => {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle icon={ShieldCheck}>Static Code Quality & Analysis</CardTitle>
          <CardDescription>SonarQube compliance, cyclomatic complexity & code smell telemetry</CardDescription>
        </div>
        <Badge variant="success">{quality.staticAnalysisStatus}</Badge>
      </CardHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Maintainability */}
        <div className="p-4 bg-[#111827] border border-[#334155] rounded-[12px] space-y-2">
          <div className="flex justify-between items-center text-xs text-[#94A3B8]">
            <span>Maintainability Index</span>
            <Badge variant="success" size="sm">Grade {quality.maintainabilityIndex.grade}</Badge>
          </div>
          <div className="text-2xl font-extrabold text-[#F8FAFC]">
            {quality.maintainabilityIndex.score}<span className="text-sm font-normal text-[#94A3B8]">/100</span>
          </div>
          <p className="text-[11px] text-[#10B981] font-semibold">{quality.maintainabilityIndex.status}</p>
        </div>

        {/* Cyclomatic Complexity */}
        <div className="p-4 bg-[#111827] border border-[#334155] rounded-[12px] space-y-2">
          <div className="flex justify-between items-center text-xs text-[#94A3B8]">
            <span>Cyclomatic Complexity</span>
            <Cpu className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-extrabold text-[#F8FAFC]">
            {quality.cyclomaticComplexity.score}
          </div>
          <p className="text-[11px] text-[#38BDF8] font-semibold">{quality.cyclomaticComplexity.status}</p>
        </div>

        {/* Code Smells */}
        <div className="p-4 bg-[#111827] border border-[#334155] rounded-[12px] space-y-2">
          <div className="flex justify-between items-center text-xs text-[#94A3B8]">
            <span>Code Smells</span>
            <Bug className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-extrabold text-[#F8FAFC]">
            {quality.codeSmells.count}
          </div>
          <p className="text-[11px] text-[#F59E0B] font-semibold">{quality.codeSmells.severity} impact</p>
        </div>

        {/* Security Vulnerabilities */}
        <div className="p-4 bg-[#111827] border border-[#334155] rounded-[12px] space-y-2">
          <div className="flex justify-between items-center text-xs text-[#94A3B8]">
            <span>Security Flaws</span>
            <CheckCircle className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-extrabold text-[#10B981]">
            {quality.vulnerabilities}
          </div>
          <p className="text-[11px] text-[#10B981] font-semibold">100% Security Compliant</p>
        </div>
      </div>
    </Card>
  );
};
