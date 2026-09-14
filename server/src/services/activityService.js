const ActivityLog = require('../models/ActivityLog');

/**
 * Record an audit/activity log
 */
const logActivity = async ({
  actorId,
  action,
  entityType,
  entityId = null,
  entityName = '',
  description,
  metadata = {},
}) => {
  try {
    const log = await ActivityLog.create({
      actor: actorId,
      action,
      entityType,
      entityId,
      entityName,
      description,
      metadata,
    });
    return log;
  } catch (error) {
    console.error('[ActivityLog] Failed to record activity:', error.message);
  }
};

module.exports = { logActivity };
