import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { 
  Users2, UserCheck, FolderKanban, Activity, Plus, RefreshCw, 
  ArrowRight, ShieldCheck, CheckCircle2, Clock, ExternalLink, X, Code2, AlertTriangle
} from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';

export const TeamsView = ({ onNavigate, onShowToast }) => {
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [capacitySortOrder, setCapacitySortOrder] = useState('none'); // 'none', 'asc', 'desc'

  // New Team Form State
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formLeadId, setFormLeadId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchLiveTeams = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [tRes, uRes, pRes] = await Promise.all([
        fetch(`${API_BASE_URL}/teams/`, { headers }),
        fetch(`${API_BASE_URL}/users/`, { headers }),
        fetch(`${API_BASE_URL}/projects/`, { headers })
      ]);

      if (tRes.ok) {
        const data = await tRes.json();
        const liveTeams = data.teams || [];
        const formatted = liveTeams.map(t => ({
          id: t.id,
          name: t.name || t.team_name || 'Engineering Squad',
          lead: t.lead || t.leader_name || 'Unassigned Lead',
          lead_id: t.team_leader_id || t.lead_id,
          members: Array.isArray(t.members) ? t.members : [],
          member_details: Array.isArray(t.member_details) ? t.member_details : [],
          department: t.department || t.description || 'Engineering',
          project_id: t.project_id,
          project_name: t.project_name || 'Project Assigned',
          projectCount: t.projectCount !== undefined ? t.projectCount : (t.project_id ? 1 : 0),
          capacity: t.capacity !== undefined && t.capacity !== null ? (typeof t.capacity === 'number' ? `${t.capacity}%` : String(t.capacity)) : (Array.isArray(t.members) && t.members.length > 0 ? `${t.members.length * 40}h/wk` : 'N/A'),
          capacityPct: t.capacity !== undefined && t.capacity !== null ? (parseInt(t.capacity) || 0) : 0,
          utilization: t.utilization !== undefined && t.utilization !== null ? (typeof t.utilization === 'number' ? `${t.utilization}%` : String(t.utilization)) : '0%',
          activeTasks: t.active_tasks_count || 0
        }));
        setTeams(formatted);
      }

      if (uRes.ok) {
        const uData = await uRes.json();
        setAllUsers(uData.users || []);
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        setAllProjects(pData.projects || []);
      }
    } catch (err) {
      console.warn('Failed to fetch teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTeams();
  }, []);

  const handleNav = (tab) => {
    if (typeof onNavigate === 'function') {
      onNavigate(tab);
    }
  };

  const toggleCapacitySort = () => {
    setCapacitySortOrder(prev => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      onShowToast && onShowToast({ type: 'error', title: 'Validation Error', message: 'Team Name is required.' });
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/teams/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDept.trim() || 'Software Engineering Squad',
          team_leader_id: formLeadId || null,
          project_id: formProjectId || null
        })
      });

      if (res.ok) {
        onShowToast && onShowToast({ type: 'success', title: 'Squad Created', message: `${formName} added to system teams.` });
        setIsCreateModalOpen(false);
        setFormName('');
        setFormDept('');
        setFormLeadId('');
        setFormProjectId('');
        fetchLiveTeams();
      } else {
        const err = await res.json();
        onShowToast && onShowToast({ type: 'error', title: 'Creation Failed', message: err.message || 'Could not create team.' });
      }
    } catch (err) {
      onShowToast && onShowToast({ type: 'error', title: 'Network Error', message: 'Failed to communicate with API.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const sortedTeams = React.useMemo(() => {
    if (capacitySortOrder === 'asc') {
      return [...teams].sort((a, b) => a.capacityPct - b.capacityPct);
    }
    if (capacitySortOrder === 'desc') {
      return [...teams].sort((a, b) => b.capacityPct - a.capacityPct);
    }
    return teams;
  }, [teams, capacitySortOrder]);

  const totalMembersCount = teams.reduce((acc, t) => acc + (t.members ? t.members.length : 0), 0);
  const activeProjectsCount = teams.reduce((acc, t) => acc + (t.projectCount || 0), 0);
  const avgCapacityVal = teams.length > 0 
    ? Math.round(teams.reduce((acc, t) => acc + t.capacityPct, 0) / teams.length) 
    : 100;

  const statCards = [
    {
      id: 'teams',
      label: 'Total Teams',
      value: teams.length,
      sub: `${teams.length} Active Squads`,
      hint: 'Click to reset filter',
      icon: Users2,
      color: 'border-l-blue-500 hover:border-l-blue-600',
      action: () => setCapacitySortOrder('none')
    },
    {
      id: 'members',
      label: 'Total Members',
      value: totalMembersCount,
      sub: 'Allocated Engineers',
      hint: 'Open User Directory →',
      icon: UserCheck,
      color: 'border-l-emerald-500 hover:border-l-emerald-600',
      action: () => handleNav('Users')
    },
    {
      id: 'projects',
      label: 'Active Projects',
      value: activeProjectsCount,
      sub: 'Mapped to Squads',
      hint: 'Open Projects Hub →',
      icon: FolderKanban,
      color: 'border-l-indigo-500 hover:border-l-indigo-600',
      action: () => handleNav('Projects')
    },
    {
      id: 'capacity',
      label: 'Avg Bandwidth',
      value: `${avgCapacityVal}%`,
      sub: capacitySortOrder !== 'none' ? `Sorted (${capacitySortOrder.toUpperCase()})` : 'Workload Balanced',
      hint: 'Click to toggle sort →',
      icon: Activity,
      color: 'border-l-amber-500 hover:border-l-amber-600',
      action: toggleCapacitySort
    }
  ];

  const columns = [
    { 
      key: 'name', 
      label: 'Team Name', 
      render: (val, row) => (
        <button
          type="button"
          onClick={() => setSelectedTeam(row)}
          className="text-left group cursor-pointer"
        >
          <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
            {val}
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {row.project_name ? `📁 ${row.project_name}` : 'No Project Assigned'}
          </div>
        </button>
      ) 
    },
    { 
      key: 'lead', 
      label: 'Team Lead', 
      render: (val, row) => (
        <button
          type="button"
          onClick={() => setSelectedTeam(row)}
          className="text-blue-600 dark:text-blue-400 font-semibold text-xs text-left cursor-pointer hover:underline flex items-center gap-1"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          {val}
        </button>
      ) 
    },
    { 
      key: 'members', 
      label: 'Members', 
      render: (val, row) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {Array.isArray(val) && val.length > 0 ? (
            val.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedTeam(row)}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                👤 {m}
              </button>
            ))
          ) : (
            <span className="text-[10px] text-slate-400">No members</span>
          )}
        </div>
      )
    },
    { 
      key: 'department', 
      label: 'Department & Purpose',
      render: (val) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate block" title={val}>
          {val}
        </span>
      )
    },
    { 
      key: 'projectCount', 
      label: 'Projects', 
      render: (val, row) => (
        <button
          type="button"
          onClick={() => handleNav('Projects')}
          className="font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline text-xs flex items-center gap-1"
          title="Open Projects Directory"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          {val} Project
        </button>
      ) 
    },
    { 
      key: 'capacity', 
      label: 'Bandwidth Available', 
      render: (val, row) => {
        const pct = row.capacityPct;
        const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
        return (
          <div 
            onClick={() => setSelectedTeam(row)}
            className="w-28 cursor-pointer group"
            title="Click to view squad workload breakdown"
          >
            <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-700 dark:text-slate-300">
              <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{val} Free</span>
              <span className="text-slate-400 font-mono text-[9px]">{row.activeTasks} tasks</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Inspect',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setSelectedTeam(row)}
          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
        >
          Squad Details <ArrowRight className="w-3 h-3" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Teams Configuration" />
      
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Teams Configuration & Squad Allocation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage engineering squads, member assignments, real-time workload capacity, and cross-project deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLiveTeams}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Refresh Teams"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Squad
          </button>
        </div>
      </div>

      {/* Top 4 Interactive KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={card.action}
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 ${card.color} border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 text-left cursor-pointer group flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{card.label}</span>
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 warm:text-[#342314] mt-2">
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1 font-medium">
                  {card.sub}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                <span>{card.hint}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Teams Data Table */}
      <DataTable 
        columns={columns} 
        data={sortedTeams} 
        searchPlaceholder="Search teams by name, lead, department, project..." 
      />

      {/* Interactive Team Details Modal */}
      {selectedTeam && (
        <Modal
          isOpen={Boolean(selectedTeam)}
          onClose={() => setSelectedTeam(null)}
          title={`Squad: ${selectedTeam.name}`}
        >
          <div className="space-y-4 text-xs font-sans">
            {/* Header Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {selectedTeam.name}
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {selectedTeam.department}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                  Bandwidth: {selectedTeam.capacity} Free
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                  {selectedTeam.activeTasks} Active Tasks
                </span>
              </div>
            </div>

            {/* Team Lead Card */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                Technical Team Lead
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    {selectedTeam.lead.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{selectedTeam.lead}</div>
                    <div className="text-[10px] text-slate-500">Architecture & Technical Oversight</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                  LEAD
                </span>
              </div>
            </div>

            {/* Associated Project */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Assigned Project
                </span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                  📁 {selectedTeam.project_name || 'No Project Assigned'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedTeam(null); handleNav('Projects'); }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
              >
                Open Project <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Member Roster with Real Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Squad Engineers ({selectedTeam.member_details?.length || selectedTeam.members?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={() => { setSelectedTeam(null); handleNav('Users'); }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Manage Users in Admin →
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedTeam.member_details && selectedTeam.member_details.length > 0 ? (
                  selectedTeam.member_details.map((m, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                          {(m.name || m.full_name || 'U').charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {m.full_name || m.name || m.email}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {m.designation || m.role || 'Software Engineer'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          m.is_available 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {m.is_available ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                          {m.is_available ? 'Available' : `Busy (${m.active_tasks_count || 1} active)`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    No individual member details available for this team.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTeam(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create New Team Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Engineering Squad"
        >
          <form onSubmit={handleCreateTeamSubmit} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Squad Name *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Cloud Security Guild"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Department / Technical Mission
              </label>
              <input
                type="text"
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                placeholder="e.g. Zero-Trust Access, OAuth2 token architecture"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Assign Technical Lead
              </label>
              <select
                value={formLeadId}
                onChange={(e) => setFormLeadId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">Select Team Lead (Optional)</option>
                {allUsers
                  .filter(u => u.role === 'ROLE_LEAD' || u.role_name === 'ROLE_LEAD' || (u.roles && u.roles.some(r => r.code === 'ROLE_LEAD')) || (u.designation || '').toLowerCase().includes('lead'))
                  .map(lead => (
                    <option key={lead.id} value={lead.id}>
                      👤 {lead.full_name || lead.name || lead.email} ({lead.designation || 'Lead'})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Assign Primary Project
              </label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">Select Associated Project (Optional)</option>
                {allProjects.map(proj => (
                  <option key={proj.id} value={proj.id}>
                    📁 {proj.name || proj.project_name} ({proj.status || 'ACTIVE'})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                {formSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Save Squad
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
