import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  Users,
  FileText,
  Activity,
  MessageSquare,
  Calendar,
  DollarSign,
  Plus,
  Upload,
  Download,
  Trash2,
  Send,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import TaskModal from '../../components/tasks/TaskModal';
import ProjectModal from '../../components/projects/ProjectModal';
import { CardSkeleton, TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const ProjectDetail = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [comments, setComments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & form state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const { user, isManager } = useAuth();
  const { socket, joinProject, leaveProject } = useSocket();
  const { showToast } = useToast();

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.project);
      setTasks(res.data.tasks || []);

      // Concurrently load files, comments, activity
      const [filesRes, commentsRes, activityRes] = await Promise.all([
        api.get(`/files?entityType=project&entityId=${id}`),
        api.get(`/comments?targetType=project&targetId=${id}`),
        api.get(`/activity-logs?entityType=project&limit=30`),
      ]);

      setFiles(filesRes.data.files || []);
      setComments(commentsRes.data.comments || []);
      setActivityLogs(
        (activityRes.data.logs || []).filter((l) => l.entityId === id || l.entityName === res.data.project.name)
      );
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
    joinProject(id);

    return () => {
      leaveProject(id);
    };
  }, [id]);

  // Real-time socket events for comments and tasks
  useEffect(() => {
    if (!socket) return;

    const handleComment = (comment) => {
      if (comment.targetId === id) {
        setComments((prev) => [...prev, comment]);
      }
    };

    const handleTaskMoved = ({ task }) => {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    };

    const handleTaskCreated = (task) => {
      if (task.project?._id === id || task.project === id) {
        setTasks((prev) => [...prev, task]);
      }
    };

    socket.on('comment:new', handleComment);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:created', handleTaskCreated);

    return () => {
      socket.off('comment:new', handleComment);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:created', handleTaskCreated);
    };
  }, [socket, id]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post('/comments', {
        targetType: 'project',
        targetId: id,
        content: newComment,
      });
      setNewComment('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'project');
    formData.append('entityId', id);

    setUploadingFile(true);
    try {
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFiles((prev) => [res.data.file, ...prev]);
      showToast('File attached successfully.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await api.delete(`/files/${fileId}`);
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      showToast('File removed.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Project not found"
        description="The project you requested does not exist or has been deleted."
      />
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderKanban },
    { id: 'tasks', label: `Tasks (${tasks.length})`, icon: CheckSquare },
    { id: 'team', label: `Team (${project.members?.length || 0})`, icon: Users },
    { id: 'files', label: `Files (${files.length})`, icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'comments', label: `Comments (${comments.length})`, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        {isManager && (
          <Button
            size="xs"
            variant="outline"
            icon={Edit}
            onClick={() => setIsEditProjectOpen(true)}
          >
            Edit Project
          </Button>
        )}
      </div>

      {/* Project Banner Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
              <Badge variant={project.status} size="sm">
                {project.status}
              </Badge>
              <Badge variant={project.priority} size="sm">
                {project.priority}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-medium">Client: {project.client || 'Internal'}</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                {new Date(project.startDate).toLocaleDateString()} -{' '}
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>
            {project.budget > 0 && (
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-slate-800">${project.budget.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6 mt-6 overflow-x-auto text-xs font-semibold">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`pb-3.5 flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Project Scope & Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {project.description || 'No description entered for this project.'}
              </p>

              {project.technologies?.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Technologies & Architecture
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((t, i) => (
                      <span
                        key={i}
                        className="text-xs font-semibold bg-brand-50 text-brand-700 px-3 py-1 rounded-lg"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Task Summary */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Task Completion</h3>
                <Link to="/kanban" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Open Kanban Board
                </Link>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-2">
                <div
                  className="bg-brand-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{project.progress || 0}% completed</span>
                <span>
                  {project.completedTasks || 0} of {project.totalTasks || 0} tasks done
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Manager & Core Team */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Project Manager
              </span>
              <div className="flex items-center gap-3">
                {project.manager?.avatar ? (
                  <img
                    src={project.manager.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 font-bold flex items-center justify-center">
                    {project.manager?.name?.charAt(0) || 'M'}
                  </div>
                )}
                <div>
                  <span className="text-sm font-bold text-slate-900 block">{project.manager?.name}</span>
                  <span className="text-xs text-slate-500">{project.manager?.position}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Team Members ({project.members?.length || 0})
                </span>
                <button
                  onClick={() => setSearchParams({ tab: 'team' })}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {project.members?.slice(0, 5).map((member) => (
                  <div key={member._id} className="flex items-center gap-3">
                    {member.avatar ? (
                      <img src={member.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {member.name?.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {member.name}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate block">
                        {member.position}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Project Tasks</h3>
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            >
              Add Task
            </Button>
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks in this project"
              description="Create tasks to organize work and assign them to team members."
              actionLabel="Create First Task"
              onAction={() => setIsTaskModalOpen(true)}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-slate-900 block">{task.title}</span>
                    <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={task.status} size="sm">
                      {task.status}
                    </Badge>
                    <Badge variant={task.priority} size="sm">
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                      {task.assignedTo?.name || 'Unassigned'}
                    </span>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setEditingTask(task);
                        setIsTaskModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Team */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {project.members?.map((m) => (
            <div
              key={m._id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4"
            >
              {m.avatar ? (
                <img src={m.avatar} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 font-extrabold text-base flex items-center justify-center">
                  {m.name.charAt(0)}
                </div>
              )}
              <div>
                <Link
                  to={`/employees/${m._id}`}
                  className="text-sm font-bold text-slate-900 hover:text-brand-600 block"
                >
                  {m.name}
                </Link>
                <span className="text-xs text-slate-500 block">{m.position}</span>
                <span className="text-[11px] text-slate-400 block mt-1">{m.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: Files */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Project Documents & Assets</h3>
            <label className="cursor-pointer">
              <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploadingFile} />
              <Button size="sm" variant="primary" icon={Upload} loading={uploadingFile}>
                Upload File
              </Button>
            </label>
          </div>

          {files.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No files uploaded"
              description="Upload specifications, designs, or documentation related to this project."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {files.map((file) => (
                <div key={file._id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {file.originalName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB • Uploaded by {file.uploader?.name || 'User'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={file.path}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Download File"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Delete File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Activity */}
      {activeTab === 'activity' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 mb-4">Project Audit History</h3>
          {activityLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No activity history recorded.</p>
          ) : (
            <div className="space-y-4">
              {activityLogs.map((log) => (
                <div key={log._id} className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center flex-shrink-0">
                    {log.actor?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 leading-snug">
                      <span className="font-semibold">{log.actor?.name || 'User'}: </span>
                      {log.description}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Comments */}
      {activeTab === 'comments' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900">Project Discussion</h3>

          {/* Comment input */}
          <form onSubmit={handlePostComment} className="flex gap-3">
            <input
              type="text"
              placeholder="Add your comment or update for the team..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button type="submit" variant="primary" icon={Send} disabled={!newComment.trim()}>
              Post
            </Button>
          </form>

          {/* Comments List */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No comments yet. Start the conversation!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="flex items-start gap-3">
                  {comment.author?.avatar ? (
                    <img
                      src={comment.author.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {comment.author?.name?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div className="flex-1 bg-slate-50 p-3.5 rounded-2xl rounded-tl-none border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">
                        {comment.author?.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          defaultProjectId={id}
          task={editingTask}
          onSuccess={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
            fetchProjectData();
          }}
        />
      )}

      {/* Project Edit Modal */}
      {isEditProjectOpen && (
        <ProjectModal
          isOpen={isEditProjectOpen}
          onClose={() => setIsEditProjectOpen(false)}
          project={project}
          onSuccess={() => {
            setIsEditProjectOpen(false);
            fetchProjectData();
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
