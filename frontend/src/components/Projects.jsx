import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

export default function Projects({ projects, setProjects, setActiveProject, setCurrentView }) {
  const { token, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const handleCardClick = (project) => {
    setActiveProject(project);
    setCurrentView('project-detail');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Project name is required');
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      const response = await apiFetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });
      const data = await response.json();

      if (data.success) {
        setProjects([data.project, ...projects]);
        setShowModal(false);
        setName('');
        setDescription('');
      } else {
        setFormError(data.message || 'Failed to create project');
      }
    } catch (err) {
      console.error('Create project error:', err);
      setFormError('Could not connect to the API server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="view-header">
        <div className="view-title-container">
          <h1 className="view-title">Projects Directory</h1>
          <p className="view-subtitle">Manage your teams, view active tasks, and track cross-functional progress.</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" x2="12" y1="5" y2="19" />
              <line x1="5" x2="19" y1="12" y2="12" />
            </svg>
            Create Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="glass-panel empty-state" style={{ minHeight: '350px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
          </svg>
          <h2>No projects found</h2>
          <p>Get started by creating your first collaborative workspace project now!</p>
          <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => setShowModal(true)}>
            Create First Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => {
            const isOwner = project.owner?._id === user?.id || project.owner === user?.id;
            return (
              <div 
                key={project._id}
                className="project-card glass-panel"
                onClick={() => handleCardClick(project)}
              >
                <div className="project-card-top">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <h3 className="project-card-title">{project.name}</h3>
                    {isOwner ? (
                      <span className="badge badge-priority-medium" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent)', borderColor: 'rgba(6, 182, 212, 0.25)' }}>
                        Owner
                      </span>
                    ) : (
                      <span className="badge badge-status-todo" style={{ fontSize: '0.65rem' }}>
                        Member
                      </span>
                    )}
                  </div>
                  <p className="project-card-desc">
                    {project.description || 'No description provided for this workspace. Click to explore tasks.'}
                  </p>
                </div>

                <div className="project-card-bottom">
                  <div className="project-members-avatars">
                    {project.members && project.members.slice(0, 4).map((member, idx) => (
                      <div 
                        key={member._id || idx} 
                        className="member-avatar-overlap"
                        title={member.name || 'Member'}
                      >
                        {getInitials(member.name)}
                      </div>
                    ))}
                    {project.members && project.members.length > 4 && (
                      <div className="member-avatar-overlap" style={{ background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.7rem' }}>
                        +{project.members.length - 4}
                      </div>
                    )}
                  </div>

                  <span className="project-owner-tag">
                    Lead: {project.owner?.name ? project.owner.name.split(' ')[0] : 'Admin'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal Overlay */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card glass-panel">
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
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

                <div className="form-group">
                  <label htmlFor="proj-name">Workspace / Project Name</label>
                  <input 
                    id="proj-name"
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Marketing Q3 Launch"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '16px' }}
                    maxLength="50"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="proj-desc">Description</label>
                  <textarea 
                    id="proj-desc"
                    className="form-input" 
                    placeholder="Describe the goals, links, and objectives of this workspace."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ paddingLeft: '16px', minHeight: '100px', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
