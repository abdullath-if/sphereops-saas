import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const ProjectModal = ({ isOpen, onClose, project = null, onSuccess }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('planning');
  const [priority, setPriority] = useState('medium');
  const [manager, setManager] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [budget, setBudget] = useState('');
  const [technologies, setTechnologies] = useState('');

  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      api.get('/employees?limit=100').then((res) => {
        setEmployeesList(res.data.employees || []);
      });

      if (project) {
        setName(project.name || '');
        setDescription(project.description || '');
        setClient(project.client || '');
        setStartDate(project.startDate ? project.startDate.split('T')[0] : '');
        setEndDate(project.endDate ? project.endDate.split('T')[0] : '');
        setStatus(project.status || 'planning');
        setPriority(project.priority || 'medium');
        setManager(project.manager?._id || project.manager || user?._id || '');
        setSelectedMembers(
          project.members ? project.members.map((m) => m._id || m) : []
        );
        setBudget(project.budget || '');
        setTechnologies(project.technologies ? project.technologies.join(', ') : '');
      } else {
        setName('');
        setDescription('');
        setClient('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setStatus('planning');
        setPriority('medium');
        setManager(user?._id || '');
        setSelectedMembers([]);
        setBudget('');
        setTechnologies('');
      }
    }
  }, [isOpen, project, user?._id]);

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Project name is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        description,
        client,
        startDate: startDate || null,
        endDate: endDate || null,
        status,
        priority,
        manager: manager || user._id,
        members: selectedMembers,
        budget: Number(budget) || 0,
        technologies: technologies
          ? technologies.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (project?._id) {
        await api.put(`/projects/${project._id}`, payload);
        showToast('Project updated successfully.', 'success');
      } else {
        await api.post('/projects', payload);
        showToast('Project created successfully.', 'success');
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
      title={project ? 'Edit Project' : 'Create New Project'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Project Name"
            required
            placeholder="e.g. Enterprise Cloud Migration"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Client / Company"
            placeholder="e.g. OmniCorp Global"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Project vision, core deliverables, and scope..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            label="Target End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

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

          <Input
            type="number"
            label="Budget (USD $)"
            placeholder="50000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Project Manager <span className="text-rose-500">*</span>
          </label>
          <select
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select Manager</option>
            {employeesList.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.position} - {emp.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Assign Team Members
          </label>
          <div className="border border-slate-200 rounded-lg p-3 max-h-36 overflow-y-auto space-y-1.5 bg-slate-50/50">
            {employeesList.map((emp) => (
              <label
                key={emp._id}
                className="flex items-center gap-2.5 p-1.5 hover:bg-white rounded cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(emp._id)}
                  onChange={() => toggleMember(emp._id)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-800">{emp.name}</span>
                <span className="text-[11px] text-slate-500">({emp.position})</span>
              </label>
            ))}
          </div>
        </div>

        <Input
          label="Technologies / Stack (Comma separated)"
          placeholder="e.g. React, Node.js, AWS, Docker"
          value={technologies}
          onChange={(e) => setTechnologies(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {project ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectModal;
