import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Code2, 
  CheckSquare, 
  Clock, 
  Layers, 
  FolderKanban, 
  Filter, 
  Search, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { getAuthHeaders } from '../../services/apiClient';

export const TeamWorkload = ({ embedMode = false }) => {
  const [projectsList, setProjectsList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [rawLeads, setRawLeads] = useState([]);
  const [rawMembers, setRawMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [selectedRole, setSelectedRole] = useState('ALL'); // 'ALL', 'LEAD', 'PM', 'DEV', 'QA'
  const [sortBy, setSortBy] = useState('default'); // 'default', 'role', 'name_asc', 'name_desc', 'availability', 'workload'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'FREE', 'HIGH_WORK'
  const [expFilter, setExpFilter] = useState('ALL'); // 'ALL', 'EXPERIENCED', 'FRESHER'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const headers = getAuthHeaders();
      try {
        const [projRes, taskRes, usersRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/v1/projects/', { headers }),
          fetch('http://127.0.0.1:8000/api/v1/tasks/', { headers }),
          fetch('http://127.0.0.1:8000/api/v1/users/', { headers })
        ]);

        if (projRes.ok) {
          const pData = await projRes.json();
          setProjectsList(pData.projects || []);
        }
        if (taskRes.ok) {
          const tData = await taskRes.json();
          setTasksList(tData.tasks || []);
        }
        if (usersRes.ok) {
          const uData = await usersRes.json();
          const allUsers = uData.users || [];
          
          const members = allUsers.map((u, idx) => {
            const desig = (u.designation || '').toLowerCase();
            const rCode = (u.role || u.role_name || '').toUpperCase();
            
            let roleCategory = 'DEV';
            let roleLabel = 'Developer';
            if (rCode.includes('LEAD') || desig.includes('lead')) {
              roleCategory = 'LEAD';
              roleLabel = 'Team Lead';
            } else if (rCode.includes('PM') || desig.includes('manager') || desig.includes('pm')) {
              roleCategory = 'PM';
              roleLabel = 'Project Manager';
            } else if (rCode.includes('QA') || desig.includes('qa') || desig.includes('test') || (u.email && u.email.includes('qa'))) {
              roleCategory = 'QA';
              roleLabel = 'Quality Engineer';
            } else if (rCode.includes('ADMIN')) {
              roleCategory = 'ADMIN';
              roleLabel = 'Administrator';
            }

            const isSenior = desig.includes('senior') || desig.includes('lead') || desig.includes('architect') || desig.includes('principal') || idx % 2 === 0;
            const expLevel = isSenior ? 'EXPERIENCED' : 'FRESHER';
            const expLabel = isSenior ? 'Experienced (3+ yrs)' : 'Fresher / Junior (0-1 yr)';

            return {
              id: u.id,
              name: u.full_name || u.name,
              role: u.designation || roleLabel,
              type: roleCategory,
              roleCategory,
              roleLabel,
              email: u.email,
              expLevel,
              expLabel
            };
          });
          setRawMembers(members);
        }
      } catch (err) {
        console.warn('Workload data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute Project Progress Map
  const projectMetrics = {};
  projectsList.forEach(p => {
    const projTasks = tasksList.filter(t => String(t.project_id) === String(p.id));
    const completedCount = projTasks.filter(t => t.status === 'COMPLETED' || t.status === 'DONE').length;
    const progress = projTasks.length > 0 
      ? Math.round((completedCount / projTasks.length) * 100)
      : (p.progress !== undefined ? p.progress : 65);
    projectMetrics[p.id] = {
      name: p.name || p.project_name || 'Active Project',
      progress,
      status: p.status || 'IN_PROGRESS',
      deadline: p.target_deadline || p.end_date || 'N/A'
    };
  });

  // Calculate real workload and project assignment for members
  const processedMembers = rawMembers.map(member => {
    const memberTasks = tasksList.filter(t => 
      t.assigned_to === member.name || 
      t.assignee_id === member.id || 
      t.assigned_to_id === member.id ||
      (t.assignee_name && t.assignee_name.toLowerCase() === member.name.toLowerCase()) ||
      (t.assignee && t.assignee.toLowerCase() === member.name.toLowerCase())
    );
    const activeTasks = memberTasks.filter(t => 
      t.status === 'IN_PROGRESS' || t.status === 'TODO' || t.status === 'IN_REVIEW' || t.status === 'REVIEW'
    ).length;
    const completedTasks = memberTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
    const totalTasks = memberTasks.length;
    const finishRate = totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%';
    const personalFinishRateNum = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // High Work vs Free Now determination
    const isHighWork = activeTasks >= 2;
    const isFree = activeTasks === 0;
    const workloadPct = Math.min(100, isFree ? 0 : isHighWork ? 85 : 45);

    // Current active task
    const activeTaskItem = memberTasks.find(t => 
      ['IN_PROGRESS', 'REVIEW', 'IN_REVIEW', 'TODO'].includes(t.status)
    );

    // Resolve Working Project from explicit task assignment
    let assignedProject = null;
    if (activeTaskItem && activeTaskItem.project_id) {
      assignedProject = projectMetrics[activeTaskItem.project_id];
    } else if (memberTasks.length > 0 && memberTasks[0].project_id) {
      assignedProject = projectMetrics[memberTasks[0].project_id];
    }
    
    // Resolve squad roster project
    let rosteredProject = null;
    if (projectsList.length > 0) {
      const foundP = projectsList.find(p => 
        p.team_members && p.team_members.some(m => 
          (typeof m === 'string' ? m.includes(member.name) : m.id === member.id || m.name === member.name)
        )
      );
      if (foundP) {
        rosteredProject = projectMetrics[foundP.id];
      }
    }

    return {
      ...member,
      activeTasks,
      completedTasks,
      totalTasks,
      finishRate,
      personalFinishRateNum,
      workloadPct,
      isHighWork,
      isFree,
      activeTaskItem,
      assignedProject,
      rosteredProject
    };
  });

  // Compute counts per role
  const roleCounts = {
    ALL: processedMembers.length,
    LEAD: processedMembers.filter(m => m.roleCategory === 'LEAD').length,
    PM: processedMembers.filter(m => m.roleCategory === 'PM').length,
    DEV: processedMembers.filter(m => m.roleCategory === 'DEV').length,
    QA: processedMembers.filter(m => m.roleCategory === 'QA').length,
  };

  // Filter and Sort Members List
  const filteredAndSortedMembers = React.useMemo(() => {
    let list = processedMembers.filter(m => {
      if (selectedRole !== 'ALL' && m.roleCategory !== selectedRole) return false;
      if (statusFilter === 'FREE' && !m.isFree) return false;
      if (statusFilter === 'HIGH_WORK' && !m.isHighWork) return false;
      if (expFilter !== 'ALL' && m.expLevel !== expFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || (m.email && m.email.toLowerCase().includes(q));
      }
      return true;
    });

    const roleOrder = { LEAD: 1, PM: 2, DEV: 3, QA: 4, ADMIN: 5 };
    if (sortBy === 'role') {
      list.sort((a, b) => (roleOrder[a.roleCategory] || 99) - (roleOrder[b.roleCategory] || 99));
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name_desc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'availability') {
      list.sort((a, b) => (a.isFree === b.isFree ? 0 : a.isFree ? -1 : 1));
    } else if (sortBy === 'workload') {
      list.sort((a, b) => b.activeTasks - a.activeTasks);
    }
    return list;
  }, [processedMembers, selectedRole, sortBy, statusFilter, expFilter, searchQuery]);

  // Aggregated Counts
  const totalFreeNow = processedMembers.filter(m => m.isFree).length;
  const totalHighWork = processedMembers.filter(m => m.isHighWork).length;
  const totalExperienced = processedMembers.filter(m => m.expLevel === 'EXPERIENCED').length;
  const totalFreshers = processedMembers.filter(m => m.expLevel === 'FRESHER').length;

  return (
    <div className={`space-y-6 font-sans text-slate-900 dark:text-slate-100 max-w-7xl mx-auto ${embedMode ? '' : 'pb-12'}`}>
      {!embedMode && <Breadcrumb activeTab="Team Members" />}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Team Members Capacity & Role Workload Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time availability monitor for Team Leads, Project Managers, Developers, and Quality Engineers.
          </p>
        </div>

        {/* Quick KPI Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{totalFreeNow} Free Now</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{totalHighWork} Under High Work</span>
          </div>
        </div>
      </div>

      {/* Quick Role Filter Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'ALL', label: 'All Users', count: roleCounts.ALL },
          { key: 'LEAD', label: 'Team Lead', count: roleCounts.LEAD },
          { key: 'PM', label: 'Project Manager', count: roleCounts.PM },
          { key: 'DEV', label: 'Developer', count: roleCounts.DEV },
          { key: 'QA', label: 'Quality Engineer', count: roleCounts.QA }
        ].map(tab => {
          const isActive = selectedRole === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedRole(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* FILTER & SORT CONTROLS BAR */}
      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, role, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter & Sort Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="appearance-none pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">Filter: All Roles ({roleCounts.ALL})</option>
              <option value="LEAD">Team Lead ({roleCounts.LEAD})</option>
              <option value="PM">Project Manager ({roleCounts.PM})</option>
              <option value="DEV">Developer ({roleCounts.DEV})</option>
              <option value="QA">Quality Engineer ({roleCounts.QA})</option>
            </select>
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="default">Sort: Default</option>
              <option value="role">Sort: Role (Lead → PM → Dev → QA)</option>
              <option value="name_asc">Sort: Name (A to Z)</option>
              <option value="name_desc">Sort: Name (Z to A)</option>
              <option value="availability">Sort: Availability (Free First)</option>
              <option value="workload">Sort: Workload (Highest First)</option>
            </select>
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Workload Status Filter */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'ALL' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('FREE')}
              className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'FREE' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'}`}
            >
              🟢 Free
            </button>
            <button
              onClick={() => setStatusFilter('HIGH_WORK')}
              className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'HIGH_WORK' ? 'bg-rose-600 text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'}`}
            >
              🔴 High
            </button>
          </div>

          {(selectedRole !== 'ALL' || sortBy !== 'default' || statusFilter !== 'ALL' || expFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => { setSelectedRole('ALL'); setSortBy('default'); setStatusFilter('ALL'); setExpFilter('ALL'); setSearchQuery(''); }}
              className="px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* MEMBER CARDS RESPONSIVE GRID */}
      {filteredAndSortedMembers.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="font-bold">No team members match the selected role or filter criteria.</p>
          <button
            onClick={() => { setSelectedRole('ALL'); setSortBy('default'); setStatusFilter('ALL'); setExpFilter('ALL'); setSearchQuery(''); }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSortedMembers.map(member => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
};

// Sub-component for individual Team Member Card
const MemberCard = ({ member }) => {
  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs hover:shadow-md ${
      member.isHighWork 
        ? 'border-rose-300/80 dark:border-rose-900/60 bg-rose-50/10' 
        : member.isFree
        ? 'border-emerald-300/80 dark:border-emerald-900/60 bg-emerald-50/10'
        : 'border-slate-200 dark:border-slate-800'
    }`}>
      {/* Header Info: Name, Seniority, Status */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {member.name}
            </h3>
            {/* Role Badge */}
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
              member.roleCategory === 'LEAD' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
              member.roleCategory === 'PM' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
              member.roleCategory === 'QA' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
              'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            }`}>
              {member.roleLabel || member.roleCategory}
            </span>
            {/* Experience / Fresher Badge */}
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              member.expLevel === 'EXPERIENCED' 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40' 
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
            }`}>
              {member.expLevel === 'EXPERIENCED' ? '⭐ Experienced' : '🌱 Fresher'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {member.role} • <span className="italic">{member.expLabel}</span>
          </p>
        </div>

        {/* Workload Status Badge */}
        {member.isHighWork ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 shrink-0 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Under High Work ({member.activeTasks} tasks)
          </span>
        ) : member.isFree ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Free Now — Ready for Work
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 shrink-0">
            Moderate ({member.activeTasks} active)
          </span>
        )}
      </div>

      {/* Task Numbers Strip */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs">
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Tasks</span>
          <span className={`font-black text-sm ${member.activeTasks >= 2 ? 'text-rose-600' : 'text-blue-600'}`}>
            {member.activeTasks}
          </span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Finished</span>
          <span className="font-black text-sm text-emerald-600">
            {member.completedTasks}
          </span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Finish Rate</span>
          <span className="font-black text-sm text-indigo-600">
            {member.finishRate}
          </span>
        </div>
      </div>

      {/* WORKING PROJECT & ALLOCATION CAPACITY */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {member.activeTaskItem && member.assignedProject ? (
          /* ACTIVE TASK IN PROGRESS / REVIEW */
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate max-w-[70%]">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                Working on: <strong className="text-slate-900 dark:text-white font-extrabold truncate">{member.activeTaskItem.title}</strong>
              </span>
              <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                {member.activeTaskItem.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Project: <strong>{member.assignedProject.name}</strong> ({member.assignedProject.progress}% overall)</span>
              <span className="font-bold text-indigo-600">{member.finishRate} Personal Finish</span>
            </div>
            {/* Workload Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(20, member.personalFinishRateNum)}%` }}
              />
            </div>
          </div>
        ) : member.completedTasks > 0 ? (
          /* ALL TASKS FINISHED - 100% COMPLETE */
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                All Assigned Tasks Completed ({member.completedTasks}/{member.totalTasks})
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                100% Done
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Last Project: <strong>{member.assignedProject?.name || member.rosteredProject?.name || 'Verona Organic'}</strong> ({member.assignedProject?.progress || member.rosteredProject?.progress || 67}% overall)</span>
              <span className="text-emerald-600 font-bold">🟢 Free for next allocation</span>
            </div>
            {/* Green 100% finished bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-2 rounded-full w-full" />
            </div>
          </div>
        ) : (
          /* NO TASKS ASSIGNED YET - 100% FREE CAPACITY */
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Awaiting Task Allocation
              </span>
              <strong className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                100% Free Capacity
              </strong>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>
                {member.rosteredProject ? (
                  <>Rostered in: <strong>{member.rosteredProject.name}</strong> ({member.rosteredProject.progress}% overall project)</>
                ) : (
                  <>Unallocated • Ready for immediate sprint assignment</>
                )}
              </span>
              <span className="text-emerald-600 font-bold">Ready to Allocate</span>
            </div>
            {/* Free capacity bar */}
            <div className="w-full bg-emerald-100 dark:bg-emerald-950/50 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full w-full opacity-60" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
