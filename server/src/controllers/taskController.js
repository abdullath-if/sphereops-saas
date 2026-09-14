const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');
const { getIO } = require('../services/socketService');

// @desc    Get tasks with filtering, search, and ordering
// @route   GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const { project, assignedTo, status, priority, search, myTasks } = req.query;

    const query = {};

    if (project && project !== 'all') {
      query.project = project;
    }

    if (assignedTo && assignedTo !== 'all') {
      query.assignedTo = assignedTo;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Filter to only current user's tasks if employee or flag provided
    if (myTasks === 'true' || (req.user.role === 'employee' && !project)) {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('project', 'name status priority')
      .populate('assignedTo', 'name email avatar position')
      .populate('createdBy', 'name email avatar position')
      .populate('attachments')
      .sort('order -createdAt');

    ApiResponse.send(res, 200, { tasks }, 'Tasks retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name status priority manager members')
      .populate('assignedTo', 'name email avatar position phone department')
      .populate('createdBy', 'name email avatar position')
      .populate('attachments');

    if (!task) {
      throw new ApiError(404, 'Task not found.');
    }

    ApiResponse.send(res, 200, { task }, 'Task retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Create task
// @route   POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      project: projectId,
      assignedTo,
      priority = 'medium',
      status = 'todo',
      dueDate,
      tags = [],
      attachments = [],
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Referenced project does not exist.');
    }

    // Role check: Admin, Project Manager, or project member
    if (
      req.user.role === 'employee' &&
      !project.members.map((m) => m.toString()).includes(req.user._id.toString())
    ) {
      throw new ApiError(403, 'You are not authorized to create tasks in this project.');
    }

    // Calculate highest order in column
    const highestOrder = await Task.findOne({ project: projectId, status })
      .sort('-order')
      .select('order');
    const order = highestOrder ? highestOrder.order + 1 : 0;

    const task = await Task.create({
      title,
      description: description || '',
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority,
      status,
      dueDate: dueDate || null,
      tags: Array.isArray(tags) ? tags : tags ? tags.split(',').map((t) => t.trim()) : [],
      order,
      attachments,
    });

    const populated = await Task.findById(task._id)
      .populate('project', 'name status priority')
      .populate('assignedTo', 'name email avatar position')
      .populate('createdBy', 'name email avatar position')
      .populate('attachments');

    await logActivity({
      actorId: req.user._id,
      action: 'TASK_CREATED',
      entityType: 'task',
      entityId: task._id,
      entityName: task.title,
      description: `${req.user.name} created task '${task.title}' in project '${project.name}'`,
    });

    // Notify assigned employee
    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      await createNotification({
        recipientId: assignedTo,
        senderId: req.user._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you task '${task.title}' in '${project.name}'.`,
        link: `/projects/${projectId}?tab=tasks`,
      });
    }

    // Broadcast via Socket.IO
    getIO().to(`project:${projectId}`).emit('task:created', populated);
    getIO().emit('task:created', populated);

    ApiResponse.send(res, 201, { task: populated }, 'Task created successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      throw new ApiError(404, 'Task not found.');
    }

    const {
      title,
      description,
      assignedTo,
      priority,
      status,
      dueDate,
      tags,
      order,
      attachments,
    } = req.body;

    const oldStatus = task.status;
    const oldAssignee = task.assignedTo ? task.assignedTo.toString() : null;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (tags) {
      task.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    }
    if (order !== undefined) task.order = order;
    if (attachments) task.attachments = attachments;

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('project', 'name status priority')
      .populate('assignedTo', 'name email avatar position')
      .populate('createdBy', 'name email avatar position')
      .populate('attachments');

    // Notify if newly assigned
    if (assignedTo && assignedTo.toString() !== oldAssignee && assignedTo.toString() !== req.user._id.toString()) {
      await createNotification({
        recipientId: assignedTo,
        senderId: req.user._id,
        type: 'task_assigned',
        title: 'Task Assigned To You',
        message: `${req.user.name} assigned you task '${task.title}'.`,
        link: `/projects/${task.project._id}?tab=tasks`,
      });
    }

    // Notify if completed
    if (status === 'completed' && oldStatus !== 'completed') {
      await logActivity({
        actorId: req.user._id,
        action: 'TASK_COMPLETED',
        entityType: 'task',
        entityId: task._id,
        entityName: task.title,
        description: `${req.user.name} marked task '${task.title}' as Completed`,
      });

      if (task.createdBy.toString() !== req.user._id.toString()) {
        await createNotification({
          recipientId: task.createdBy,
          senderId: req.user._id,
          type: 'task_completed',
          title: 'Task Completed',
          message: `${req.user.name} completed task '${task.title}'.`,
          link: `/projects/${task.project._id}?tab=tasks`,
        });
      }
    } else {
      await logActivity({
        actorId: req.user._id,
        action: 'TASK_UPDATED',
        entityType: 'task',
        entityId: task._id,
        entityName: task.title,
        description: `${req.user.name} updated task '${task.title}'`,
      });
    }

    getIO().to(`project:${task.project._id}`).emit('task:updated', populated);
    getIO().emit('task:updated', populated);

    ApiResponse.send(res, 200, { task: populated }, 'Task updated successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status & order (Optimized for Kanban Drag and Drop)
// @route   PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, order } = req.body;
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      throw new ApiError(404, 'Task not found.');
    }

    const previousStatus = task.status;
    task.status = status;
    if (order !== undefined) task.order = order;

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('project', 'name status priority')
      .populate('assignedTo', 'name email avatar position')
      .populate('createdBy', 'name email avatar position');

    const formattedOld = previousStatus.replace('_', ' ');
    const formattedNew = status.replace('_', ' ');

    await logActivity({
      actorId: req.user._id,
      action: 'TASK_STATUS_CHANGED',
      entityType: 'task',
      entityId: task._id,
      entityName: task.title,
      description: `${req.user.name} moved task '${task.title}' from ${formattedOld} to ${formattedNew}`,
    });

    if (status === 'completed' && previousStatus !== 'completed') {
      if (task.createdBy.toString() !== req.user._id.toString()) {
        await createNotification({
          recipientId: task.createdBy,
          senderId: req.user._id,
          type: 'task_completed',
          title: 'Task Completed',
          message: `${req.user.name} completed task '${task.title}'.`,
          link: `/projects/${task.project._id}?tab=tasks`,
        });
      }
    }

    // Broadcast immediate real-time update to all listeners
    getIO().to(`project:${task.project._id}`).emit('task:moved', {
      taskId: task._id,
      task: populated,
      newStatus: status,
      newOrder: order,
    });
    getIO().emit('task:moved', {
      taskId: task._id,
      task: populated,
      newStatus: status,
      newOrder: order,
    });

    ApiResponse.send(res, 200, { task: populated }, 'Task status updated.');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      throw new ApiError(404, 'Task not found.');
    }

    // Role check: Admin, Manager of project, or Task creator
    const isManager = task.project && task.project.manager && task.project.manager.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (req.user.role !== 'admin' && !isManager && !isCreator) {
      throw new ApiError(403, 'You are not authorized to delete this task.');
    }

    await Task.findByIdAndDelete(task._id);

    await logActivity({
      actorId: req.user._id,
      action: 'TASK_DELETED',
      entityType: 'task',
      entityId: task._id,
      entityName: task.title,
      description: `${req.user.name} deleted task '${task.title}'`,
    });

    getIO().to(`project:${task.project._id}`).emit('task:deleted', task._id);
    getIO().emit('task:deleted', task._id);

    ApiResponse.send(res, 200, null, 'Task deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
