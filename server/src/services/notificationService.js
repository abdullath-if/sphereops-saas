const Notification = require('../models/Notification');
const { getIO } = require('./socketService');

/**
 * Dispatch notification to a user via database & Socket.IO
 */
const createNotification = async ({
  recipientId,
  senderId = null,
  type,
  title,
  message,
  link = '',
}) => {
  try {
    // Avoid sending notification if recipient is the sender
    if (senderId && recipientId.toString() === senderId.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      link,
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name avatar email');

    // Emit live socket event to recipient's personal room
    const io = getIO();
    io.to(`user:${recipientId}`).emit('notification:new', populatedNotification);

    return populatedNotification;
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error.message);
  }
};

module.exports = { createNotification };
