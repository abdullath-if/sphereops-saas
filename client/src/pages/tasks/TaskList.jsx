import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  User,
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import TaskModal from '../../components/tasks/TaskModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const { user, isManager } = useAuth();
  const { showToast } = useToast();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedProject !== 'all') params.append('project', selectedProject);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedPriority !== 'all') params.append('priority', selectedPriority);

      const res = await api.get(`/tasks?${params.toString()}`);
      setTasks(res.data.tasks || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/projects').then((res) => setProjects(res.data.projects || []));
    api.get('/employees?limit=100').then((res) => setEmployees(res.data.employees || []));
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, selectedProject, selectedStatus, selectedPriority]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      showToast('Task status updated.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await api.delete(`/tasks/${deleteCandidate._id}`);
      showToast('Task deleted successfully.', 'success');
      setDeleteCandidate(null);
      fetchTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track individual work items, assignments, stages, and due dates.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
        >
          Add Task
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Task Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="Try changing the filter options or create a new task."
          actionLabel="Create Task"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Task</th>
                  <th className="px-6 py-3.5">Project</th>
                  <th className="px-6 py-3.5">Assignee</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => {
                  const isOverdue =
                    task.status !== 'completed' &&
                    task.dueDate &&
                    new Date(task.dueDate) < new Date();

                  return (
                    <tr key={task._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <span className="font-bold text-slate-900 block truncate">
                            {task.title}
                          </span>
                          {task.tags?.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {task.tags.slice(0, 2).map((t, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        {task.project?.name || 'General'}
                      </td>
                      <td className="px-6 py-4">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-2">
                            {task.assignedTo.avatar ? (
                              <img
                                src={task.assignedTo.avatar}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 font-bold text-[10px] flex items-center justify-center">
                                {task.assignedTo.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs text-slate-800">{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={task.priority} size="sm">
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          className="text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
                        >
                          <option value="todo">Todo</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {task.dueDate ? (
                          <span
                            className={`font-semibold ${
                              isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                            }`}
                          >
                            {new Date(task.dueDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        ) : (
                          <span className="text-slate-400">No deadline</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTask(task);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(task)}
                          className="inline-flex p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          task={editingTask}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingTask(null);
            fetchTasks();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteCandidate && (
        <ConfirmDialog
          isOpen={!!deleteCandidate}
          onClose={() => setDeleteCandidate(null)}
          onConfirm={handleDelete}
          title="Delete Task"
          message={`Are you sure you want to delete task "${deleteCandidate.title}"?`}
        />
      )}
    </div>
  );
};

export default TaskList;
