const ApiError = require('../utils/apiError');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If error is not an instance of ApiError, convert it
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    let message = error.message || 'Internal Server Error';

    // Handle Mongoose duplicate key error (E11000)
    if (error.code === 11000) {
      statusCode = 400;
      const field = Object.keys(error.keyValue)[0];
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      statusCode = 400;
      message = `Invalid resource identifier format: ${error.value}`;
    }

    error = new ApiError(statusCode, message, error.errors || []);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};

module.exports = { errorHandler };
