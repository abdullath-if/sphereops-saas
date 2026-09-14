import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  ExternalLink,
  Search,
  Clock,
  Briefcase,
  CheckSquare,
  MessageSquare,
  UserPlus,
  AlertCircle,
  FolderKanban,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading } =
    useNotification();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const getIconForType = (type) => {
    switch (type) {
      case 'task_assigned':
      case 'task_status_changed':
        return <CheckSquare className="w-4 h-4 text-brand-600" />;
      case 'project_assigned':
        return <FolderKanban className="w-4 h-4 text-indigo-600" />;
      case 'comment_added':
      case 'user_mentioned':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'deadline_approaching':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread' && item.isRead) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.message?.toLowerCase().includes(q) ||
        item.type?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time alerts, project updates, team mentions, and task assignments.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            icon={CheckCheck}
            onClick={markAllAsRead}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'unread'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No notifications found</p>
            <p className="text-xs text-slate-400 mt-1">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : 'When team members interact with your projects or tasks, updates will show up here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                !notif.isRead ? 'bg-brand-50/25 hover:bg-brand-50/40' : 'hover:bg-slate-50/70'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  !notif.isRead ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {getIconForType(notif.type)}
              </div>

              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`text-xs sm:text-sm font-semibold ${
                      !notif.isRead ? 'text-slate-900 font-bold' : 'text-slate-700'
                    }`}
                  >
                    {notif.title}
                  </h3>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-brand-600" />
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {notif.link && (
                    <span className="flex items-center gap-1 text-brand-600 font-medium hover:underline">
                      View details
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!notif.isRead && (
                  <button
                    type="button"
                    onClick={() => markAsRead(notif._id)}
                    title="Mark as read"
                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteNotification(notif._id)}
                  title="Delete notification"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
