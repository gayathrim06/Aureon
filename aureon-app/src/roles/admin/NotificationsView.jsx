import React, { useState } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { initialNotifications } from '../../services/mockData';
import { Bell, ShieldAlert, Server, FolderKanban, CheckSquare, Bug, GitPullRequest, Rocket, CheckCircle2, Circle } from 'lucide-react';

export const NotificationsView = ({ roleFilter }) => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const typeIcons = { SECURITY: ShieldAlert, SYSTEM: Server, PROJECT: FolderKanban, TASK: CheckSquare, BUG: Bug, PR: GitPullRequest, DEPLOYMENT: Rocket };
  const typeColors = { SECURITY: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40', SYSTEM: 'text-slate-500 bg-slate-50 dark:bg-slate-950/40', PROJECT: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40', TASK: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40', BUG: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40', PR: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40', DEPLOYMENT: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' };
  const priorityColors = { HIGH: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };

  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Notifications" />
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Bell className="w-5 h-5 text-blue-500" />Notifications Center</h1><p className="text-xs text-gray-500">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p></div>
        <button onClick={markAllRead} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Mark All Read</button>
      </div>
      <div className="space-y-3">
        {notifications.map(n => {
          const Icon = typeIcons[n.type] || Bell;
          return (
            <div key={n.id} onClick={() => markRead(n.id)} className={`p-4 rounded-xl border shadow-sm flex items-start gap-4 cursor-pointer transition-all ${n.read ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-70' : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900/30'}`}>
              <div className={`p-2 rounded-xl ${typeColors[n.type]}`}><Icon className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{n.title}</h4>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${priorityColors[n.priority]}`}>{n.priority}</span>
                  {!n.read && <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />}
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
                <span className="text-[10px] text-gray-400 mt-1 block">{n.timestamp}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
