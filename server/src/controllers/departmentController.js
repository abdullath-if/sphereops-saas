const Department = require('../models/Department');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/activityService');

// @desc    Get all departments with employee counts
// @route   GET /api/departments
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .populate('manager', 'name email avatar position')
      .sort('name');

    // Aggregate employee counts per department
    const employeeCounts = await User.aggregate([
      { $match: { department: { $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    employeeCounts.forEach((item) => {
      countMap.set(item._id.toString(), item.count);
    });

    const result = departments.map((dept) => {
      const doc = dept.toObject();
      doc.employeeCount = countMap.get(dept._id.toString()) || 0;
      return doc;
    });

    ApiResponse.send(res, 200, { departments: result }, 'Departments retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single department with its employees
// @route   GET /api/departments/:id
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id).populate(
      'manager',
      'name email avatar position'
    );

    if (!department) {
      throw new ApiError(404, 'Department not found.');
    }

    const employees = await User.find({ department: department._id }).select(
      'name email avatar position role status phone skills'
    );

    ApiResponse.send(
      res,
      200,
      {
        department,
        employees,
        employeeCount: employees.length,
      },
      'Department details retrieved.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Create department (Admin only)
// @route   POST /api/departments
const createDepartment = async (req, res, next) => {
  try {
    const { name, description, manager } = req.body;

    const existing = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      throw new ApiError(400, 'A department with this name already exists.');
    }

    const department = await Department.create({
      name,
      description: description || '',
      manager: manager || null,
    });

    const populated = await Department.findById(department._id).populate('manager', 'name email avatar');

    await logActivity({
      actorId: req.user._id,
      action: 'DEPARTMENT_CREATED',
      entityType: 'department',
      entityId: department._id,
      entityName: department.name,
      description: `${req.user.name} created department '${department.name}'`,
    });

    ApiResponse.send(res, 201, { department: populated }, 'Department created successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Update department (Admin only)
// @route   PUT /api/departments/:id
const updateDepartment = async (req, res, next) => {
  try {
    const { name, description, manager } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department) {
      throw new ApiError(404, 'Department not found.');
    }

    if (name && name !== department.name) {
      const existing = await Department.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: department._id },
      });
      if (existing) {
        throw new ApiError(400, 'A department with this name already exists.');
      }
      department.name = name;
    }

    if (description !== undefined) department.description = description;
    if (manager !== undefined) department.manager = manager || null;

    await department.save();
    const populated = await Department.findById(department._id).populate('manager', 'name email avatar');

    await logActivity({
      actorId: req.user._id,
      action: 'DEPARTMENT_UPDATED',
      entityType: 'department',
      entityId: department._id,
      entityName: department.name,
      description: `${req.user.name} updated department '${department.name}'`,
    });

    ApiResponse.send(res, 200, { department: populated }, 'Department updated successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete department (Admin only)
// @route   DELETE /api/departments/:id
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      throw new ApiError(404, 'Department not found.');
    }

    // Unlink employees from this department
    await User.updateMany({ department: department._id }, { department: null });

    await Department.findByIdAndDelete(department._id);

    await logActivity({
      actorId: req.user._id,
      action: 'DEPARTMENT_DELETED',
      entityType: 'department',
      entityId: department._id,
      entityName: department.name,
      description: `${req.user.name} deleted department '${department.name}'`,
    });

    ApiResponse.send(res, 200, null, 'Department deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
