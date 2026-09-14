const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/activityService');

// @desc    Get all employees with search, filter, and pagination
// @route   GET /api/employees
const getEmployees = async (req, res, next) => {
  try {
    const { search, department, role, status, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by department
    if (department && department !== 'all') {
      query.department = department;
    }

    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [employees, total] = await Promise.all([
      User.find(query)
        .populate('department', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    ApiResponse.send(
      res,
      200,
      {
        employees,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      'Employees retrieved successfully.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee details with productivity metrics
// @route   GET /api/employees/:id
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id).populate('department', 'name');

    if (!employee) {
      throw new ApiError(404, 'Employee not found.');
    }

    // Fetch projects where employee is manager or member
    const projects = await Project.find({
      $or: [{ manager: employee._id }, { members: employee._id }],
    }).populate('manager', 'name email avatar');

    // Fetch tasks assigned to employee
    const tasks = await Task.find({ assignedTo: employee._id })
      .populate('project', 'name status')
      .sort('-createdAt');

    // Calculate task metrics
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const pendingTasks = tasks.filter((t) => t.status !== 'completed');
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()
    );

    // Fetch recent activity
    const recentActivity = await ActivityLog.find({ actor: employee._id })
      .sort('-createdAt')
      .limit(10);

    ApiResponse.send(
      res,
      200,
      {
        employee,
        metrics: {
          totalProjects: projects.length,
          totalTasks: tasks.length,
          completedCount: completedTasks.length,
          pendingCount: pendingTasks.length,
          overdueCount: overdueTasks.length,
          completionRate:
            tasks.length > 0
              ? Math.round((completedTasks.length / tasks.length) * 100)
              : 0,
        },
        projects,
        tasks,
        recentActivity,
      },
      'Employee profile retrieved successfully.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Create an employee (Admin only)
// @route   POST /api/employees
const createEmployee = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'employee',
      department,
      position,
      phone,
      skills,
      status = 'active',
      joiningDate,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(400, 'A user with this email address already exists.');
    }

    const employee = await User.create({
      name,
      email,
      password: password || 'Welcome@123',
      role,
      department: department || null,
      position: position || 'Team Member',
      phone: phone || '',
      skills: Array.isArray(skills) ? skills : skills ? skills.split(',').map((s) => s.trim()) : [],
      status,
      joiningDate: joiningDate || Date.now(),
    });

    const populated = await User.findById(employee._id).populate('department', 'name');

    await logActivity({
      actorId: req.user._id,
      action: 'EMPLOYEE_CREATED',
      entityType: 'user',
      entityId: employee._id,
      entityName: employee.name,
      description: `${req.user.name} created employee record for ${employee.name} (${employee.role})`,
    });

    ApiResponse.send(res, 201, { employee: populated }, 'Employee created successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee details
// @route   PUT /api/employees/:id
const updateEmployee = async (req, res, next) => {
  try {
    const { name, email, role, department, position, phone, skills, status, joiningDate } = req.body;

    const employee = await User.findById(req.params.id);
    if (!employee) {
      throw new ApiError(404, 'Employee not found.');
    }

    // Role-based restrictions: Only admin can change role, status, or department
    if (req.user.role !== 'admin' && req.user._id.toString() !== employee._id.toString()) {
      throw new ApiError(403, 'You do not have permission to update this employee.');
    }

    if (name) employee.name = name;
    if (email && email !== employee.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: employee._id } });
      if (emailExists) throw new ApiError(400, 'Email is already taken by another account.');
      employee.email = email;
    }

    if (phone !== undefined) employee.phone = phone;
    if (position) employee.position = position;
    if (skills) employee.skills = Array.isArray(skills) ? skills : skills.split(',').map((s) => s.trim());
    if (joiningDate) employee.joiningDate = joiningDate;

    // Admin-only updates
    if (req.user.role === 'admin') {
      if (role) employee.role = role;
      if (department !== undefined) employee.department = department || null;
      if (status) employee.status = status;
    }

    await employee.save();
    const updated = await User.findById(employee._id).populate('department', 'name');

    await logActivity({
      actorId: req.user._id,
      action: 'EMPLOYEE_UPDATED',
      entityType: 'user',
      entityId: employee._id,
      entityName: employee.name,
      description: `${req.user.name} updated employee details for ${employee.name}`,
    });

    ApiResponse.send(res, 200, { employee: updated }, 'Employee updated successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete employee (Admin only)
// @route   DELETE /api/employees/:id
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      throw new ApiError(404, 'Employee not found.');
    }

    if (employee._id.toString() === req.user._id.toString()) {
      throw new ApiError(400, 'You cannot delete your own account.');
    }

    // Clean up task assignments
    await Task.updateMany({ assignedTo: employee._id }, { assignedTo: null });
    // Remove from projects
    await Project.updateMany({ members: employee._id }, { $pull: { members: employee._id } });

    await User.findByIdAndDelete(employee._id);

    await logActivity({
      actorId: req.user._id,
      action: 'EMPLOYEE_DELETED',
      entityType: 'user',
      entityId: employee._id,
      entityName: employee.name,
      description: `${req.user.name} removed employee account for ${employee.name}`,
    });

    ApiResponse.send(res, 200, null, 'Employee deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
