import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { getAuthHeaders } from '../../services/apiClient';
import { Calendar, Layers, Rocket, Award, Users, RefreshCw } from 'lucide-react';

export const ReleaseCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      const [sprintRes, projRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/sprints/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/projects/', { headers })
      ]);

      const liveEvents = [];
      if (sprintRes.ok) {
        const sData = await sprintRes.json();
        if (sData.sprints) {
          sData.sprints.forEach(s => {
            if (s.start_date) {
              liveEvents.push({
                id: `sprint-start-${s.id}`,
                title: `${s.name || 'Sprint'} Kickoff`,
                date: s.start_date.substring(0, 10),
                type: 'SPRINT',
                color: '#3b82f6'
              });
            }
            if (s.end_date) {
              liveEvents.push({
                id: `sprint-end-${s.id}`,
                title: `${s.name || 'Sprint'} Delivery`,
                date: s.end_date.substring(0, 10),
                type: 'SPRINT',
                color: '#6366f1'
              });
            }
          });
        }
      }

      if (projRes.ok) {
        const pData = await projRes.json();
        if (pData.projects) {
          pData.projects.forEach(p => {
            if (p.target_deadline) {
              liveEvents.push({
                id: `proj-release-${p.id}`,
                title: `${p.name} Production Release`,
                date: p.target_deadline.substring(0, 10),
                type: 'RELEASE',
                color: '#10b981'
              });
            }
          });
        }
      }

      setEvents(liveEvents);
    } catch (err) {
      console.error('Failed to load release calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const typeIcons = { SPRINT: Layers, RELEASE: Rocket, MILESTONE: Award, MEETING: Users };
  const typeColors = {
    SPRINT: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    RELEASE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    MILESTONE: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    MEETING: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
  };

  // Group events by YYYY-MM
  const monthsMap = {};
  events.forEach(evt => {
    if (!evt.date) return;
    const d = new Date(evt.date);
    if (isNaN(d.getTime())) return;
    const mLabel = d.toLocaleString('en', { month: 'long', year: 'numeric' });
    if (!monthsMap[mLabel]) monthsMap[mLabel] = [];
    monthsMap[mLabel].push(evt);
  });

  const monthKeys = Object.keys(monthsMap);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb activeTab="Release Calendar" />
        <button
          onClick={fetchCalendarData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Calendar
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" />Project Release Calendar
        </h1>
        <p className="text-xs text-gray-500">Sprint boundaries, release target deadlines, and deliverables mapped from PostgreSQL.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-2">
        {Object.entries(typeColors).map(([type, cls]) => {
          const Icon = typeIcons[type] || Calendar;
          return (
            <span key={type} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${cls}`}>
              <Icon className="w-3 h-3" />{type}
            </span>
          );
        })}
      </div>

      {loading && events.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">Loading live schedule...</div>
      ) : monthKeys.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          No scheduled sprint milestones or project deadlines found in database.
        </div>
      ) : (
        monthKeys.map(month => (
          <div key={month} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">{month}</h3>
            <div className="space-y-3">
              {monthsMap[month].map(evt => {
                const Icon = typeIcons[evt.type] || Calendar;
                const d = new Date(evt.date);
                const dayNum = evt.date.split('-')[2] || d.getDate();
                const dayName = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en', { weekday: 'short' });
                return (
                  <div key={evt.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700">
                    <div className="w-12 text-center">
                      <div className="text-lg font-black text-gray-900 dark:text-gray-100">{dayNum}</div>
                      <div className="text-[9px] text-gray-400 uppercase font-bold">{dayName}</div>
                    </div>
                    <div className="w-1 h-8 rounded-full" style={{ backgroundColor: evt.color || '#3b82f6' }} />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{evt.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${typeColors[evt.type] || typeColors.SPRINT}`}>
                        {evt.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

