import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { initialCalendarEvents } from '../../services/mockData';
import { Calendar, Layers, Rocket, Award, Users } from 'lucide-react';

export const ReleaseCalendar = () => {
  const typeIcons = { SPRINT: Layers, RELEASE: Rocket, MILESTONE: Award, MEETING: Users };
  const typeColors = { SPRINT: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', RELEASE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', MILESTONE: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', MEETING: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' };

  const months = ['August 2026', 'September 2026', 'October 2026'];
  const monthEvents = { 'August 2026': initialCalendarEvents.filter(e => e.date.includes('2026-08')), 'September 2026': initialCalendarEvents.filter(e => e.date.includes('2026-09')), 'October 2026': initialCalendarEvents.filter(e => e.date.includes('2026-10')) };

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Release Calendar" />
      <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-500" />Project Release Calendar</h1><p className="text-xs text-gray-500">Sprint boundaries, release dates, milestones, and planning meetings.</p></div>
      <div className="flex flex-wrap gap-3 mb-2">
        {Object.entries(typeColors).map(([type, cls]) => { const Icon = typeIcons[type]; return (
          <span key={type} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${cls}`}><Icon className="w-3 h-3" />{type}</span>
        ); })}
      </div>
      {months.map(month => (
        <div key={month} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">{month}</h3>
          {monthEvents[month]?.length > 0 ? (
            <div className="space-y-3">
              {monthEvents[month].map(evt => { const Icon = typeIcons[evt.type] || Calendar; return (
                <div key={evt.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700">
                  <div className="w-12 text-center"><div className="text-lg font-black text-gray-900 dark:text-gray-100">{evt.date.split('-')[2]}</div><div className="text-[9px] text-gray-400 uppercase font-bold">{new Date(evt.date).toLocaleDateString('en', { weekday: 'short' })}</div></div>
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: evt.color }} />
                  <div className="flex-1"><h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{evt.title}</h4><span className={`px-2 py-0.5 rounded text-[9px] font-bold ${typeColors[evt.type]}`}>{evt.type}</span></div>
                </div>
              ); })}
            </div>
          ) : <p className="text-xs text-gray-400">No events scheduled.</p>}
        </div>
      ))}
    </div>
  );
};
