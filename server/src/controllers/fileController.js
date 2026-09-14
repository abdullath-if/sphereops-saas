const fs = require('fs');
const path = require('path');
const FileRecord = require('../models/FileRecord');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/activityService');

// @desc    Upload single file
// @route   POST /api/files/upload
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'Please select a file to upload.');
    }

    const { entityType = 'general', entityId = null } = req.body;

    const relativePath = `/uploads/${req.file.filename}`;

    const fileRecord = await FileRecord.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: relativePath,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploader: req.user._id,
      relatedTo: {
        entityType,
        entityId: entityId || null,
      },
    });

    const populated = await FileRecord.findById(fileRecord._id).populate(
      'uploader',
      'name email avatar'
    );

    await logActivity({
      actorId: req.user._id,
      action: 'FILE_UPLOADED',
      entityType: 'file',
      entityId: fileRecord._id,
      entityName: req.file.originalname,
      description: `${req.user.name} uploaded file '${req.file.originalname}' (${(req.file.size / 1024).toFixed(1)} KB)`,
    });

    ApiResponse.send(res, 201, { file: populated }, 'File uploaded successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get files for an entity
// @route   GET /api/files
const getFiles = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.query;

    const query = {};
    if (entityType) query['relatedTo.entityType'] = entityType;
    if (entityId) query['relatedTo.entityId'] = entityId;

    const files = await FileRecord.find(query)
      .populate('uploader', 'name email avatar')
      .sort('-createdAt');

    ApiResponse.send(res, 200, { files }, 'Files retrieved.');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
const deleteFile = async (req, res, next) => {
  try {
    const file = await FileRecord.findById(req.params.id);
    if (!file) {
      throw new ApiError(404, 'File not found.');
    }

    // Role check: admin or uploader
    if (req.user.role !== 'admin' && file.uploader.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to delete this file.');
    }

    // Remove from disk if exists
    const diskPath = path.join(__dirname, '../../', file.path);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (e) {
        console.warn(`Could not remove file from disk: ${e.message}`);
      }
    }

    await FileRecord.findByIdAndDelete(file._id);

    await logActivity({
      actorId: req.user._id,
      action: 'FILE_DELETED',
      entityType: 'file',
      entityId: file._id,
      entityName: file.originalName,
      description: `${req.user.name} deleted file '${file.originalName}'`,
    });

    ApiResponse.send(res, 200, null, 'File deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
  getFiles,
  deleteFile,
};
