const ApiError = require('../utils/apiError');

/**
 * Restrict route access to specified roles
 * @param  {...string} roles - e.g. 'admin', 'manager', 'employee'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Forbidden: Role '${req.user.role}' is not authorized to perform this action.`
        )
      );
    }

    next();
  };
};

module.exports = { authorize };
