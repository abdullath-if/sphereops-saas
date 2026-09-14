const Message = require('../models/Message');
const User = require('../models/User');
const Project = require('../models/Project');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { getIO } = require('../services/socketService');
const { createNotification } = require('../services/notificationService');

// @desc    Get all conversations for the current user
// @route   GET /api/messages/conversations
const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Get all projects the user is in
    const projects = await Project.find({
      $or: [{ manager: currentUserId }, { members: currentUserId }],
    }).select('name status priority');

    // Get all team members excluding current user
    const users = await User.find({
      _id: { $ne: currentUserId },
      status: 'active',
    }).select('name email avatar position role department');

    // Get latest message for each direct contact
    const directConversations = await Promise.all(
      users.map(async (contact) => {
        const lastMsg = await Message.findOne({
          conversationType: 'direct',
          $or: [
            { sender: currentUserId, recipient: contact._id },
            { sender: contact._id, recipient: currentUserId },
          ],
        }).sort('-createdAt');

        const unreadCount = await Message.countDocuments({
          conversationType: 'direct',
          sender: contact._id,
          recipient: currentUserId,
          readBy: { $ne: currentUserId },
        });

        return {
          type: 'direct',
          id: contact._id,
          user: contact,
          lastMessage: lastMsg,
          unreadCount,
        };
      })
    );

    // Get latest message for each project channel
    const projectConversations = await Promise.all(
      projects.map(async (proj) => {
        const lastMsg = await Message.findOne({
          conversationType: 'project',
          project: proj._id,
        })
          .populate('sender', 'name')
          .sort('-createdAt');

        const unreadCount = await Message.countDocuments({
          conversationType: 'project',
          project: proj._id,
          sender: { $ne: currentUserId },
          readBy: { $ne: currentUserId },
        });

        return {
          type: 'project',
          id: proj._id,
          project: proj,
          lastMessage: lastMsg,
          unreadCount,
        };
      })
    );

    ApiResponse.send(
      res,
      200,
      {
        direct: directConversations,
        channels: projectConversations,
      },
      'Conversations retrieved.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages
const getMessages = async (req, res, next) => {
  try {
    const { type, targetId, limit = 50 } = req.query;
    const currentUserId = req.user._id;

    if (!type || !targetId) {
      throw new ApiError(400, 'type and targetId are required.');
    }

    let query = {};
    let roomKey = '';

    if (type === 'direct') {
      query = {
        conversationType: 'direct',
        $or: [
          { sender: currentUserId, recipient: targetId },
          { sender: targetId, recipient: currentUserId },
        ],
      };
      const sortedIds = [currentUserId.toString(), targetId.toString()].sort();
      roomKey = `direct:${sortedIds[0]}_${sortedIds[1]}`;
    } else if (type === 'project') {
      query = {
        conversationType: 'project',
        project: targetId,
      };
      roomKey = `project:${targetId}`;
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar position role')
      .sort('createdAt')
      .limit(parseInt(limit, 10));

    // Mark retrieved messages as read by current user
    await Message.updateMany(
      { ...query, readBy: { $ne: currentUserId } },
      { $addToSet: { readBy: currentUserId } }
    );

    ApiResponse.send(res, 200, { messages, roomKey }, 'Messages retrieved.');
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/messages
const sendMessage = async (req, res, next) => {
  try {
    const { conversationType, recipient, project, content, attachments = [] } = req.body;
    const currentUserId = req.user._id;

    if (!content || !content.trim()) {
      throw new ApiError(400, 'Message content cannot be empty.');
    }

    const message = await Message.create({
      conversationType,
      sender: currentUserId,
      recipient: conversationType === 'direct' ? recipient : null,
      project: conversationType === 'project' ? project : null,
      content,
      attachments,
      readBy: [currentUserId],
    });

    const populated = await Message.findById(message._id).populate(
      'sender',
      'name email avatar position role'
    );

    const io = getIO();

    if (conversationType === 'direct') {
      const sortedIds = [currentUserId.toString(), recipient.toString()].sort();
      const roomKey = `direct:${sortedIds[0]}_${sortedIds[1]}`;

      // Emit to direct chat room
      io.to(`chat:${roomKey}`).emit('message:receive', populated);
      // Emit notification to recipient's individual user room
      io.to(`user:${recipient}`).emit('message:direct', populated);

      // Create system notification
      await createNotification({
        recipientId: recipient,
        senderId: currentUserId,
        type: 'system',
        title: `Message from ${req.user.name}`,
        message: content.length > 50 ? content.substring(0, 50) + '...' : content,
        link: `/chat?user=${currentUserId}`,
      });
    } else if (conversationType === 'project') {
      const roomKey = `project:${project}`;
      io.to(`chat:${roomKey}`).emit('message:receive', populated);
      io.to(`project:${project}`).emit('message:receive', populated);
    }

    ApiResponse.send(res, 201, { message: populated }, 'Message sent.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
};
