const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'Admin') {
      projects = await Project.find().populate('owner members', 'name email role');
    } else {
      projects = await Project.find({
        $or: [
          { owner: req.user.id },
          { members: req.user.id }
        ]
      }).populate('owner members', 'name email role');
    }
    res.status(200).json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Please add a project name' });
    }

    const project = await Project.create({
      name,
      description,
      owner: req.user.id,
      members: [req.user.id] // Owner is member by default
    });

    const populatedProject = await Project.findById(project._id).populate('owner members', 'name email role');

    res.status(201).json({ success: true, project: populatedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Role restriction check: user must be admin, owner, or member
    const isMember = project.members.some(member => member._id.toString() === req.user.id);
    const isOwner = project.owner._id.toString() === req.user.id;

    if (req.user.role !== 'Admin' && !isMember && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied to this project' });
    }

    // Fetch tasks for the project and populate assignee
    const tasks = await Task.find({ project: req.params.id }).populate('assignee', 'name email role');

    res.status(200).json({ success: true, project, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Must be Admin or Project Owner
    if (req.user.role !== 'Admin' && project.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('owner members', 'name email role');

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Must be Admin or Project Owner
    if (req.user.role !== 'Admin' && project.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    // Delete tasks associated with project
    await Task.deleteMany({ project: req.params.id });

    // Delete project
    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Project and all tasks deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide user email' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Must be Admin or Project Owner
    if (req.user.role !== 'Admin' && project.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage project members' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with this email' });
    }

    // Check if user is already a member
    if (project.members.includes(user._id)) {
      return res.status(400).json({ success: false, message: 'User is already a member of this project' });
    }

    project.members.push(user._id);
    await project.save();

    const populatedProject = await Project.findById(project._id).populate('owner members', 'name email role');

    res.status(200).json({ success: true, project: populatedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Must be Admin or Project Owner
    if (req.user.role !== 'Admin' && project.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage project members' });
    }

    const userId = req.params.userId;

    // Check if member exists in project
    if (!project.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User is not a member of this project' });
    }

    // Prevent removing the owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove project owner' });
    }

    // Unassign tasks from this user in this project
    await Task.updateMany(
      { project: req.params.id, assignee: userId },
      { assignee: null }
    );

    project.members = project.members.filter(member => member.toString() !== userId);
    await project.save();

    const populatedProject = await Project.findById(project._id).populate('owner members', 'name email role');

    res.status(200).json({ success: true, project: populatedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
