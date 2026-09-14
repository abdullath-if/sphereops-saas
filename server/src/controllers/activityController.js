const ActivityLog = require('../models/ActivityLog');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get system activity logs
// @route   GET /api/activity-logs
const getActivityLogs = async (req, res, next) => {
  try {
    const { entityType, actorId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (entityType && entityType !== 'all') {
      query.entityType = entityType;
    }
    if (actorId && actorId !== 'all') {
      query.actor = actorId;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('actor', 'name avatar email position role')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum),
      ActivityLog.countDocuments(query),
    ]);

    ApiResponse.send(
      res,
      200,
      {
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      'Activity logs retrieved.'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
};
