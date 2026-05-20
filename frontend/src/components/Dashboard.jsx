import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ setCurrentView, setActiveProject, projects }) {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
        } else {
          setError(data.message || 'Failed to fetch dashboard statistics');
        }
      } catch (err) {
        console.error('Fetch dashboard stats error:', err);
        setError('Could not connect to the API server.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const handleTaskClick = (projId) => {
    const project = projects.find(p => p._id === projId);
    if (project) {
      setActiveProject(project);
      setCurrentView('project-detail');
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-alert">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  const {
    totalProjects,
    totalTasks,
    statusCounts,
    overdueCount,
    overdueTasks,
    myTasksCount,
    myTasksCompleted,
    myStatusCounts,
    myTasks
  } = stats;

  // Active tasks = total - completed
  const activeTasks = totalTasks - (statusCounts['Completed'] || 0);

  // Status percentages
  const getPercentage = (count) => {
    if (!totalTasks) return 0;
    return Math.round((count / totalTasks) * 100);
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High': return 'badge-priority-high';
      case 'Medium': return 'badge-priority-medium';
      case 'Low': return 'badge-priority-low';
      default: return '';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className="view-header">
        <div className="view-title-container">
          <h1 className="view-title">Welcome back, {user?.name}</h1>
          <p className="view-subtitle">Here is what's happening with your team and projects today.</p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalProjects}</span>
            <span className="stat-label">Total Projects</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{activeTasks}</span>
            <span className="stat-label">Active Tasks</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{statusCounts['Completed'] || 0}</span>
            <span className="stat-label">Completed Tasks</span>
          </div>
        </div>

        <div className={`stat-card glass-panel ${overdueCount > 0 ? 'overdue-glow' : ''}`} style={{ borderColor: overdueCount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)' }}>
          {overdueCount > 0 && (
            <div className="overdue-pulse-radial"></div>
          )}
          <div className="stat-icon-wrapper" style={{ background: overdueCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)', color: overdueCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" x2="12" y1="9" y2="13" />
              <line x1="12" x2="12.01" y1="17" y2="17" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value" style={{ color: overdueCount > 0 ? 'var(--danger)' : 'inherit' }}>{overdueCount}</span>
            <span className="stat-label">Overdue Tasks</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .overdue-glow {
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.15) !important;
        }
        .overdue-pulse-radial {
          position: absolute;
          top: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.04);
          animation: pulse 2s infinite ease-in-out;
          pointer-events: none;
        }
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
      `}} />

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Side: Overdue list & Personal assigned list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Overdue Panel */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div className="panel-title">
              <span>⚠️ Critical Overdue Tasks</span>
              {overdueCount > 0 && <span className="badge badge-priority-high">{overdueCount} Total</span>}
            </div>
            <div className="panel-body">
              {overdueTasks.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <h3>All clean!</h3>
                  <p>There are no overdue tasks in your active projects.</p>
                </div>
              ) : (
                <div className="task-mini-list">
                  {overdueTasks.map(task => (
                    <div 
                      key={task._id} 
                      className="task-mini-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleTaskClick(task.project._id || task.project)}
                    >
                      <div className="task-mini-left">
                        <span className="task-mini-title">{task.title}</span>
                        <div className="task-mini-meta">
                          <span className="task-mini-project">{task.project?.name || 'Project'}</span>
                          <span>•</span>
                          <span>Assignee: {task.assignee?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                      <div className="task-mini-right">
                        <span className="overdue-date">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {formatDate(task.dueDate)}
                        </span>
                        <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assigned Tasks Panel */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div className="panel-title">
              <span>👤 My Active Queue</span>
              {myTasksCount > 0 && <span className="badge badge-status-inprogress" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>{myTasks.length} Pending</span>}
            </div>
            <div className="panel-body">
              {myTasks.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="m9 15 2 2 4-4" />
                  </svg>
                  <h3>No pending tasks</h3>
                  <p>You have no active tasks assigned to you. Go ahead and take a break!</p>
                </div>
              ) : (
                <div className="task-mini-list">
                  {myTasks.map(task => (
                    <div 
                      key={task._id} 
                      className="task-mini-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleTaskClick(task.project._id || task.project)}
                    >
                      <div className="task-mini-left">
                        <span className="task-mini-title">{task.title}</span>
                        <div className="task-mini-meta">
                          <span className="task-mini-project">{task.project?.name || 'Project'}</span>
                          <span>•</span>
                          <span style={{ textTransform: 'capitalize' }}>Status: {task.status}</span>
                        </div>
                      </div>
                      <div className="task-mini-right">
                        {task.dueDate ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Due: {formatDate(task.dueDate)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No due date</span>
                        )}
                        <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Status Distribution & Statistics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div className="panel-title">📊 Tasks Status Breakdown</div>
            <div className="panel-body">
              {totalTasks === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <p>Create some tasks to view analytics.</p>
                </div>
              ) : (
                <div className="progress-list">
                  <div className="progress-item">
                    <div className="progress-label-row">
                      <span className="progress-label">To Do</span>
                      <span className="progress-count">{statusCounts['To Do'] || 0} ({getPercentage(statusCounts['To Do'] || 0)}%)</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${getPercentage(statusCounts['To Do'] || 0)}%`, background: 'var(--text-secondary)' }}></div>
                    </div>
                  </div>

                  <div className="progress-item">
                    <div className="progress-label-row">
                      <span className="progress-label" style={{ color: 'var(--primary)' }}>In Progress</span>
                      <span className="progress-count">{statusCounts['In Progress'] || 0} ({getPercentage(statusCounts['In Progress'] || 0)}%)</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${getPercentage(statusCounts['In Progress'] || 0)}%`, background: 'var(--primary)', boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)' }}></div>
                    </div>
                  </div>

                  <div className="progress-item">
                    <div className="progress-label-row">
                      <span className="progress-label" style={{ color: 'var(--warning)' }}>In Review</span>
                      <span className="progress-count">{statusCounts['In Review'] || 0} ({getPercentage(statusCounts['In Review'] || 0)}%)</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${getPercentage(statusCounts['In Review'] || 0)}%`, background: 'var(--warning)', boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)' }}></div>
                    </div>
                  </div>

                  <div className="progress-item">
                    <div className="progress-label-row">
                      <span className="progress-label" style={{ color: 'var(--success)' }}>Completed</span>
                      <span className="progress-count">{statusCounts['Completed'] || 0} ({getPercentage(statusCounts['Completed'] || 0)}%)</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${getPercentage(statusCounts['Completed'] || 0)}%`, background: 'var(--success)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div className="panel-title">📈 Workload Distribution</div>
            <div className="panel-body" style={{ gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Assigned to Me</span>
                <span style={{ fontWeight: '600' }}>{myTasksCount} Tasks</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Completed by Me</span>
                <span style={{ fontWeight: '600', color: 'var(--success)' }}>{myTasksCompleted || 0} Tasks</span>
              </div>
              <div className="sidebar-divider" style={{ margin: '5px 0' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Personal Completion Rate</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="progress-track" style={{ flexGrow: 1, height: '6px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${myTasksCount ? Math.round((myTasksCompleted / myTasksCount) * 100) : 0}%`, 
                        background: 'var(--accent)',
                        boxShadow: '0 0 8px rgba(6, 182, 212, 0.3)'
                      }}
                    ></div>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                    {myTasksCount ? Math.round((myTasksCompleted / myTasksCount) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
