const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

const protect = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'Not authorized. Please log in.');
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).populate('department', 'name');

      if (!user) {
        throw new ApiError(401, 'User account no longer exists.');
      }

      if (user.status === 'inactive') {
        throw new ApiError(403, 'Your account has been deactivated. Please contact an Administrator.');
      }

      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Session expired. Please log in again.');
      }
      throw new ApiError(401, 'Invalid authentication token.');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { protect };
