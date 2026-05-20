const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create a task
// @route   POST /api/projects/:id/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, description, status, priority, assignee, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please add a task title' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check project membership
    const isMember = project.members.some(member => member.toString() === req.user.id);
    const isOwner = project.owner.toString() === req.user.id;

    if (req.user.role !== 'Admin' && !isMember && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this project' });
    }

    const task = await Task.create({
      project: projectId,
      title,
      description,
      status: status || 'To Do',
      priority: priority || 'Medium',
      assignee: assignee || null,
      dueDate: dueDate || null
    });

    const populatedTask = await Task.findById(task._id).populate('assignee', 'name email role');

    res.status(201).json({ success: true, task: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Associated project not found' });
    }

    // Role-based Access Rules
    const isOwner = project.owner.toString() === req.user.id;
    const isAssignee = task.assignee && task.assignee.toString() === req.user.id;
    const isAdmin = req.user.role === 'Admin';
    const isMember = project.members.some(member => member.toString() === req.user.id);

    // If user is not even a member/owner of project, deny access
    if (!isAdmin && !isMember && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to access tasks in this project' });
    }

    // If user is a Member, but not Admin, Owner, or the Assignee:
    // They can ONLY update status. Enforce this validation.
    if (!isAdmin && !isOwner && !isAssignee) {
      const keys = Object.keys(req.body);
      const invalidEdits = keys.filter(key => key !== 'status');
      
      if (invalidEdits.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Members can only update task status. Please ask an Admin, Project Owner, or Task Assignee to modify other details.'
        });
      }
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('assignee', 'name email role');

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Associated project not found' });
    }

    // Only Admin or Project Owner can delete tasks
    const isOwner = project.owner.toString() === req.user.id;
    const isAdmin = req.user.role === 'Admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only Admins and Project Owners can delete tasks'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
