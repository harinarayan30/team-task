import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

export default function TaskModal({ mode, task, project, onClose, onSaved }) {
  const { token, user } = useAuth();
  
  // Form fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('To Do');
  const [priority, setPriority] = useState('Medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Initialize fields for Edit mode
  useEffect(() => {
    if (mode === 'edit' && task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'To Do');
      setPriority(task.priority || 'Medium');
      setAssignee(task.assignee?._id || task.assignee || '');
      
      // Parse date to yyyy-MM-dd
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setDueDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setDueDate('');
      }
    } else {
      // Defaults for Create mode
      setTitle('');
      setDescription('');
      setStatus('To Do');
      setPriority('Medium');
      setAssignee('');
      setDueDate('');
    }
  }, [mode, task]);

  // Role Validation Calculations
  const isAdmin = user?.role === 'Admin';
  const isOwner = project.owner?._id === user?.id || project.owner === user?.id;
  const isAssignee = task && (task.assignee?._id === user?.id || task.assignee === user?.id);
  
  // Can edit everything? Yes if admin, owner, assignee, or if we are in create mode
  const canEditAll = mode === 'create' || isAdmin || isOwner || isAssignee;
  
  // Can delete task? Only admin or owner
  const canDelete = mode === 'edit' && (isAdmin || isOwner);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Task title is required');
      return;
    }

    setLoading(true);
    setFormError(null);

    // Build payload
    const payload = {};
    if (canEditAll) {
      payload.title = title;
      payload.description = description;
      payload.status = status;
      payload.priority = priority;
      payload.assignee = assignee || null;
      payload.dueDate = dueDate || null;
    } else {
      // Restricted edit - only send status
      payload.status = status;
    }

    try {
      const url = mode === 'create' 
        ? `/api/projects/${project._id}/tasks` 
        : `/api/tasks/${task._id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        onSaved();
      } else {
        setFormError(data.message || 'Failed to save task');
      }
    } catch (err) {
      console.error('Save task error:', err);
      setFormError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    setLoading(true);
    try {
      const response = await apiFetch(`/api/tasks/${task._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        onSaved();
      } else {
        setFormError(data.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Delete task error:', err);
      setFormError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-panel">
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'create' ? 'Create New Task' : 'Task Details'}
          </h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {formError && (
              <div className="error-alert">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            {!canEditAll && (
              <div className="error-alert" style={{ background: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.25)', color: '#a5f3fc' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Locked Input: General members can only update task status. Please ask an Admin, Owner, or Assignee to modify other details.</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="task-title">Task Title</label>
              <input 
                id="task-title"
                type="text"
                className="form-input"
                placeholder="Title of task"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ paddingLeft: '16px' }}
                disabled={!canEditAll}
                maxLength="100"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-desc">Description</label>
              <textarea 
                id="task-desc"
                className="form-input"
                placeholder="Describe the instructions for this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ paddingLeft: '16px', minHeight: '80px', resize: 'vertical' }}
                disabled={!canEditAll}
              />
            </div>

            <div className="modal-grid-2">
              <div className="form-group">
                <label htmlFor="task-status">Status</label>
                <div className="form-select-wrapper">
                  <select 
                    id="task-status"
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="task-priority">Priority</label>
                <div className="form-select-wrapper">
                  <select 
                    id="task-priority"
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={!canEditAll}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-grid-2">
              <div className="form-group">
                <label htmlFor="task-assignee">Assignee</label>
                <div className="form-select-wrapper">
                  <select 
                    id="task-assignee"
                    className="form-select"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    disabled={!canEditAll}
                  >
                    <option value="">Unassigned</option>
                    {project.members && project.members.map(member => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="task-due">Due Date</label>
                <input 
                  id="task-due"
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ paddingLeft: '16px' }}
                  disabled={!canEditAll}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <div>
              {canDelete && (
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete Task
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
