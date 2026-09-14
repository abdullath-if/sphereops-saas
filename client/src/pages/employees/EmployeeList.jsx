import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        search,
        department: selectedDept,
        role: selectedRole,
        status: selectedStatus,
      });

      const res = await api.get(`/employees?${params.toString()}`);
      setEmployees(res.data.employees || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/departments').then((res) => setDepartments(res.data.departments || []));
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees(1);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedDept, selectedRole, selectedStatus]);

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await api.delete(`/employees/${deleteCandidate._id}`);
      showToast('Employee account removed successfully.', 'success');
      setDeleteCandidate(null);
      fetchEmployees(pagination.page);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage team members, roles, departmental allocations, and credentials.
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingEmployee(null);
              setIsCreateOpen(true);
            }}
          >
            Add Employee
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Try adjusting your search criteria or add a new team member."
          actionLabel={isAdmin ? 'Add New Employee' : undefined}
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 font-bold flex items-center justify-center">
                            {emp.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <Link
                            to={`/employees/${emp._id}`}
                            className="font-bold text-slate-900 hover:text-brand-600 transition-colors block"
                          >
                            {emp.name}
                          </Link>
                          <span className="text-xs text-slate-400">{emp.position}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      {emp.department?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={emp.role} size="sm">
                        {emp.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={emp.status} size="sm">
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.email}</span>
                      </div>
                      {emp.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/employees/${emp._id}`}
                        className="inline-flex p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmployee(emp);
                              setIsCreateOpen(true);
                            }}
                            className="inline-flex p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(emp)}
                            className="inline-flex p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {employees.length} of {pagination.total} employees
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                disabled={pagination.page <= 1}
                onClick={() => fetchEmployees(pagination.page - 1)}
                icon={ChevronLeft}
              >
                Prev
              </Button>
              <span className="font-semibold text-slate-700">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="xs"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchEmployees(pagination.page + 1)}
                icon={ChevronRight}
                iconPosition="right"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isCreateOpen && (
        <EmployeeModal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingEmployee(null);
          }}
          employee={editingEmployee}
          departments={departments}
          onSuccess={() => {
            fetchEmployees(pagination.page);
            setIsCreateOpen(false);
            setEditingEmployee(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteCandidate && (
        <ConfirmDialog
          isOpen={!!deleteCandidate}
          onClose={() => setDeleteCandidate(null)}
          onConfirm={handleDelete}
          title="Delete Employee Account"
          message={`Are you sure you want to delete ${deleteCandidate.name}? All assigned tasks will be unlinked.`}
          confirmText="Delete Account"
        />
      )}
    </div>
  );
};

// Modal Helper Component for Employee Add/Edit
const EmployeeModal = ({ isOpen, onClose, employee, departments, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState('employee');
  const [status, setStatus] = useState('active');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setEmail(employee.email || '');
      setDepartment(employee.department?._id || employee.department || '');
      setPosition(employee.position || '');
      setRole(employee.role || 'employee');
      setStatus(employee.status || 'active');
      setPhone(employee.phone || '');
      setSkills(employee.skills ? employee.skills.join(', ') : '');
    } else {
      setName('');
      setEmail('');
      setPassword('Password123!');
      setDepartment('');
      setPosition('');
      setRole('employee');
      setStatus('active');
      setPhone('');
      setSkills('');
    }
  }, [employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name,
        email,
        department: department || null,
        position,
        role,
        status,
        phone,
        skills: skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };

      if (!employee) {
        payload.password = password || 'Password123!';
        await api.post('/employees', payload);
        showToast('Employee created successfully.', 'success');
      } else {
        await api.put(`/employees/${employee._id}`, payload);
        showToast('Employee updated successfully.', 'success');
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
      title={employee ? 'Edit Employee Details' : 'Add New Employee'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            required
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Work Email"
            type="email"
            required
            placeholder="john@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {!employee && (
          <Input
            label="Initial Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Job Position"
            placeholder="e.g. Senior Frontend Dev"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <Input
            label="Phone"
            placeholder="+1 555-0199"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <Input
          label="Skills (Comma separated)"
          placeholder="e.g. React, Node.js, AWS, UI Design"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {employee ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeList;
