import React, { useState } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { initialBugs } from '../../services/mockData';
import { logAuditEvent } from '../../services/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { Bug, Plus, Upload, CheckCircle2, AlertOctagon, FileText, Paperclip, Check } from 'lucide-react';

export const BugTracker = ({ onShowToast }) => {
  const { user } = useAuth();
  const [bugs, setBugs] = useState(initialBugs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    projectId: 'proj_1',
    severity: 'HIGH',
    status: 'OPEN',
    assignee: 'Marcus Brody',
    description: '',
    stepsToReproduce: ''
  });

  const handleCreateBug = (e) => {
    e.preventDefault();
    const newBug = {
      id: `BUG-${Math.floor(400 + Math.random() * 100)}`,
      ...formData,
      reporter: user?.name || 'Elena Rostova',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      evidence: evidenceFileName ? [{ name: evidenceFileName, size: '240 KB' }] : []
    };

    setBugs([newBug, ...bugs]);
    logAuditEvent({
      user,
      role: user?.role,
      action: 'BUG_REPORT_CREATE',
      resource: `Bug ${newBug.id}: ${newBug.title} (Severity: ${newBug.severity})`,
      status: 'SUCCESS'
    });

    onShowToast && onShowToast({ type: 'success', title: 'Defect Logged', message: `${newBug.id} registered in issue tracker.` });
    setIsModalOpen(false);
    setEvidenceFileName('');
  };

  const handleStatusChange = (bugId, newStatus) => {
    setBugs(prev => prev.map(b => b.id === bugId ? { ...b, status: newStatus } : b));
    logAuditEvent({
      user,
      role: user?.role,
      action: 'BUG_STATUS_UPDATE',
      resource: `Bug ${bugId} marked as ${newStatus}`,
      status: 'SUCCESS'
    });
    onShowToast && onShowToast({ type: 'info', title: 'Bug Updated', message: `${bugId} status changed to ${newStatus}` });
  };

  const columns = [
    {
      key: 'id',
      label: 'Bug ID & Title',
      render: (val, row) => (
        <div>
          <span className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400">{val}</span>
          <div className="font-semibold text-gray-900 dark:text-gray-100">{row.title}</div>
        </div>
      )
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (val) => {
        const colors = {
          CRITICAL: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300',
          HIGH: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-300',
          MEDIUM: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300',
          LOW: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300'
        };
        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[val]}`}>{val}</span>;
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          val === 'VERIFIED' || val === 'CLOSED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
        }`}>
          {val}
        </span>
      )
    },
    { key: 'assignee', label: 'Assigned Dev' },
    {
      key: 'evidence',
      label: 'Evidence Attached',
      render: (val) => (
        val && val.length > 0 ? (
          <span className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold">
            <Paperclip className="w-3 h-3" /> {val[0].name}
          </span>
        ) : <span className="text-gray-400">None</span>
      )
    },
    {
      key: 'actions',
      label: 'QA Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {row.status === 'OPEN' && (
            <button
              onClick={() => handleStatusChange(row.id, 'VERIFIED')}
              className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-semibold hover:bg-emerald-700"
            >
              Verify Fix
            </button>
          )}
          {row.status === 'VERIFIED' && (
            <button
              onClick={() => handleStatusChange(row.id, 'CLOSED')}
              className="px-2 py-1 rounded bg-gray-700 text-white text-[10px] font-semibold hover:bg-gray-800"
            >
              Close Defect
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Bug Tracker" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-500" /> Enterprise Bug Tracker & Evidence Repository
          </h1>
          <p className="text-xs text-gray-500">Log software defects, attach reproduction logs/screenshots, assign developers, and verify fixes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Log Bug Defect
        </button>
      </div>

      <DataTable
        columns={columns}
        data={bugs}
        searchPlaceholder="Search bugs by ID, title, assignee, severity..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Software Bug Defect"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400">Cancel</button>
            <button onClick={handleCreateBug} className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold">File Defect Report</button>
          </>
        }
      >
        <form onSubmit={handleCreateBug} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Bug Summary Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              placeholder="e.g. JWT Refresh token concurrency race condition"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Severity Level</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-bold"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Assign Developer</label>
              <input
                type="text"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Detailed Description & Steps to Reproduce</label>
            <textarea
              rows={3}
              value={formData.stepsToReproduce}
              onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              placeholder="1. Send 50 concurrent requests..."
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Upload Evidence (Log / Screenshot)</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={evidenceFileName}
                onChange={(e) => setEvidenceFileName(e.target.value)}
                placeholder="e.g. race_condition.log or screenshot.png"
                className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-mono"
              />
              <button
                type="button"
                onClick={() => setEvidenceFileName('stacktrace_dump_concurrency.log')}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> Attach Log
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
