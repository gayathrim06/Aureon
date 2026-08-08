import React, { useState } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Modal } from '../../components/common/Modal';
import { initialTasks } from '../../services/mockData';
import { logAuditEvent } from '../../services/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, MessageSquare, Paperclip, Plus, ArrowRight, User } from 'lucide-react';

export const MyTasksKanban = ({ onShowToast }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState(null);
  const [commentInput, setCommentInput] = useState('');

  const columns = [
    { key: 'TODO', label: 'To Do', color: 'border-t-slate-500 bg-slate-500/5' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-blue-500 bg-blue-500/5' },
    { key: 'REVIEW', label: 'Code Review', color: 'border-t-amber-500 bg-amber-500/5' },
    { key: 'DONE', label: 'Completed', color: 'border-t-emerald-500 bg-emerald-500/5' }
  ];

  const moveTaskStatus = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        logAuditEvent({
          user,
          role: user?.role,
          action: 'TASK_KANBAN_MOVE',
          resource: `Task ${taskId} moved from ${t.status} to ${newStatus}`,
          status: 'SUCCESS'
        });
        return { ...t, status: newStatus };
      }
      return t;
    }));

    onShowToast && onShowToast({
      type: 'info',
      title: 'Kanban Board Updated',
      message: `Card ${taskId} moved to ${newStatus.replace('_', ' ')}`
    });
  };

  const handleAddComment = () => {
    if (!commentInput.trim() || !activeTask) return;
    const newComment = { author: user?.name || 'Developer', text: commentInput, time: 'Just now' };

    setTasks(prev => prev.map(t => {
      if (t.id === activeTask.id) {
        const updatedComments = [...(t.comments || []), newComment];
        setActiveTask({ ...t, comments: updatedComments });
        return { ...t, comments: updatedComments };
      }
      return t;
    }));

    logAuditEvent({
      user,
      role: user?.role,
      action: 'TASK_COMMENT_ADD',
      resource: `Added comment to ${activeTask.id}`,
      status: 'SUCCESS'
    });

    setCommentInput('');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="My Tasks" />

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Interactive Sprint Kanban Board</h1>
        <p className="text-xs text-gray-500">Drag or click to shift cards between columns, post comments, and upload code assets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className={`p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm border-t-4 ${col.color} flex flex-col min-h-[500px]`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{col.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 font-mono text-[10px] font-bold">
                  {colTasks.length}
                </span>
              </div>

              <div className="mt-3 space-y-3 flex-1">
                {colTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setActiveTask(t)}
                    className="p-3.5 rounded-lg bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/80 shadow-xs hover:border-blue-500 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">{t.id}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {t.priority}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{t.title}</h4>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-200/60 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {t.comments?.length || 0}</span>
                        <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> {t.attachments?.length || 0}</span>
                      </div>
                      <span>{t.assignee}</span>
                    </div>

                    {/* Quick Move Buttons */}
                    <div className="pt-2 flex flex-wrap gap-1">
                      {col.key !== 'TODO' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveTaskStatus(t.id, col.key === 'DONE' ? 'REVIEW' : col.key === 'REVIEW' ? 'IN_PROGRESS' : 'TODO'); }}
                          className="px-2 py-0.5 rounded text-[9px] bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 font-medium"
                        >
                          ← Move Left
                        </button>
                      )}
                      {col.key !== 'DONE' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveTaskStatus(t.id, col.key === 'TODO' ? 'IN_PROGRESS' : col.key === 'IN_PROGRESS' ? 'REVIEW' : 'DONE'); }}
                          className="px-2 py-0.5 rounded text-[9px] bg-blue-600 text-white hover:bg-blue-500 font-medium"
                        >
                          Move Right →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details & Comments Modal */}
      <Modal
        isOpen={!!activeTask}
        onClose={() => setActiveTask(null)}
        title={`Task Inspector: ${activeTask?.id}`}
        footer={
          <button onClick={() => setActiveTask(null)} className="px-4 py-1.5 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-lg">Close</button>
        }
      >
        {activeTask && (
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{activeTask.title}</h3>
              <p className="text-gray-500 mt-1">Assignee: {activeTask.assignee} | Due: {activeTask.dueDate}</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <h4 className="font-bold mb-2">Discussion & Code Comments</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {activeTask.comments?.map((c, idx) => (
                  <div key={idx} className="p-2 rounded bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-[11px]">
                    <div className="flex justify-between font-semibold text-blue-600 dark:text-blue-400">
                      <span>{c.author}</span>
                      <span className="text-[9px] text-gray-400">{c.time}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mt-0.5">{c.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Write technical comment..."
                  className="flex-1 p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
                <button onClick={handleAddComment} className="px-3 py-2 bg-blue-600 text-white font-semibold rounded">Post</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
