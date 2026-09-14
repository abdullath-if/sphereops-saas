import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderKanban,
  CheckSquare,
  X,
} from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
      ]);

      const calendarEvents = [];

      // Add tasks with due dates
      (tasksRes.data.tasks || []).forEach((t) => {
        if (t.dueDate) {
          calendarEvents.push({
            id: `task-${t._id}`,
            type: 'task',
            title: t.title,
            date: new Date(t.dueDate),
            data: t,
            priority: t.priority,
            status: t.status,
          });
        }
      });

      // Add project target end dates
      (projectsRes.data.projects || []).forEach((p) => {
        if (p.endDate) {
          calendarEvents.push({
            id: `project-${p._id}`,
            type: 'project',
            title: `Deadline: ${p.name}`,
            date: new Date(p.endDate),
            data: p,
            priority: p.priority,
            status: p.status,
          });
        }
      });

      setEvents(calendarEvents);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Group events by day of current month
  const getEventsForDay = (day) => {
    return events.filter((e) => {
      return (
        e.date.getDate() === day &&
        e.date.getMonth() === month &&
        e.date.getFullYear() === year
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-brand-600" />
            Project & Task Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Visualize upcoming milestone deliveries, sprint cutoffs, and scheduled deadlines.
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="xs" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-[120px] text-center">
              {monthName} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Days of week */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Month days */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[550px]">
          {/* Leading empty cells */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-50/40 p-2 min-h-[90px]" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayEvents = getEventsForDay(dayNum);
            const isToday =
              new Date().getDate() === dayNum &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={`day-${dayNum}`}
                className={`p-2 min-h-[90px] transition-colors hover:bg-slate-50/50 flex flex-col ${
                  isToday ? 'bg-brand-50/20' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {dayEvents.length} due
                    </span>
                  )}
                </div>

                {/* Day events stack */}
                <div className="space-y-1 overflow-y-auto max-h-24">
                  {dayEvents.map((evt) => (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => setSelectedEvent(evt)}
                      className={`w-full text-left text-[11px] font-semibold px-2 py-1 rounded-md truncate transition-transform hover:scale-[1.02] block ${
                        evt.type === 'project'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : evt.priority === 'critical'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {evt.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.type === 'project' ? 'Project Milestone' : 'Task Details'}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-left">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Title
              </span>
              <h4 className="text-base font-bold text-slate-900 leading-snug">
                {selectedEvent.title}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={selectedEvent.status} size="sm">
                {selectedEvent.status}
              </Badge>
              <Badge variant={selectedEvent.priority} size="sm">
                {selectedEvent.priority}
              </Badge>
            </div>

            {selectedEvent.data?.description && (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {selectedEvent.data.description}
                </p>
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Due Date
              </span>
              <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {selectedEvent.date.toLocaleDateString(undefined, { dateStyle: 'full' })}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CalendarView;
