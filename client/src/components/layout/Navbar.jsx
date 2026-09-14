import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  Plus,
  Menu,
  Check,
  Trash2,
  ExternalLink,
  ChevronDown,
  User,
  Shield,
  LogOut,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../common/Button';
import Badge from '../common/Badge';

export const Navbar = ({ onOpenMobile, onQuickCreateTask, onQuickCreateProject }) => {
  const { user, logout, isManager } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm/50">
      {/* Left: Mobile menu button & Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-lg">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects, tasks, or team members..."
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/projects?search=${encodeURIComponent(e.target.value)}`);
              }
            }}
          />
        </div>
      </div>

      {/* Right: Quick Action, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {isManager && (
          <div className="hidden sm:flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              icon={Plus}
              onClick={onQuickCreateProject}
            >
              Project
            </Button>
            <Button
              size="xs"
              variant="primary"
              icon={Plus}
              onClick={onQuickCreateTask}
            >
              Task
            </Button>
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No notifications yet. You're all caught up!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3.5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3 ${
                        !n.isRead ? 'bg-brand-50/30' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-1">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {!n.isRead && (
                          <button
                            onClick={() => markAsRead(n._id)}
                            title="Mark as read"
                            className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n._id)}
                          title="Delete"
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                <div className="mt-1">
                  <Badge variant={user?.role} size="sm">
                    {user?.role}
                  </Badge>
                </div>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile & Settings</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100 mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
