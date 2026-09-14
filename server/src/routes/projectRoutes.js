const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(authorize('admin', 'manager'), createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(authorize('admin', 'manager'), deleteProject);

module.exports = router;
