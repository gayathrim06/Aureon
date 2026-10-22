import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { logAuditEvent } from '../../services/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import { Bug, Plus, Upload, CheckCircle2, AlertOctagon, FileText, Paperclip, Check, RefreshCw } from 'lucide-react';

export const BugTracker = ({ onShowToast }) => {
  const { user } = useAuth();
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    severity: 'HIGH',
    status: 'OPEN',
    assigned_developer_id: '',
    description: '',
    stepsToReproduce: ''
  });

  const fetchBugsData = async () => {
    try {
      setLoading(true);
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      const [bugRes, projRes, userRes] = await Promise.all([
        fetch(`${API_BASE_URL}/bugs/`, { headers }),
        fetch(`${API_BASE_URL}/projects/`, { headers }),
        fetch(`${API_BASE_URL}/users/`, { headers })
      ]);

      if (bugRes.ok) {
        const bData = await bugRes.json();
        if (bData.bugs) {
          const formatted = bData.bugs.map(b => ({
            id: b.bug_id || `BUG-${b.id.substring(0, 6)}`,
            rawId: b.id,
            title: b.title,
            severity: b.severity || 'HIGH',
            status: b.status || 'OPEN',
            assignee: b.assigned_developer || 'Unassigned',
            reporter: b.reporter || 'QA Engineer',
            createdAt: b.created_at ? new Date(b.created_at).toLocaleString() : 'Recent',
            evidence: b.evidence_file ? [{ name: b.evidence_file, size: '240 KB' }] : []
          }));
          setBugs(formatted);
        }
      }

      if (projRes.ok) {
        const pData = await projRes.json();
        if (pData.projects) setProjects(pData.projects);
      }

      if (userRes.ok) {
        const uData = await userRes.json();
        if (uData.users) {
          const devs = uData.users.filter(u => u.role_name === 'ROLE_DEV' || u.role === 'ROLE_DEV');
          setDevelopers(devs);
        }
      }
    } catch (err) {
      console.error('Failed to load bugs from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugsData();
  }, []);

  const handleCreateBug = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const payload = {
        title: formData.title.trim(),
        project_id: formData.projectId || (projects[0]?.id || null),
        severity: formData.severity,
        assigned_developer_id: formData.assigned_developer_id || null,
        description: formData.description,
        steps_to_reproduce: formData.stepsToReproduce,
        evidence_file: evidenceFileName
      };

      const res = await fetch(`${API_BASE_URL}/bugs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchBugsData();
        onShowToast && onShowToast({ type: 'success', title: 'Defect Logged', message: 'Bug successfully registered in PostgreSQL database.' });
      }
    } catch (err) {
      console.error('Failed to report bug:', err);
    }

    logAuditEvent({
      user,
      role: user?.role,
      action: 'BUG_REPORT_CREATE',
      resource: `Bug filed: ${formData.title.trim()}`,
      status: 'SUCCESS'
    });

    setIsModalOpen(false);
    setEvidenceFileName('');
    setFormData({
      title: '',
      projectId: '',
      severity: 'HIGH',
      status: 'OPEN',
      assigned_developer_id: '',
      description: '',
      stepsToReproduce: ''
    });
  };

  const handleStatusChange = async (bugRow, newStatus) => {
    setBugs(prev => prev.map(b => b.id === bugRow.id ? { ...b, status: newStatus } : b));
    try {
      await fetch(`${API_BASE_URL}/bugs/${bugRow.rawId || bugRow.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Failed to update bug status:', err);
    }

    logAuditEvent({
      user,
      role: user?.role,
      action: 'BUG_STATUS_UPDATE',
      resource: `Bug ${bugRow.id} marked as ${newStatus}`,
      status: 'SUCCESS'
    });
    onShowToast && onShowToast({ type: 'info', title: 'Bug Updated', message: `${bugRow.id} status changed to ${newStatus}` });
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
        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[val] || colors.MEDIUM}`}>{val}</span>;
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
              onClick={() => handleStatusChange(row, 'VERIFIED')}
              className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-semibold hover:bg-emerald-700"
            >
              Verify Fix
            </button>
          )}
          {row.status === 'VERIFIED' && (
            <button
              onClick={() => handleStatusChange(row, 'CLOSED')}
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
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Bug Tracker" />
        <button
          onClick={fetchBugsData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Bugs
        </button>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-500" /> Enterprise Bug Tracker & Evidence Repository
          </h1>
          <p className="text-xs text-gray-500">Live PostgreSQL defects ledger: log software defects, attach reproduction logs/screenshots, assign developers, and verify fixes.</p>
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
            <label className="block font-semibold mb-1">Bug Summary Title *</label>
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
              <label className="block font-semibold mb-1">Target Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
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
          </div>

          <div>
            <label className="block font-semibold mb-1">Assign Developer</label>
            <select
              value={formData.assigned_developer_id}
              onChange={(e) => setFormData({ ...formData, assigned_developer_id: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
            >
              <option value="">Unassigned</option>
              {developers.map(d => (
                <option key={d.id} value={d.id}>{d.display_name || d.full_name || d.username} ({d.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Detailed Description & Steps to Reproduce</label>
            <textarea
              rows={3}
              value={formData.stepsToReproduce}
              onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              placeholder="1. Send concurrent requests..."
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
                onClick={() => setEvidenceFileName('stacktrace_dump.log')}
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

