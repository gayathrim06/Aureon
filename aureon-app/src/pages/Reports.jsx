import React from 'react';
import { ReportsSection } from '../components/dashboard/ReportsSection';
import { mockReportsList } from '../mock/mockData';

export const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Engineering Reports & Audit Exports</h2>
        <p className="text-xs text-[#94A3B8] mt-1">Generate executive PDF summaries and raw CSV datasets for compliance</p>
      </div>

      <ReportsSection reports={mockReportsList} />
    </div>
  );
};
