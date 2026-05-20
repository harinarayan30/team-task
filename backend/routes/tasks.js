const express = require('express');
const router = express.Router();
const { updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;
