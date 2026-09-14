import React, { useState, useEffect } from 'react';
import {
  Activity as ActivityIcon,
  Filter,
  Search,
  User,
  FolderKanban,
  CheckSquare,
  Building2,
  FileText,
  Clock,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const ActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [entityType, setEntityType] = useState('all');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: 50 });
      if (entityType !== 'all') params.append('entityType', entityType);

      const res = await api.get(`/activity-logs?${params.toString()}`);
      setLogs(res.data.logs || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityType]);

  const getEntityIcon = (type) => {
    switch (type) {
      case 'project':
        return <FolderKanban className="w-4 h-4 text-indigo-500" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-blue-500" />;
      case 'department':
        return <Building2 className="w-4 h-4 text-purple-500" />;
      case 'file':
        return <FileText className="w-4 h-4 text-amber-500" />;
      default:
        return <User className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ActivityIcon className="w-6 h-6 text-brand-600" />
            Audit & Activity Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete compliance trail of employee actions, task migrations, and workspace changes.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          >
            <option value="all">All Event Types</option>
            <option value="project">Projects</option>
            <option value="task">Tasks</option>
            <option value="user">Employees & Users</option>
            <option value="department">Departments</option>
            <option value="file">Files</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={4} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="No activity recorded"
          description="Actions will automatically appear in this stream as team members work."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
          {logs.map((log) => (
            <div
              key={log._id}
              className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden ring-1 ring-slate-200">
                  {log.actor?.avatar ? (
                    <img src={log.actor.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-xs text-slate-700">
                      {log.actor?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900">{log.actor?.name}</span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      {getEntityIcon(log.entityType)}
                      <span className="capitalize">{log.entityType}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{log.description}</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1.5 flex-shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {new Date(log.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  {new Date(log.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
