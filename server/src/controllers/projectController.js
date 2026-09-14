const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');
const { getIO } = require('../services/socketService');

// Helper to compute progress for an array of projects or a single project
const calculateProjectProgress = async (projects) => {
  const projectIds = projects.map((p) => p._id);
  const taskStats = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    {
      $group: {
        _id: '$project',
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
      },
    },
  ]);

  const statsMap = new Map();
  taskStats.forEach((s) => {
    statsMap.set(s._id.toString(), {
      total: s.totalTasks,
      completed: s.completedTasks,
      progress: s.totalTasks > 0 ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0,
    });
  });

  return projects.map((proj) => {
    const doc = proj.toObject ? proj.toObject() : { ...proj };
    const stat = statsMap.get(doc._id.toString()) || { total: 0, completed: 0, progress: 0 };
    doc.totalTasks = stat.total;
    doc.completedTasks = stat.completed;
    doc.progress = stat.progress;
    return doc;
  });
};

// @desc    Get all projects with search, filter, and calculated progress
// @route   GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const { search, status, priority, manager, myProjects } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { client: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (manager && manager !== 'all') {
      query.manager = manager;
    }

    // Filter projects relevant to current user if employee or explicitly asked
    if (myProjects === 'true' || req.user.role === 'employee') {
      query.$or = [{ manager: req.user._id }, { members: req.user._id }];
    }

    const projects = await Project.find(query)
      .populate('manager', 'name email avatar position')
      .populate('members', 'name email avatar position')
      .sort('-createdAt');

    const projectsWithProgress = await calculateProjectProgress(projects);

    ApiResponse.send(res, 200, { projects: projectsWithProgress }, 'Projects retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:id
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name email avatar position phone department')
      .populate('members', 'name email avatar position phone department');

    if (!project) {
      throw new ApiError(404, 'Project not found.');
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort('order');

    const [withProgress] = await calculateProjectProgress([project]);

    ApiResponse.send(
      res,
      200,
      {
        project: withProgress,
        tasks,
      },
      'Project details retrieved.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Create project (Admin & Manager)
// @route   POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const {
      name,
      description,
      client,
      startDate,
      endDate,
      status = 'planning',
      priority = 'medium',
      manager,
      members = [],
      budget = 0,
      technologies = [],
      image,
    } = req.body;

    // Default manager to creator if not specified
    const projectManager = manager || req.user._id;

    const project = await Project.create({
      name,
      description: description || '',
      client: client || '',
      startDate: startDate || Date.now(),
      endDate: endDate || null,
      status,
      priority,
      manager: projectManager,
      members,
      budget,
      technologies: Array.isArray(technologies) ? technologies : technologies ? technologies.split(',').map((t) => t.trim()) : [],
      image: image || '',
    });

    const populated = await Project.findById(project._id)
      .populate('manager', 'name email avatar position')
      .populate('members', 'name email avatar position');

    await logActivity({
      actorId: req.user._id,
      action: 'PROJECT_CREATED',
      entityType: 'project',
      entityId: project._id,
      entityName: project.name,
      description: `${req.user.name} created project '${project.name}'`,
    });

    // Notify assigned manager and members
    if (projectManager.toString() !== req.user._id.toString()) {
      await createNotification({
        recipientId: projectManager,
        senderId: req.user._id,
        type: 'project_added',
        title: 'Assigned as Project Manager',
        message: `You were assigned as manager for project '${project.name}'.`,
        link: `/projects/${project._id}`,
      });
    }

    for (const memberId of members) {
      if (memberId.toString() !== req.user._id.toString()) {
        await createNotification({
          recipientId: memberId,
          senderId: req.user._id,
          type: 'project_added',
          title: 'Added to Project',
          message: `You were added to project '${project.name}'.`,
          link: `/projects/${project._id}`,
        });
      }
    }

    // Broadcast project creation via socket
    getIO().emit('project:created', populated);

    ApiResponse.send(res, 201, { project: populated }, 'Project created successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      throw new ApiError(404, 'Project not found.');
    }

    // Check permission: Admin or Project Manager
    if (req.user.role !== 'admin' && project.manager.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Only administrators or the assigned project manager can update this project.');
    }

    const {
      name,
      description,
      client,
      startDate,
      endDate,
      status,
      priority,
      manager,
      members,
      budget,
      technologies,
      image,
    } = req.body;

    const oldStatus = project.status;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (client !== undefined) project.client = client;
    if (startDate) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (status) project.status = status;
    if (priority) project.priority = priority;
    if (manager && (req.user.role === 'admin' || project.manager.toString() === req.user._id.toString())) {
      project.manager = manager;
    }
    if (members) project.members = members;
    if (budget !== undefined) project.budget = budget;
    if (technologies) {
      project.technologies = Array.isArray(technologies) ? technologies : technologies.split(',').map((t) => t.trim());
    }
    if (image !== undefined) project.image = image;

    await project.save();

    const populated = await Project.findById(project._id)
      .populate('manager', 'name email avatar position')
      .populate('members', 'name email avatar position');

    await logActivity({
      actorId: req.user._id,
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: project._id,
      entityName: project.name,
      description: `${req.user.name} updated project '${project.name}'`,
    });

    // Notify on status change
    if (status && status !== oldStatus) {
      const allParticipants = [...new Set([project.manager.toString(), ...project.members.map((m) => m.toString())])];
      for (const participantId of allParticipants) {
        if (participantId !== req.user._id.toString()) {
          await createNotification({
            recipientId: participantId,
            senderId: req.user._id,
            type: 'project_status',
            title: 'Project Status Changed',
            message: `Project '${project.name}' status changed to ${status.replace('_', ' ')}.`,
            link: `/projects/${project._id}`,
          });
        }
      }
    }

    getIO().to(`project:${project._id}`).emit('project:updated', populated);

    ApiResponse.send(res, 200, { project: populated }, 'Project updated successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project (Admin & Project Manager)
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      throw new ApiError(404, 'Project not found.');
    }

    if (req.user.role !== 'admin' && project.manager.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Only administrators or the assigned project manager can delete this project.');
    }

    // Delete associated tasks
    await Task.deleteMany({ project: project._id });

    await Project.findByIdAndDelete(project._id);

    await logActivity({
      actorId: req.user._id,
      action: 'PROJECT_DELETED',
      entityType: 'project',
      entityId: project._id,
      entityName: project.name,
      description: `${req.user.name} deleted project '${project.name}'`,
    });

    getIO().emit('project:deleted', project._id);

    ApiResponse.send(res, 200, null, 'Project and associated tasks deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
