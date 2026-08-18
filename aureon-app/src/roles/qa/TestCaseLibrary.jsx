import React, { useState } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { initialTestCases } from '../../services/mockData';
import { logAuditEvent } from '../../services/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { ClipboardCheck, Plus, CheckCircle2, XCircle, Clock, Play } from 'lucide-react';

export const TestCaseLibrary = ({ onShowToast }) => {
  const { user } = useAuth();
  const [testCases, setTestCases] = useState(initialTestCases);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', type: 'FUNCTIONAL', automated: false });

  const handleCreate = (e) => { e.preventDefault(); const tc = { id: `TC-${800+testCases.length+1}`, ...formData, projectId: 'proj_1', status: 'PENDING', lastRun: 'Never', executedBy: user?.name || 'Elena Rostova' }; setTestCases([tc,...testCases]); logAuditEvent({ user, role: user?.role, action: 'TESTCASE_CREATE', resource: `Test Case ${tc.id}: ${tc.title}`, status: 'SUCCESS' }); onShowToast && onShowToast({ type: 'success', title: 'Test Case Created', message: `${tc.id} added to library.` }); setIsModalOpen(false); };

  const runTest = (tc) => {
    const result = Math.random() > 0.3 ? 'PASSED' : 'FAILED';
    setTestCases(prev => prev.map(t => t.id === tc.id ? { ...t, status: result, lastRun: new Date().toISOString().replace('T',' ').substring(0,16) } : t));
    onShowToast && onShowToast({ type: result === 'PASSED' ? 'success' : 'error', title: `Test ${result}`, message: `${tc.id}: ${tc.title}` });
  };

  const statusColors = { PASSED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' };
  const statusIcons = { PASSED: <CheckCircle2 className="w-3 h-3" />, FAILED: <XCircle className="w-3 h-3" />, PENDING: <Clock className="w-3 h-3" /> };

  const columns = [
    { key: 'id', label: 'ID', render: (val) => <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">{val}</span> },
    { key: 'title', label: 'Test Case Description', render: (val) => <span className="font-semibold text-gray-900 dark:text-gray-100 text-[11px]">{val}</span> },
    { key: 'type', label: 'Type', render: (val) => <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-bold">{val}</span> },
    { key: 'status', label: 'Status', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${statusColors[val]}`}>{statusIcons[val]}{val}</span> },
    { key: 'automated', label: 'Mode', render: (val) => <span className="text-[10px]">{val ? '🤖 Auto' : '👤 Manual'}</span> },
    { key: 'lastRun', label: 'Last Run' },
    { key: 'actions', label: 'Run', sortable: false, render: (_, row) => row.status !== 'PASSED' ? <button onClick={() => runTest(row)} className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700 flex items-center gap-1"><Play className="w-3 h-3" />Execute</button> : <span className="text-emerald-500 text-[10px]">✓ Done</span> }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Test Case Library" />
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-emerald-500" />Test Case Library</h1><p className="text-xs text-gray-500">CRUD test cases, execute individual tests, and track pass/fail results.</p></div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-colors"><Plus className="w-4 h-4" />New Test Case</button>
      </div>
      <DataTable columns={columns} data={testCases} searchPlaceholder="Search test cases by ID, title, type..." />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Test Case" footer={<><button onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs text-gray-600">Cancel</button><button onClick={handleCreate} className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold">Create</button></>}>
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div><label className="block font-semibold mb-1">Test Case Description</label><input type="text" required value={formData.title} onChange={(e)=>setFormData({...formData,title:e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" placeholder="Verify endpoint returns 403 for unauthorized role" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-semibold mb-1">Type</label><select value={formData.type} onChange={(e)=>setFormData({...formData,type:e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"><option>FUNCTIONAL</option><option>SECURITY</option><option>UI</option><option>INTEGRATION</option></select></div>
            <div><label className="block font-semibold mb-1">Automated?</label><select value={formData.automated} onChange={(e)=>setFormData({...formData,automated:e.target.value==='true'})} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"><option value="false">Manual</option><option value="true">Automated</option></select></div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
