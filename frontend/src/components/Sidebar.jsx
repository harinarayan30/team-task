import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentView, setCurrentView, projects, activeProject, setActiveProject }) {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span>Ethara</span>
        </div>

        <nav className="sidebar-menu">
          <div 
            className={`sidebar-link ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('dashboard');
              setActiveProject(null);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
            <span>Dashboard</span>
          </div>

          <div 
            className={`sidebar-link ${currentView === 'projects' && !activeProject ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('projects');
              setActiveProject(null);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
            <span>All Projects</span>
          </div>

          <div className="sidebar-divider"></div>
          
          <div className="sidebar-section-title">Active Projects</div>
          
          <div className="sidebar-project-list">
            {projects.length === 0 ? (
              <div className="sidebar-project-item" style={{ color: 'var(--text-muted)', cursor: 'default', fontSize: '0.8rem' }}>
                No active projects
              </div>
            ) : (
              projects.map(project => (
                <div 
                  key={project._id}
                  className={`sidebar-project-item ${activeProject && activeProject._id === project._id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveProject(project);
                    setCurrentView('project-detail');
                  }}
                  title={project.name}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  {project.name}
                </div>
              ))
            )}
          </div>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className={`user-role-badge ${user?.role.toLowerCase()}`}>
              {user?.role}
            </span>
          </div>
        </div>

        <button className="logout-btn" onClick={logout}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
