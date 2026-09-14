const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');
const { getIO } = require('../services/socketService');

// @desc    Get comments for a project or task
// @route   GET /api/comments
const getComments = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.query;

    if (!targetType || !targetId) {
      throw new ApiError(400, 'targetType and targetId are required.');
    }

    const comments = await Comment.find({ targetType, targetId })
      .populate('author', 'name email avatar position role')
      .sort('createdAt');

    ApiResponse.send(res, 200, { comments }, 'Comments retrieved.');
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment
// @route   POST /api/comments
const addComment = async (req, res, next) => {
  try {
    const { targetType, targetId, content, attachments = [] } = req.body;

    if (!content || !content.trim()) {
      throw new ApiError(400, 'Comment content cannot be empty.');
    }

    let entityName = '';
    let notifyTargetUser = null;
    let link = '';

    if (targetType === 'task') {
      const task = await Task.findById(targetId).populate('project');
      if (!task) throw new ApiError(404, 'Task not found.');
      entityName = task.title;
      link = `/projects/${task.project._id}?tab=tasks`;
      // Notify assignee or creator
      if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
        notifyTargetUser = task.assignedTo;
      } else if (task.createdBy.toString() !== req.user._id.toString()) {
        notifyTargetUser = task.createdBy;
      }
    } else if (targetType === 'project') {
      const project = await Project.findById(targetId);
      if (!project) throw new ApiError(404, 'Project not found.');
      entityName = project.name;
      link = `/projects/${project._id}?tab=comments`;
      if (project.manager.toString() !== req.user._id.toString()) {
        notifyTargetUser = project.manager;
      }
    }

    const comment = await Comment.create({
      targetType,
      targetId,
      author: req.user._id,
      content,
      attachments,
    });

    const populated = await Comment.findById(comment._id).populate(
      'author',
      'name email avatar position role'
    );

    await logActivity({
      actorId: req.user._id,
      action: 'COMMENT_ADDED',
      entityType: 'comment',
      entityId: comment._id,
      entityName,
      description: `${req.user.name} commented on ${targetType} '${entityName}'`,
    });

    if (notifyTargetUser) {
      await createNotification({
        recipientId: notifyTargetUser,
        senderId: req.user._id,
        type: 'comment_added',
        title: `New Comment on ${targetType === 'task' ? 'Task' : 'Project'}`,
        message: `${req.user.name}: "${content.length > 50 ? content.substring(0, 50) + '...' : content}"`,
        link,
      });
    }

    // Emit live comment event
    getIO().to(`project:${targetId}`).emit('comment:new', populated);
    getIO().emit('comment:new', populated);

    ApiResponse.send(res, 201, { comment: populated }, 'Comment added.');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      throw new ApiError(404, 'Comment not found.');
    }

    if (req.user.role !== 'admin' && comment.author.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only delete your own comments.');
    }

    await Comment.findByIdAndDelete(comment._id);

    ApiResponse.send(res, 200, null, 'Comment deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComments,
  addComment,
  deleteComment,
};
