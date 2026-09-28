import React, { useState, useEffect } from 'react';
import { ReportsSection } from '../components/dashboard/ReportsSection';
import { apiClient } from '../services/apiClient';

export const Reports = () => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await apiClient.get('/reports');
        if (res?.success && Array.isArray(res?.reports)) {
          const formatted = res.reports.map(r => ({
            id: r.id,
            name: r.title || `${r.report_type} Report`,
            format: 'PDF',
            size: '2.4 MB',
            generatedBy: 'System Engine',
            date: r.created_at ? r.created_at.substring(0, 10) : 'Recent'
          }));
          setReports(formatted);
        }
      } catch (e) {
        console.error('Error fetching reports:', e);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Engineering Reports & Audit Exports</h2>
        <p className="text-xs text-[#94A3B8] mt-1">Generate executive PDF summaries and raw CSV datasets for compliance</p>
      </div>

      <ReportsSection reports={reports} />
    </div>
  );
};
