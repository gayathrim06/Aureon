import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../services/auditLogger';
import { ClipboardList, Plus, UserCheck, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import { TaskSkillRecommendationModal } from '../../components/common/TaskSkillRecommendationModal';

export const LeadTaskAllocation = ({ onShowToast }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendingTask, setRecommendingTask] = useState(null);

  const fetchLeadTasks = async () => {
    setLoading(true);
    const headers = getAuthHeaders();

    try {
      const [tRes, uRes, tmRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tasks/`, { headers }),
        fetch(`${API_BASE_URL}/users/`, { headers }),
        fetch(`${API_BASE_URL}/teams/`, { headers })
      ]);

      if (tRes.ok) {
        const data = await tRes.json();
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      } else {
        setTasks([]);
      }

      if (uRes.ok) {
        const uData = await uRes.json();
        setDevelopers(Array.isArray(uData.users) ? uData.users : []);
      }

      if (tmRes && tmRes.ok) {
        const tmData = await tmRes.json();
        setTeamsList(Array.isArray(tmData.teams) ? tmData.teams : []);
      }
    } catch (err) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadTasks();
  }, []);

  const handleAssignDeveloper = async (taskId, devId) => {
    const chosenDev = developers.find(u => String(u.id) === String(devId));
    const devName = chosenDev ? (chosenDev.full_name || chosenDev.email) : 'Developer';

    // Optimistic UI update
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          assigned_to_id: devId,
          assignee: devName,
          assignee_name: devName,
          needs_assignment: false
        };
      }
      return t;
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ assigned_to: devId })
      });

      if (res.ok) {
        if (typeof onShowToast === 'function') {
          onShowToast({ type: 'success', title: 'Developer Assigned', message: `Task assigned to ${devName}.` });
        }
        logAuditEvent({ user, role: user?.role, action: 'LEAD_TASK_ASSIGN', resource: `Task ${taskId} → ${devName}`, status: 'SUCCESS' });
      } else {
        const err = await res.json();
        if (typeof onShowToast === 'function') {
          onShowToast({ type: 'error', title: 'Assignment Failed', message: err.message || 'Could not assign developer.' });
        }
      }
    } catch (err) {
      console.error('Error assigning developer:', err);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    if (!taskId) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {}

    if (typeof onShowToast === 'function') {
      onShowToast({ type: 'success', title: 'Task Status Updated', message: `Task status updated to ${newStatus}.` });
    }
  };

  const handleApproveTask = async (taskId) => {
    if (!taskId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ approval_notes: 'Deliverable reviewed and approved by Team Lead.' })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'COMPLETED', team_leader_review: 'Deliverable reviewed and approved by Team Lead.' } : t));
        if (typeof onShowToast === 'function') {
          onShowToast({ type: 'success', title: 'Task Approved', message: 'Task marked COMPLETED and developer freed.' });
        }
      }
    } catch (err) {}
  };

  const priorityColors = {
    CRITICAL: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold border border-rose-300',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-extrabold border border-orange-300',
    MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold border border-amber-300',
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-extrabold border border-blue-300'
  };

  const columns = [
    {
      key: 'id',
      label: 'Ticket ID',
      render: (val, row) => <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{val ? String(val).substring(0, 8) : 'TCK'}</span>
    },
    {
      key: 'title',
      label: 'Task Name',
      render: (val, row) => (
        <div>
          <span className="font-extrabold text-slate-900 dark:text-white block">{val || 'Untitled Task'}</span>
          <span className="text-[10px] text-slate-500 font-medium">📁 {row?.project_name || 'No Project Assigned'}</span>
          {row?.is_orphan && (
            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-bold">
              ⚠️ Needs Review
            </span>
          )}
        </div>
      )
    },
    {
      key: 'sprint_name',
      label: 'Sprint',
      render: (val, row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
          ⚡ {val || (row?.is_orphan ? 'No Sprint (Needs Review)' : 'Backlog')}
        </span>
      )
    },
    {
      key: 'assignee_name',
      label: 'Assigned To',
      render: (val, row) => {
        const currentDevId = row?.assigned_to_id || developers.find(d => d.full_name === val || d.email === val)?.id || '';
        
        // Scope candidate developers to the task's assigned squad/team
        const taskTeam = teamsList.find(t => 
          (row?.team_id && String(t.id) === String(row.team_id)) ||
          (row?.assigned_team && t.name === row.assigned_team)
        );

        let candidateDevs = developers;
        if (taskTeam) {
          const memberIds = new Set((taskTeam.member_details || []).map(m => String(m.id)));
          if (taskTeam.team_leader_id) memberIds.add(String(taskTeam.team_leader_id));
          if (taskTeam.lead_id) memberIds.add(String(taskTeam.lead_id));
          const matched = developers.filter(d => memberIds.has(String(d.id)));
          candidateDevs = matched.length > 0 ? matched : (taskTeam.member_details || []);
        }

        return (
          <select
            value={currentDevId}
            onChange={(e) => handleAssignDeveloper(row.id, e.target.value)}
            className="p-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs text-slate-900 dark:text-white cursor-pointer hover:border-indigo-500 transition-colors"
          >
            <option value="">⚠️ Needs Assignment</option>
            {currentDevId && !candidateDevs.some(d => String(d.id) === String(currentDevId)) && (
              <option value={currentDevId}>
                👤 {val || 'Assigned Developer'}
              </option>
            )}
            {candidateDevs.map(dev => (
              <option key={dev.id} value={dev.id}>
                👤 {dev.full_name || dev.name || dev.email} ({dev.role || 'DEV'})
              </option>
            ))}
          </select>
        );
      }
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] ${priorityColors[val] || 'bg-slate-100'}`}>{val || 'HIGH'}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => {
        if (val === 'IN_REVIEW') {
          return (
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-xs border border-amber-300 flex items-center gap-1">
              <Clock className="w-3 h-3" /> In Review
            </span>
          );
        }
        return (
          <select
            value={val || 'TODO'}
            onChange={(e) => handleUpdateStatus(row?.id, e.target.value)}
            className="p-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        );
      }
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (val, row) => (
        <span className={`font-mono text-xs font-bold ${row?.is_overdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
          {val ? String(val).split('T')[0] : 'No Due Date'}
          {row?.is_overdue && <span className="block text-[9px] text-rose-500 font-extrabold uppercase">Overdue</span>}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRecommendingTask(row)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition cursor-pointer shadow-xs active:scale-95"
              title="Auto-Recommend developer based on skills and capacity"
            >
              <Sparkles className="w-3 h-3 text-indigo-500" /> Recommend
            </button>
            {row?.status === 'IN_REVIEW' && (
              <button
                onClick={() => handleApproveTask(row.id)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all hover:scale-105"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="Task Allocation" />

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Team Lead: Task Allocation & Developer Assignments
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review tasks within your sprint hierarchy, approve completed developer deliverables, and monitor execution.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={tasks}
        searchPlaceholder="Search assigned tasks by title, sprint, engineer, project..."
      />

      {/* Skill-Based Task Recommendation Modal */}
      {recommendingTask && (
        <TaskSkillRecommendationModal
          task={recommendingTask}
          isOpen={Boolean(recommendingTask)}
          onClose={() => setRecommendingTask(null)}
          onConfirmed={(assigned) => {
            fetchLeadTasks();
            if (typeof onShowToast === 'function') {
              onShowToast({
                type: 'success',
                title: 'Developer Assigned via Recommendation',
                message: `Task assigned to ${assigned.user_name || 'selected candidate'}.`
              });
            }
          }}
        />
      )}
    </div>
  );
};
