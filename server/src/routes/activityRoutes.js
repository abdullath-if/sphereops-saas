const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getActivityLogs);

module.exports = router;
