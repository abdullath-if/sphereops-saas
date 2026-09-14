import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const [viewingDeptEmployees, setViewingDeptEmployees] = useState(null);

  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      setDepartments(res.data.departments || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    api.get('/employees?limit=100').then((res) => setEmployees(res.data.employees || []));
  }, []);

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await api.delete(`/departments/${deleteCandidate._id}`);
      showToast('Department removed successfully.', 'success');
      setDeleteCandidate(null);
      fetchDepartments();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenDepartmentDetail = async (dept) => {
    try {
      const res = await api.get(`/departments/${dept._id}`);
      setViewingDeptEmployees(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Departments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organizational structure, department leads, and workforce headcounts.
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingDept(null);
              setIsModalOpen(true);
            }}
          >
            New Department
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description="Create your first department to organize team members."
          actionLabel={isAdmin ? 'Create Department' : undefined}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDept(dept);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded"
                        title="Edit Department"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(dept)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                        title="Delete Department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {dept.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">
                    {dept.employeeCount || 0} Employees
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenDepartmentDetail(dept)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                >
                  View Team <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <DepartmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDept(null);
          }}
          department={editingDept}
          employees={employees}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingDept(null);
            fetchDepartments();
          }}
        />
      )}

      {/* Department Team Members Detail Modal */}
      {viewingDeptEmployees && (
        <Modal
          isOpen={!!viewingDeptEmployees}
          onClose={() => setViewingDeptEmployees(null)}
          title={`${viewingDeptEmployees.department?.name} Department Team (${viewingDeptEmployees.employeeCount})`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {viewingDeptEmployees.employees?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No employees currently assigned to this department.
              </p>
            ) : (
              viewingDeptEmployees.employees?.map((emp) => (
                <div
                  key={emp._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    {emp.avatar ? (
                      <img src={emp.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center">
                        {emp.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{emp.name}</span>
                      <span className="text-[11px] text-slate-500">{emp.position}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{emp.email}</span>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteCandidate && (
        <ConfirmDialog
          isOpen={!!deleteCandidate}
          onClose={() => setDeleteCandidate(null)}
          onConfirm={handleDelete}
          title="Delete Department"
          message={`Are you sure you want to delete ${deleteCandidate.name}? All department members will be unassigned.`}
        />
      )}
    </div>
  );
};

const DepartmentModal = ({ isOpen, onClose, department, employees, onSuccess }) => {
  const [name, setName] = useState(department?.name || '');
  const [description, setDescription] = useState(department?.description || '');
  const [manager, setManager] = useState(department?.manager?._id || department?.manager || '');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Department name is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = { name, description, manager: manager || null };
      if (department) {
        await api.put(`/departments/${department._id}`, payload);
        showToast('Department updated successfully.', 'success');
      } else {
        await api.post('/departments', payload);
        showToast('Department created successfully.', 'success');
      }
      onSuccess();
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
      title={department ? 'Edit Department' : 'Create Department'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Department Name"
          required
          placeholder="e.g. Engineering, Marketing, Design"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Department scope and objectives..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Department Manager
          </label>
          <select
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Unassigned</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.position})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {department ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DepartmentList;
