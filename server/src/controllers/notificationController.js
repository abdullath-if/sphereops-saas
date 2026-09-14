const Notification = require('../models/Notification');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get user notifications
// @route   GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .populate('sender', 'name avatar email')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    ApiResponse.send(
      res,
      200,
      {
        notifications,
        unreadCount,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      'Notifications retrieved.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found.');
    }

    notification.isRead = true;
    await notification.save();

    ApiResponse.send(res, 200, { notification }, 'Notification marked as read.');
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });

    ApiResponse.send(res, 200, null, 'All notifications marked as read.');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found.');
    }

    ApiResponse.send(res, 200, null, 'Notification deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
