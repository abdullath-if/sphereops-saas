import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  Briefcase,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import api from '../../services/api';
import { CardSkeleton } from '../../components/common/Skeleton';
import Badge from '../../components/common/Badge';

const DEPT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchFilterOptions = async () => {
    try {
      const [projRes, deptRes] = await Promise.all([
        api.get('/projects'),
        api.get('/departments'),
      ]);
      setProjects(projRes.data.projects || []);
      setDepartments(deptRes.data.departments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProject !== 'all') params.append('project', selectedProject);
      if (selectedDept !== 'all') params.append('department', selectedDept);

      if (dateRange === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        params.append('startDate', d.toISOString());
      } else if (dateRange === '90days') {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        params.append('startDate', d.toISOString());
      }

      const res = await api.get(`/analytics/dashboard?${params.toString()}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedProject, selectedDept, dateRange]);

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const { overview, charts } = analytics || {};

  const projectCompletionRate =
    overview?.totalProjects > 0
      ? Math.round(((overview?.completedProjects || 0) / overview?.totalProjects) * 100)
      : 0;

  const taskCompletionRate =
    overview?.totalTasks > 0
      ? Math.round(((overview?.completedTasks || 0) / overview?.totalTasks) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header & Advanced Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            Performance & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time intelligence on deliverables, resource allocation, and team velocity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              aria-label="Department Scope"
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Project Scope"
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Timeframe"
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Employees
          </span>
          <div className="text-2xl font-extrabold text-slate-900">
            {overview?.totalEmployees || 0}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {overview?.activeEmployees || 0} Active
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Projects
          </span>
          <div className="text-2xl font-extrabold text-slate-900">
            {overview?.totalProjects || 0}
          </div>
          <span className="text-[11px] text-brand-600 font-semibold mt-1 block">
            {overview?.activeProjects || 0} Active
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Project Completion
          </span>
          <div className="text-2xl font-extrabold text-indigo-600">
            {projectCompletionRate}%
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            {overview?.completedProjects || 0} Delivered
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Tasks
          </span>
          <div className="text-2xl font-extrabold text-slate-900">
            {overview?.totalTasks || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            {overview?.pendingTasks || 0} In Flight
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Task Completion
          </span>
          <div className="text-2xl font-extrabold text-emerald-600">
            {taskCompletionRate}%
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {overview?.completedTasks || 0} Finished
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Overdue Tasks
          </span>
          <div
            className={`text-2xl font-extrabold ${
              overview?.overdueTasks > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {overview?.overdueTasks || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Requires attention
          </span>
        </div>
      </div>

      {/* Row 1: Donut & Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Donut */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Project Portfolio Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Stages of all tracked initiatives</p>
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
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Pipeline Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Task Pipeline Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Current load across status columns</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.taskStatus || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val) => [`${val} Tasks`, 'Count']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
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

      {/* Row 2: Department Distribution (Donut) & Velocity Trend (Line Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Employee Distribution by Department</h3>
          <p className="text-xs text-slate-500 mb-4">Talent allocation across operational divisions</p>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.departmentDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                >
                  {(charts?.departmentDistribution || []).map((entry, index) => (
                    <Cell
                      key={`dept-cell-${index}`}
                      fill={DEPT_COLORS[index % DEPT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} Members`, name]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Velocity / Productivity Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Velocity & Throughput Trend</h3>
          <p className="text-xs text-slate-500 mb-4">Cumulative task generation vs delivery pace</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.productivityTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="created"
                  name="Created Tasks"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed Tasks"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Project Progress Table */}
      {charts?.projectProgress?.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Project Progress Overview</h3>
          <p className="text-xs text-slate-500 mb-4">Milestone progress calculated from completed deliverables</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Project Name</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Tasks</th>
                  <th className="pb-3 w-48">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {charts.projectProgress.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-semibold text-slate-900">{proj.name}</td>
                    <td className="py-3">
                      <Badge variant={proj.status} size="sm">
                        {proj.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge variant={proj.priority} size="sm">
                        {proj.priority}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-500">
                      {proj.completedTasks} / {proj.totalTasks}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              proj.progress >= 100
                                ? 'bg-emerald-500'
                                : proj.progress >= 50
                                ? 'bg-brand-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, proj.progress)}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px] text-slate-700 w-9 text-right">
                          {proj.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row 4: Team Output & Productivity Rankings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Contributor Velocity & Productivity</h3>
        <p className="text-xs text-slate-500 mb-6">Task volume completed versus in-flight by team member</p>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts?.teamPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdue" name="Overdue" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
