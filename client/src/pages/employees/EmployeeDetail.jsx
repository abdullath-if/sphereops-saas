import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  ArrowLeft,
  Award,
  Shield,
} from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const EmployeeDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/employees/${id}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load employee:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const { employee, metrics, projects = [], tasks = [], recentActivity = [] } = data || {};

  if (!employee) {
    return (
      <EmptyState
        icon={User}
        title="Employee not found"
        description="The employee you are looking for does not exist or has been removed."
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Back Button */}
      <div>
        <Link
          to="/employees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employee Directory
        </Link>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {employee.avatar ? (
            <img
              src={employee.avatar}
              alt=""
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-100 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-brand-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              {employee.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {employee.name}
              </h1>
              <Badge variant={employee.role} size="sm">
                {employee.role}
              </Badge>
              <Badge variant={employee.status} size="sm">
                {employee.status}
              </Badge>
            </div>
            <p className="text-sm font-medium text-slate-500">{employee.position}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{employee.department?.name || 'No Department'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{employee.email}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{employee.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Joined {new Date(employee.joiningDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Pills */}
        <div className="flex flex-wrap gap-1.5 max-w-sm">
          {employee.skills?.map((skill, i) => (
            <span
              key={i}
              className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* KPI Productivity Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Projects
          </span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{metrics?.totalProjects || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Tasks
          </span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{metrics?.totalTasks || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-center">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Completed
          </span>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">{metrics?.completedCount || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-center">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            Pending
          </span>
          <div className="text-xl font-extrabold text-blue-600 mt-1">{metrics?.pendingCount || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-center">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            Overdue
          </span>
          <div className="text-xl font-extrabold text-rose-600 mt-1">{metrics?.overdueCount || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-center">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
            Completion Rate
          </span>
          <div className="text-xl font-extrabold text-indigo-600 mt-1">
            {metrics?.completionRate || 0}%
          </div>
        </div>
      </div>

      {/* Grid: Projects and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Projects */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-brand-600" />
            Assigned Projects ({projects.length})
          </h3>
          <div className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No projects assigned.</p>
            ) : (
              projects.map((proj) => (
                <Link
                  key={proj._id}
                  to={`/projects/${proj._id}`}
                  className="block p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900">{proj.name}</span>
                    <Badge variant={proj.status} size="sm">
                      {proj.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mb-2">{proj.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Client: {proj.client || 'N/A'}</span>
                    <span>Manager: {proj.manager?.name || 'Unassigned'}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Assigned Tasks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Assigned Tasks ({tasks.length})
          </h3>
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No tasks assigned.</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {task.title}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Project: {task.project?.name || 'General'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={task.status} size="sm">
                      {task.status}
                    </Badge>
                    <Badge variant={task.priority} size="sm">
                      {task.priority}
                    </Badge>
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

export default EmployeeDetail;
