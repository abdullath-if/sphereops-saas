import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Plus,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderKanban,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import TaskModal from '../../components/tasks/TaskModal';

const COLUMNS = [
  { id: 'todo', label: 'Todo', color: 'border-t-slate-400', countBadge: 'bg-slate-100 text-slate-700' },
  { id: 'in_progress', label: 'In Progress', color: 'border-t-blue-500', countBadge: 'bg-blue-50 text-blue-700' },
  { id: 'review', label: 'In Review', color: 'border-t-purple-500', countBadge: 'bg-purple-50 text-purple-700' },
  { id: 'completed', label: 'Completed', color: 'border-t-emerald-500', countBadge: 'bg-emerald-50 text-emerald-700' },
];

export const KanbanBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultColumnStatus, setDefaultColumnStatus] = useState('todo');

  const { socket, joinProject, leaveProject } = useSocket();
  const { showToast } = useToast();
  const { user } = useAuth();

  const fetchBoardData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get(selectedProject !== 'all' ? `/tasks?project=${selectedProject}` : '/tasks'),
        api.get('/projects'),
      ]);
      setTasks(tasksRes.data.tasks || []);
      setProjects(projectsRes.data.projects || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    fetchBoardData();
    if (selectedProject !== 'all') {
      joinProject(selectedProject);
    }
    return () => {
      if (selectedProject !== 'all') {
        leaveProject(selectedProject);
      }
    };
  }, [selectedProject]);

  // Real-time task synchronization
  useEffect(() => {
    if (!socket) return;

    const handleTaskMoved = ({ taskId, newStatus, task }) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, ...task, status: newStatus } : t))
      );
    };

    const handleTaskCreated = (newTask) => {
      if (selectedProject === 'all' || newTask.project?._id === selectedProject || newTask.project === selectedProject) {
        setTasks((prev) => {
          if (prev.some((t) => t._id === newTask._id)) return prev;
          return [...prev, newTask];
        });
      }
    };

    const handleTaskDeleted = (taskId) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    socket.on('task:moved', handleTaskMoved);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [socket, selectedProject]);

  // Drag and Drop event handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, columnStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const targetTask = tasks.find((t) => t._id === taskId);
    if (!targetTask || targetTask.status === columnStatus) return;

    // Trigger celebratory confetti if moving to completed!
    if (columnStatus === 'completed') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {}
    }

    // 1. Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: columnStatus } : t))
    );

    // 2. Server API sync
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: columnStatus });
      showToast(`Moved to ${columnStatus.replace('_', ' ')}`, 'success', 2000);
    } catch (err) {
      showToast(err.message, 'error');
      fetchBoardData(); // Rollback on error
    } finally {
      setDraggedTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Kanban className="w-6 h-6 text-brand-600" />
            Kanban Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time drag-and-drop task workflow. Changes sync immediately to all connected team members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-slate-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            icon={Plus}
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setDefaultColumnStatus('todo');
              setIsTaskModalOpen(true);
            }}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`bg-slate-100/70 border-t-4 ${col.color} rounded-2xl p-4 min-h-[600px] flex flex-col transition-colors border border-slate-200/60`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-800">{col.label}</h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.countBadge}`}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setDefaultColumnStatus(col.id);
                    setIsTaskModalOpen(true);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                  title={`Add task in ${col.label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium text-center p-4">
                    Drag tasks here
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      onClick={() => {
                        setEditingTask(task);
                        setIsTaskModalOpen(true);
                      }}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-grab active:cursor-grabbing select-none group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant={task.priority} size="sm">
                          {task.priority}
                        </Badge>
                        <span className="text-[11px] font-medium text-slate-400 truncate max-w-[120px]">
                          {task.project?.name || 'Project'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug mb-1.5">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                          {task.description}
                        </p>
                      )}

                      {/* Tags */}
                      {task.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {task.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Due Date & Assignee */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          {task.dueDate ? (
                            <>
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                {new Date(task.dueDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </>
                          ) : (
                            <span>No date</span>
                          )}
                        </div>

                        {task.assignedTo ? (
                          <div
                            title={task.assignedTo.name}
                            className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 font-bold text-[10px] flex items-center justify-center overflow-hidden ring-1 ring-slate-200"
                          >
                            {task.assignedTo.avatar ? (
                              <img src={task.assignedTo.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              task.assignedTo.name?.charAt(0)
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">Unassigned</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          task={editingTask}
          defaultProjectId={selectedProject !== 'all' ? selectedProject : null}
          onSuccess={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
            fetchBoardData();
          }}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
