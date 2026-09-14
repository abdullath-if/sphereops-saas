const express = require('express');
const router = express.Router();
const {
  getComments,
  addComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getComments)
  .post(addComment);

router.route('/:id')
  .delete(deleteComment);

module.exports = router;
