const express = require('express');
const router = express.Router();
const {
  uploadFile,
  getFiles,
  deleteFile,
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getFiles);
router.delete('/:id', deleteFile);

module.exports = router;
