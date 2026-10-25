import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import { 
  CheckCircle2, AlertTriangle, Users, Award, 
  ArrowRight, Sparkles, Check, ChevronDown, ChevronUp, UserCheck, ShieldAlert
} from 'lucide-react';

export const TaskSkillRecommendationModal = ({
  isOpen,
  onClose,
  task,
  onAssignmentConfirmed,
  onShowToast
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDevId, setSelectedDevId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);

  const fetchRecommendations = async () => {
    if (!task || !task.id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/tasks/${task.id}/recommendations`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      const resData = await res.json().catch(() => ({}));
      if (res.ok && resData.success !== false && (resData.success || res.status === 200 || res.status === 201 || resData.task)) {
        setData(resData);
        if (resData.recommended_developer) {
          setSelectedDevId(resData.recommended_developer.developer_id);
        } else {
          setSelectedDevId(null);
        }
      } else {
        setError(resData.message || 'Unable to fetch recommendations for this task.');
      }
    } catch (err) {
      console.error('Failed to load task recommendations:', err);
      setError('Network error while requesting developer recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && task) {
      fetchRecommendations();
    } else {
      setData(null);
      setError(null);
      setSelectedDevId(null);
    }
  }, [isOpen, task?.id]);

  const handleConfirmAssignment = async () => {
    if (!task || !selectedDevId) return;

    try {
      setConfirming(true);
      const res = await fetch(`${API_BASE_URL}/tasks/${task.id}/confirm-assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          developer_id: selectedDevId,
          notes: 'Confirmed skill-based recommendation assignment.'
        })
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        onShowToast && onShowToast({
          type: 'success',
          title: 'Assignment Confirmed',
          message: resData.message || 'Task successfully assigned to developer.'
        });
        if (typeof onAssignmentConfirmed === 'function') {
          onAssignmentConfirmed(resData.task || { ...task, assigned_to_id: selectedDevId });
        }
        onClose();
      } else if (res.status === 409) {
        // Revalidation failure: workload or qualifications changed
        setError(resData.message || 'Developer eligibility changed. Please review updated recommendations.');
        await fetchRecommendations();
      } else {
        setError(resData.message || 'Failed to confirm task assignment.');
      }
    } catch (err) {
      console.error('Error confirming assignment:', err);
      setError('Network failure while confirming assignment.');
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  const recommended = data?.recommended_developer;
  const alternatives = data?.alternative_candidates || [];
  const excluded = data?.excluded_candidates || [];
  const requiredSkills = data?.required_skills || task?.required_skills_list || [];

  const selectedCandidate = 
    recommended && recommended.developer_id === selectedDevId 
      ? recommended 
      : alternatives.find(a => a.developer_id === selectedDevId) || recommended;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Skill-Based Task Recommendation"
      subtitle={`Deliverable: "${task?.title || 'Task'}"`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Required Skills Banner */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300 mr-2">Required Skills:</span>
            {requiredSkills.length > 0 ? (
              <span className="inline-flex flex-wrap gap-1 mt-1 sm:mt-0">
                {requiredSkills.map((sk, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40">
                    {sk}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-slate-400 italic">No specific required skills specified (general task)</span>
            )}
          </div>
          <div className="text-right text-[11px] text-slate-500 font-medium">
            Est: <strong className="text-slate-700 dark:text-slate-300">{task?.estimated_hours || 4.0}h</strong>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              Evaluating developer skills, team capacity, and active workload...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">Recommendation Alert</h4>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* No Eligible Candidates State */}
        {!loading && !error && data?.status === 'NO_ELIGIBLE_CANDIDATE' && (
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              No Eligible Developer Found
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-400 max-w-md mx-auto">
              {data.summary_reason || 'No developer currently meets the required skills while having available capacity slots.'}
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              The task remains unassigned. You can adjust task skill requirements or assign when developer workload decreases.
            </div>
          </div>
        )}

        {/* Successful Recommendation Ready */}
        {!loading && !error && recommended && (
          <div className="space-y-4">
            {/* Top Recommended Card */}
            <div 
              onClick={() => setSelectedDevId(recommended.developer_id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedDevId === recommended.developer_id
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Top Match Recommendation
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-500">{recommended.designation}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-xs">
                  <span>Score</span>
                  <span className="text-sm font-black">{recommended.suitability_score}</span>
                  <span className="text-[10px] opacity-80">/100</span>
                </div>
              </div>

              <div className="flex items-start justify-between mt-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {recommended.name}
                    <span className="text-xs font-normal text-slate-500">({recommended.email})</span>
                  </h4>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed bg-white/60 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    💡 <strong>Reason:</strong> {recommended.explanation}
                  </div>
                </div>
              </div>

              {/* Skills and Capacity Badges */}
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Matched Skills ({recommended.matched_skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {recommended.matched_skills.length > 0 ? (
                      recommended.matched_skills.map((s, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No specific skill requirement</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Workload & Bandwidth
                  </span>
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold space-y-0.5">
                    <div>Active: <strong className="text-indigo-600 dark:text-indigo-400">{recommended.active_tasks_count}</strong> / {recommended.max_concurrent_tasks} tasks ({recommended.remaining_task_capacity} slot(s) free)</div>
                    <div>Remaining Hours: <strong className="text-emerald-600">{recommended.remaining_hours}h</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternative Eligible Candidates */}
            {alternatives.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                  Alternative Eligible Candidates ({alternatives.length})
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {alternatives.map((alt) => {
                    const isSelected = selectedDevId === alt.developer_id;
                    return (
                      <div
                        key={alt.developer_id}
                        onClick={() => setSelectedDevId(alt.developer_id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="selectedDev"
                            checked={isSelected}
                            onChange={() => setSelectedDevId(alt.developer_id)}
                            className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {alt.name}
                              <span className="text-[10px] font-normal text-slate-500">({alt.role})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Matched: <span className="font-semibold text-emerald-600">{alt.matched_skills.join(', ') || 'General'}</span> • Load: <span className="font-semibold">{alt.active_tasks_count}/{alt.max_concurrent_tasks} tasks</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {alt.suitability_score} <span className="text-[10px] opacity-60">/100</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Excluded Candidates Collapsible Section */}
            {excluded.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowExcluded(!showExcluded)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
                >
                  {showExcluded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showExcluded ? 'Hide' : 'View'} Excluded Candidates ({excluded.length})</span>
                </button>

                {showExcluded && (
                  <div className="mt-2 space-y-1.5 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    {excluded.map((exc) => (
                      <div key={exc.developer_id} className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{exc.name}</span>
                        <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">{exc.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">
            {selectedCandidate ? (
              <span>Assigning to: <strong className="text-slate-900 dark:text-white">{selectedCandidate.name}</strong></span>
            ) : (
              <span>Task will remain unassigned until confirmed</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={confirming}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAssignment}
              disabled={confirming || !selectedDevId || loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              {confirming ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Confirming...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Assignment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
