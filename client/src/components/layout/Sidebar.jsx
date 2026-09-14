import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  CheckSquare,
  Kanban,
  Calendar,
  MessageSquare,
  BarChart3,
  Activity,
  UserCheck,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Settings,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Badge } from '../common/Badge';

export const Sidebar = ({ onCloseMobile }) => {
  const { user, logout, isAdmin, isManager } = useAuth();
  const { unreadCount } = useNotification();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Departments', path: '/departments', icon: Building2 },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Kanban Board', path: '/kanban', icon: Kanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Team Chat', path: '/chat', icon: MessageSquare },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Activity Log', path: '/activity', icon: Activity },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight leading-tight block">
              SphereOps
            </span>
            <span className="text-[10px] uppercase font-semibold text-brand-400 tracking-wider block">
              Enterprise SaaS
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-brand-500 text-white leading-none">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-200" />}
                </div>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* User Profile Card Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
          <NavLink
            to="/profile"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 min-w-0 flex-1 mr-2"
          >
            <div className="relative flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-700 text-white font-bold text-xs flex items-center justify-center">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate capitalize flex items-center gap-1">
                <span>{user?.role}</span>
              </div>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
