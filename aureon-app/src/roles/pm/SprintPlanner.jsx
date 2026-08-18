import React, { useState } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { initialSprints } from '../../services/mockData';
import { logAuditEvent } from '../../services/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { Layers, Plus, CheckCircle2, Clock, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SprintPlanner = ({ onShowToast }) => {
  const { user } = useAuth();
  const [sprints, setSprints] = useState(initialSprints);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState(sprints[0]);
  const [formData, setFormData] = useState({ name: '', projectId: 'proj_1', startDate: '', endDate: '', goal: '' });

  const handleCreate = (e) => { e.preventDefault(); const ns = { id: `spr_${Date.now()}`, ...formData, status: 'PLANNING', totalTasks: 0, completedTasks: 0, burnDownData: [] }; setSprints([ns, ...sprints]); logAuditEvent({ user, role: user?.role, action: 'SPRINT_CREATE', resource: `Sprint: ${ns.name}`, status: 'SUCCESS' }); onShowToast && onShowToast({ type: 'success', title: 'Sprint Created', message: `${ns.name} added to backlog.` }); setIsModalOpen(false); };

  const statusColors = { ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', PLANNING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' };

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Sprint Planner" />
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-500" />Sprint Planner & Backlog</h1><p className="text-xs text-gray-500">Plan sprints, set goals, manage backlog, and track burndown velocity.</p></div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-colors"><Plus className="w-4 h-4" />Create Sprint</button>
      </div>

      {selectedSprint && selectedSprint.burnDownData.length > 0 && (
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">{selectedSprint.name} — Burndown Velocity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedSprint.burnDownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Line type="monotone" dataKey="remaining" stroke="#3b82f6" strokeWidth={3} name="Actual Remaining" />
                <Line type="monotone" dataKey="target" stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={2} name="Target Guideline" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sprints.map(sp => (
          <div key={sp.id} onClick={() => setSelectedSprint(sp)} className={`p-5 rounded-xl bg-white dark:bg-gray-800 border shadow-sm cursor-pointer transition-all hover:shadow-md ${selectedSprint?.id === sp.id ? 'border-blue-500 ring-1 ring-blue-200 dark:ring-blue-900' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[sp.status]}`}>{sp.status}</span>
              <span className="text-[10px] text-gray-400">{sp.startDate} → {sp.endDate}</span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{sp.name}</h4>
            <p className="text-[11px] text-gray-500 mt-1">{sp.goal}</p>
            <div className="mt-3 flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" />{sp.completedTasks} Done</span>
              <span className="flex items-center gap-1 text-blue-600"><Clock className="w-3 h-3" />{sp.totalTasks - sp.completedTasks} Remaining</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${sp.totalTasks > 0 ? (sp.completedTasks/sp.totalTasks*100) : 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Sprint" footer={<><button onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs text-gray-600">Cancel</button><button onClick={handleCreate} className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">Create Sprint</button></>}>
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div><label className="block font-semibold mb-1">Sprint Name</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" placeholder="Sprint 25 - Feature Name" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-semibold mb-1">Start Date</label><input type="date" required value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" /></div>
            <div><label className="block font-semibold mb-1">End Date</label><input type="date" required value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" /></div>
          </div>
          <div><label className="block font-semibold mb-1">Sprint Goal</label><textarea rows={2} value={formData.goal} onChange={(e) => setFormData({...formData, goal: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" placeholder="Define sprint scope and deliverables" /></div>
        </form>
      </Modal>
    </div>
  );
};
