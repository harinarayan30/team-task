import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import TaskModal from './TaskModal';

export default function KanbanBoard({ activeProject, setActiveProject, onProjectDeleted }) {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Membership invitation state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  
  // Task modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'

  const fetchProjectDetails = async () => {
    try {
      const response = await apiFetch(`/api/projects/${activeProject._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setTasks(data.tasks);
        // Sync active project if membership list updated
        setActiveProject(data.project);
      } else {
        setError(data.message || 'Failed to load project details');
      }
    } catch (err) {
      console.error('Fetch project details error:', err);
      setError('Could not connect to the API server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProject?._id) {
      setLoading(true);
      fetchProjectDetails();
    }
  }, [activeProject?._id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      const response = await apiFetch(`/api/projects/${activeProject._id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await response.json();

      if (data.success) {
        setActiveProject(data.project);
        setInviteEmail('');
      } else {
        setInviteError(data.message || 'Failed to add member');
      }
    } catch (err) {
      console.error('Add member error:', err);
      setInviteError('Connection failed.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the project? Their active task assignments will be cleared.')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/projects/${activeProject._id}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setActiveProject(data.project);
        // Refresh tasks since some might become unassigned
        fetchProjectDetails();
      } else {
        alert(data.message || 'Failed to remove member');
      }
    } catch (err) {
      console.error('Remove member error:', err);
      alert('Connection failed.');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this project and all associated tasks? This action is irreversible.')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/projects/${activeProject._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        onProjectDeleted(activeProject._id);
      } else {
        alert(data.message || 'Failed to delete project');
      }
    } catch (err) {
      console.error('Delete project error:', err);
      alert('Connection failed.');
    }
  };

  const handleCreateTaskClick = () => {
    setModalMode('create');
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleTaskCardClick = (task) => {
    setModalMode('edit');
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSaved = () => {
    setShowTaskModal(false);
    fetchProjectDetails();
  };

  const isOwner = activeProject.owner?._id === user?.id || activeProject.owner === user?.id;
  const isAdmin = user?.role === 'Admin';
  const canManageMembers = isOwner || isAdmin;

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
        <span>{error}</span>
      </div>
    );
  }

  // Filter columns
  const columns = ['To Do', 'In Progress', 'In Review', 'Completed'];

  const getTasksByStatus = (status) => {
    return tasks.filter(t => t.status === status);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High': return 'badge-priority-high';
      case 'Medium': return 'badge-priority-medium';
      case 'Low': return 'badge-priority-low';
      default: return '';
    }
  };

  return (
    <>
      <div className="view-header">
        <div className="view-title-container">
          <h1 className="view-title">{activeProject.name}</h1>
          <p className="view-subtitle">{activeProject.description || 'Collaborative project workspace board.'}</p>
        </div>
        <div className="project-header-actions">
          {canManageMembers && (
            <button className="btn btn-danger" onClick={handleDeleteProject}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Delete Project
            </button>
          )}
          <button className="btn btn-primary" onClick={handleCreateTaskClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" x2="12" y1="5" y2="19" />
              <line x1="5" x2="19" y1="12" y2="12" />
            </svg>
            Add Task
          </button>
        </div>
      </div>

      {/* Roster & Members Invitation Row */}
      <div className="glass-panel project-members-panel">
        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Team:</div>
        
        <div className="project-members-row">
          {activeProject.members && activeProject.members.map(member => (
            <div key={member._id} className="project-member-tag">
              <div className="assignee-avatar" style={{ width: '20px', height: '20px', fontSize: '0.55rem' }}>
                {getInitials(member.name)}
              </div>
              <span>{member.name}</span>
              {member._id === activeProject.owner?._id || member._id === activeProject.owner ? (
                <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: '600' }}>(Lead)</span>
              ) : null}
              {canManageMembers && member._id !== activeProject.owner?._id && member._id !== activeProject.owner && (
                <button 
                  className="project-member-remove"
                  onClick={() => handleRemoveMember(member._id)}
                  title="Remove from project"
                >
                  &times;
                </button>
              )}
            </div>
          ))}

          {/* Inline Email Invite Form */}
          {canManageMembers && (
            <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '10px' }}>
              <input 
                type="email"
                className="form-input"
                placeholder="Invite member email..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ padding: '6px 12px', paddingLeft: '12px', width: '180px', fontSize: '0.8rem', borderRadius: '20px' }}
                required
              />
              <button 
                type="submit" 
                className="btn btn-secondary" 
                disabled={inviteLoading}
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px' }}
              >
                {inviteLoading ? 'Inviting...' : '+ Invite'}
              </button>
              {inviteError && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{inviteError}</span>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="kanban-container">
        {columns.map(col => {
          const colTasks = getTasksByStatus(col);
          const dotClass = col.replace(/\s+/g, '').toLowerCase();

          return (
            <div key={col} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-column-title">
                  <span className={`kanban-column-dot ${dotClass}`}></span>
                  {col}
                </div>
                <span className="kanban-column-count">{colTasks.length}</span>
              </div>

              <div className="kanban-tasks-wrapper">
                {colTasks.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '16px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--border-radius-sm)' }}>
                    No tasks
                  </div>
                ) : (
                  colTasks.map(task => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    return (
                      <div 
                        key={task._id} 
                        className="task-card glass-panel"
                        onClick={() => handleTaskCardClick(task)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        <div className="task-card-title">{task.title}</div>
                        {task.description && (
                          <div className="task-card-desc">{task.description}</div>
                        )}

                        <div className="task-card-bottom">
                          <div className="task-card-assignee">
                            <div className="assignee-avatar">
                              {getInitials(task.assignee?.name)}
                            </div>
                            <span className="assignee-name" title={task.assignee?.name || 'Unassigned'}>
                              {task.assignee?.name ? task.assignee.name.split(' ')[0] : 'Unassigned'}
                            </span>
                          </div>

                          <div className="task-card-meta">
                            {task.dueDate && (
                              <span className={`task-card-date ${overdue ? 'overdue' : ''}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Creation & Modification Modal */}
      {showTaskModal && (
        <TaskModal 
          mode={modalMode}
          task={selectedTask}
          project={activeProject}
          onClose={() => setShowTaskModal(false)}
          onSaved={handleTaskSaved}
        />
      )}
    </>
  );
}
