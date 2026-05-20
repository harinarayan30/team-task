const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get dashboard analytics & statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'Admin') {
      projects = await Project.find();
    } else {
      projects = await Project.find({
        $or: [
          { owner: req.user.id },
          { members: req.user.id }
        ]
      });
    }

    const projectIds = projects.map(p => p._id);

    // Fetch all tasks in these projects
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name')
      .populate('assignee', 'name email role');

    // Stats calculations
    const totalProjects = projects.length;
    const totalTasks = allTasks.length;

    // Status breakdown
    const statusCounts = {
      'To Do': 0,
      'In Progress': 0,
      'In Review': 0,
      'Completed': 0
    };

    // Priority breakdown
    const priorityCounts = {
      'Low': 0,
      'Medium': 0,
      'High': 0
    };

    const now = new Date();
    const overdueTasks = [];
    const myTasks = [];

    allTasks.forEach(task => {
      // Status & Priority counts
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      }
      if (priorityCounts[task.priority] !== undefined) {
        priorityCounts[task.priority]++;
      }

      // Check if overdue: has due date, due date is in the past, and not completed
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'Completed') {
        overdueTasks.push(task);
      }

      // Check if assigned to current user
      if (task.assignee && task.assignee._id.toString() === req.user.id) {
        myTasks.push(task);
      }
    });

    // My tasks status counts
    const myStatusCounts = {
      'To Do': 0,
      'In Progress': 0,
      'In Review': 0,
      'Completed': 0
    };
    myTasks.forEach(task => {
      if (myStatusCounts[task.status] !== undefined) {
        myStatusCounts[task.status]++;
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        totalTasks,
        statusCounts,
        priorityCounts,
        overdueCount: overdueTasks.length,
        overdueTasks: overdueTasks.slice(0, 5), // Return top 5 overdue tasks for display
        myTasksCount: myTasks.length,
        myTasksCompleted: myStatusCounts['Completed'],
        myStatusCounts,
        myTasks: myTasks.filter(t => t.status !== 'Completed').slice(0, 5) // Active tasks assigned to me
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
