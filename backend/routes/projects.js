const express = require('express');
const router = express.Router();
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember
} = require('../controllers/projectController');
const { createTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getProjects)
  .post(protect, createProject);

router.route('/:id')
  .get(protect, getProject)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

router.route('/:id/members')
  .post(protect, addMember);

router.route('/:id/members/:userId')
  .delete(protect, removeMember);

// Nesting tasks under project for task creation
router.route('/:id/tasks')
  .post(protect, createTask);

module.exports = router;
