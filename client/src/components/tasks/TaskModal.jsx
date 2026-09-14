import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const TaskModal = ({ isOpen, onClose, task = null, defaultProjectId = null, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState(defaultProjectId || '');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');

  const [projectsList, setProjectsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Load projects and employees for select dropdowns
      api.get('/projects').then((res) => setProjectsList(res.data.projects || []));
      api.get('/employees?limit=100').then((res) => setEmployeesList(res.data.employees || []));

      if (task) {
        setTitle(task.title || '');
        setDescription(task.description || '');
        setProject(task.project?._id || task.project || '');
        setAssignedTo(task.assignedTo?._id || task.assignedTo || '');
        setPriority(task.priority || 'medium');
        setStatus(task.status || 'todo');
        setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
        setTags(task.tags ? task.tags.join(', ') : '');
      } else {
        setTitle('');
        setDescription('');
        setProject(defaultProjectId || '');
        setAssignedTo('');
        setPriority('medium');
        setStatus('todo');
        setDueDate('');
        setTags('');
      }
    }
  }, [isOpen, task, defaultProjectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !project) {
      showToast('Task title and project are required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        project,
        assignedTo: assignedTo || null,
        priority,
        status,
        dueDate: dueDate || null,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      if (task?._id) {
        await api.put(`/tasks/${task._id}`, payload);
        showToast('Task updated successfully.', 'success');
      } else {
        await api.post('/tasks', payload);
        showToast('Task created successfully.', 'success');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Create New Task'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          required
          placeholder="e.g. Implement OAuth login with Google"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Detailed description or acceptance criteria..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select Project</option>
              {projectsList.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Assignee
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Unassigned</option>
              {employeesList.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.position})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <Input
              type="date"
              label="Due Date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <Input
          label="Tags (Comma separated)"
          placeholder="e.g. Backend, Security, Bug"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
