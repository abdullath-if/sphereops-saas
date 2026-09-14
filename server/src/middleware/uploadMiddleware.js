const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

// Ensure upload directory exists
const uploadDirectory = path.join(__dirname, '../../', env.UPLOAD_DIR);
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedOriginal);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|txt|zip|csv/;
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedExtensions.test(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('application/');

  if (extname || mimetype) {
    return cb(null, true);
  }
  cb(new ApiError(400, 'File type not supported. Allowed formats: images, documents, spreadsheets, zip, txt.'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: fileFilter,
});

module.exports = upload;
