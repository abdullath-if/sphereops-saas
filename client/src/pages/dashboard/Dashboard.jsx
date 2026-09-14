import React, { useState, useEffect } from 'react';
import {
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const handleCreated = () => fetchDashboard();
    window.addEventListener('task:created', handleCreated);
    window.addEventListener('project:created', handleCreated);
    return () => {
      window.removeEventListener('task:created', handleCreated);
      window.removeEventListener('project:created', handleCreated);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const { overview, charts, recentActivity = [], upcomingDeadlines = [] } = data || {};

  const statCards = [
    {
      title: 'Total Employees',
      value: overview?.totalEmployees || 0,
      sub: `${overview?.activeEmployees || 0} active members`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      link: '/employees',
    },
    {
      title: 'Active Projects',
      value: overview?.activeProjects || 0,
      sub: `Out of ${overview?.totalProjects || 0} total projects`,
      icon: FolderKanban,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      link: '/projects',
    },
    {
      title: 'Pending Tasks',
      value: overview?.pendingTasks || 0,
      sub: `${overview?.completedTasks || 0} completed`,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      link: '/tasks',
    },
    {
      title: 'Overdue Tasks',
      value: overview?.overdueTasks || 0,
      sub: 'Require immediate attention',
      icon: AlertTriangle,
      color: overview?.overdueTasks > 0 ? 'text-rose-600' : 'text-emerald-600',
      bg: overview?.overdueTasks > 0 ? 'bg-rose-50' : 'bg-emerald-50',
      link: '/tasks?status=todo',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time organizational performance, active initiatives, and operational health.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          <CalendarIcon className="w-4 h-4 text-brand-500" />
          <span>{new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Link
            key={i}
            to={card.link}
            className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-150 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                {card.title}
              </span>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                {card.sub}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Status Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of portfolio lifecycle</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.projectStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts?.projectStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} Projects`, name]}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Task Velocity by Stage</h3>
              <p className="text-xs text-slate-500">Current workload distribution across team</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.taskStatus || []}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val) => [`${val} Tasks`, 'Count']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(charts?.taskStatus || []).map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Team Productivity Performance Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Team Task Completion Statistics</h3>
            <p className="text-xs text-slate-500">Productivity and delivery rate across contributors</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts?.teamPerformance || []}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="completed" name="Completed Tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdue" name="Overdue Tasks" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Upcoming Deadlines & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Upcoming Deadlines</h3>
            <Link to="/calendar" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View Calendar
            </Link>
          </div>
          <div className="space-y-2.5 flex-1">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No approaching deadlines found.
              </div>
            ) : (
              upcomingDeadlines.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/70 transition-colors border border-slate-100"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {task.title}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {task.project?.name || 'General Project'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={task.priority} size="sm">
                      {task.priority}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {new Date(task.dueDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Company Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Audit & Activity Log</h3>
            <Link to="/activity" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View Full Feed
            </Link>
          </div>
          <div className="space-y-3 flex-1">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No recent activity recorded yet.
              </div>
            ) : (
              recentActivity.map((act) => (
                <div key={act._id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {act.actor?.avatar ? (
                      <img
                        src={act.actor.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      act.actor?.name?.charAt(0) || 'A'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-800 leading-snug">
                      <span className="font-semibold">{act.actor?.name || 'System'}: </span>
                      {act.description}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
