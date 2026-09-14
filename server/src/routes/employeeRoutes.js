const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getEmployees)
  .post(authorize('admin'), createEmployee);

router.route('/:id')
  .get(getEmployeeById)
  .put(updateEmployee) // Controller verifies admin or self
  .delete(authorize('admin'), deleteEmployee);

module.exports = router;
