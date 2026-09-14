const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/activityService');
const { sendEmail } = require('../services/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  });
};

// @desc    Register a user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, position, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'A user with this email already exists.');
    }

    // Default first user to admin if no users exist
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : role || 'employee';

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      department: department || null,
      position: position || 'Team Member',
      phone: phone || '',
    });

    const token = generateToken(user._id);

    await logActivity({
      actorId: user._id,
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: user._id,
      entityName: user.name,
      description: `New user account registered: ${user.name} (${user.role})`,
    });

    const userResponse = await User.findById(user._id).populate('department', 'name');

    ApiResponse.send(
      res,
      201,
      {
        token,
        user: userResponse,
      },
      'User registered successfully.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Please provide both email and password.');
    }

    const user = await User.findOne({ email }).select('+password').populate('department', 'name');

    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    if (user.status === 'inactive') {
      throw new ApiError(403, 'Your account has been deactivated. Contact an administrator.');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const token = generateToken(user._id);

    await logActivity({
      actorId: user._id,
      action: 'USER_LOGIN',
      entityType: 'auth',
      entityId: user._id,
      entityName: user.name,
      description: `User logged in: ${user.name}`,
    });

    // Strip password from output
    user.password = undefined;

    ApiResponse.send(
      res,
      200,
      {
        token,
        user,
      },
      'Logged in successfully.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name');
    ApiResponse.send(res, 200, { user }, 'Current user profile fetched.');
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, skills, position, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (skills) user.skills = Array.isArray(skills) ? skills : skills.split(',').map((s) => s.trim());
    if (position) user.position = position;
    if (avatar) user.avatar = avatar;

    await user.save();
    const updatedUser = await User.findById(user._id).populate('department', 'name');

    await logActivity({
      actorId: req.user._id,
      action: 'PROFILE_UPDATED',
      entityType: 'user',
      entityId: user._id,
      entityName: user.name,
      description: `Profile details updated for ${user.name}`,
    });

    ApiResponse.send(res, 200, { user: updatedUser }, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Current and new password are required.');
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters.');
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      throw new ApiError(400, 'Current password is incorrect.');
    }

    user.password = newPassword;
    await user.save();

    ApiResponse.send(res, 200, null, 'Password updated successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Do not leak email existence
      return ApiResponse.send(
        res,
        200,
        null,
        'If an account with that email exists, password reset instructions have been sent.'
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `You have requested a password reset for your SphereOps account. Please click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.`;

    await sendEmail({
      to: user.email,
      subject: 'SphereOps - Password Reset Request',
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #4f46e5;">SphereOps Password Reset</h2>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Reset Password</a>
          <p style="color: #64748b; font-size: 13px;">Or copy and paste this link in your browser:<br>${resetUrl}</p>
          <p style="color: #94a3b8; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    ApiResponse.send(
      res,
      200,
      { resetToken: env.NODE_ENV === 'development' ? resetToken : undefined },
      'If an account with that email exists, password reset instructions have been sent.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired password reset token.');
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters.');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    ApiResponse.send(res, 200, null, 'Password has been successfully reset. You may now log in.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
