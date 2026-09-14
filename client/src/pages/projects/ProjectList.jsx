import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ProjectModal from '../../components/projects/ProjectModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const ProjectList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const { isManager } = useAuth();
  const { showToast } = useToast();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);
      if (priority !== 'all') params.append('priority', priority);

      const res = await api.get(`/projects?${params.toString()}`);
      setProjects(res.data.projects || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, status, priority]);

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await api.delete(`/projects/${deleteCandidate._id}`);
      showToast('Project deleted successfully.', 'success');
      setDeleteCandidate(null);
      fetchProjects();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor deliverables, velocity, milestones, and client accounts.
          </p>
        </div>
        {isManager && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingProject(null);
              setIsCreateOpen(true);
            }}
          >
            New Project
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
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

      {/* Project Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Create your first project or modify search terms."
          actionLabel={isManager ? 'Create New Project' : undefined}
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant={proj.status} size="sm">
                    {proj.status}
                  </Badge>
                  <Badge variant={proj.priority} size="sm">
                    {proj.priority}
                  </Badge>
                </div>

                <Link
                  to={`/projects/${proj._id}`}
                  className="block font-bold text-base text-slate-900 hover:text-brand-600 transition-colors tracking-tight mb-1"
                >
                  {proj.name}
                </Link>

                <p className="text-xs text-slate-400 font-medium mb-3">
                  Client: {proj.client || 'Internal Product'}
                </p>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {proj.description || 'No description provided.'}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Completion</span>
                    <span className="font-bold text-brand-600">{proj.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${proj.progress || 0}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{proj.completedTasks || 0} completed</span>
                    <span>{proj.totalTasks || 0} total tasks</span>
                  </div>
                </div>

                {/* Tech Stack Badges */}
                {proj.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {proj.technologies.slice(0, 3).map((tech, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                      >
                        {tech}
                      </span>
                    ))}
                    {proj.technologies.length > 3 && (
                      <span className="text-[10px] font-semibold text-slate-400 px-1 py-0.5">
                        +{proj.technologies.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center -space-x-2 overflow-hidden">
                  {proj.members?.slice(0, 4).map((member, i) => (
                    <div
                      key={member._id || i}
                      title={member.name}
                      className="w-7 h-7 rounded-full ring-2 ring-white bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center overflow-hidden"
                    >
                      {member.avatar ? (
                        <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        member.name?.charAt(0)
                      )}
                    </div>
                  ))}
                  {proj.members?.length > 4 && (
                    <div className="w-7 h-7 rounded-full ring-2 ring-white bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                      +{proj.members.length - 4}
                    </div>
                  )}
                </div>

                <Link
                  to={`/projects/${proj._id}`}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                >
                  Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isCreateOpen && (
        <ProjectModal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingProject(null);
          }}
          project={editingProject}
          onSuccess={() => {
            setIsCreateOpen(false);
            setEditingProject(null);
            fetchProjects();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteCandidate && (
        <ConfirmDialog
          isOpen={!!deleteCandidate}
          onClose={() => setDeleteCandidate(null)}
          onConfirm={handleDelete}
          title="Delete Project"
          message={`Are you sure you want to delete ${deleteCandidate.name}? All tasks associated with this project will be deleted.`}
        />
      )}
    </div>
  );
};

export default ProjectList;
