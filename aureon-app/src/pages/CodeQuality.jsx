import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { mockCodeQuality } from '../mock/mockData';
import { ShieldCheck, Cpu, Bug, AlertCircle, CheckCircle, FileCode } from 'lucide-react';

export const CodeQuality = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Code Quality & Telemetry</h2>
        <p className="text-xs text-[#94A3B8] mt-1">SonarQube static analysis compliance, cyclomatic complexity, and test coverage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle icon={ShieldCheck}>Maintainability Index</CardTitle>
            <Badge variant="success">Grade A</Badge>
          </CardHeader>
          <div className="text-4xl font-extrabold text-[#F8FAFC]">{mockCodeQuality.maintainabilityIndex.score}/100</div>
          <p className="text-xs text-[#10B981] mt-2 font-semibold">94.8% Unit Test Coverage across 45,000 LOC</p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle icon={Cpu}>Cyclomatic Complexity</CardTitle>
            <Badge variant="info">Optimal</Badge>
          </CardHeader>
          <div className="text-4xl font-extrabold text-[#F8FAFC]">{mockCodeQuality.cyclomaticComplexity.score}</div>
          <p className="text-xs text-[#38BDF8] mt-2 font-semibold">Average per module is well under risk limit (15)</p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle icon={Bug}>Code Smells & Vulnerabilities</CardTitle>
            <Badge variant="success">0 Flaws</Badge>
          </CardHeader>
          <div className="text-4xl font-extrabold text-[#10B981]">{mockCodeQuality.codeSmells.count}</div>
          <p className="text-xs text-[#94A3B8] mt-2">Minor architectural style warnings only</p>
        </Card>
      </div>
    </div>
  );
};
