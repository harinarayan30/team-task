import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiFetch } from './api';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import KanbanBoard from './components/KanbanBoard';

function MainApp() {
  const { user, token, loading, error, setError } = useAuth();
  
  // Navigation State
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'projects' | 'project-detail'
  const [activeProject, setActiveProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authRole, setAuthRole] = useState('Member');
  const [authLoading, setAuthLoading] = useState(false);
  const { login, signup } = useAuth();

  // Fetch Projects List when token/auth changes
  const fetchProjects = async () => {
    if (!token) return;
    setProjectsLoading(true);
    try {
      const response = await apiFetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword || (!isLogin && !authName)) {
      setError('Please fill in all required fields');
      return;
    }

    setAuthLoading(true);
    setError(null);

    let res;
    if (isLogin) {
      res = await login(authEmail, authPassword);
    } else {
      res = await signup(authName, authEmail, authPassword, authRole);
    }

    setAuthLoading(false);
    
    if (res.success) {
      // Clear forms
      setAuthName('');
      setAuthEmail('');
      setAuthPassword('');
      setAuthRole('Member');
      setCurrentView('dashboard');
    }
  };

  const handleProjectDeleted = (deletedId) => {
    setProjects(projects.filter(p => p._id !== deletedId));
    setActiveProject(null);
    setCurrentView('dashboard');
  };

  // 1. Loading Session Profile
  if (loading) {
    return (
      <div className="auth-page">
        <div className="spinner"></div>
      </div>
    );
  }

  // 2. Unauthenticated Layout (Login / Signup Forms)
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card glass-panel animate-fade-in">
          <div className="auth-header">
            <div className="auth-logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Ethara</span>
            </div>
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{isLogin ? 'Log in to access your projects and tasks' : 'Sign up to coordinate and assign workspace progress'}</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {error && (
              <div className="error-alert">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {!isLogin && (
              <div className="form-group animate-slide-up">
                <label htmlFor="user-name">Full Name</label>
                <div className="input-container">
                  <input 
                    id="user-name"
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Harry Potter"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="user-email">Email Address</label>
              <div className="input-container">
                <input 
                  id="user-email"
                  type="email" 
                  className="form-input" 
                  placeholder="name@company.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="user-pass">Password</label>
              <div className="input-container">
                <input 
                  id="user-pass"
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  minLength="6"
                  required
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            {!isLogin && (
              <div className="form-group animate-slide-up">
                <label htmlFor="user-role">Account Role</label>
                <div className="form-select-wrapper">
                  <select 
                    id="user-role"
                    className="form-select"
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value)}
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={authLoading}>
              {authLoading ? 'Verifying...' : (isLogin ? 'Log In' : 'Sign Up')}
            </button>
          </form>

          <div className="auth-footer">
            <span>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <span 
              className="auth-link" 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Layout (Sidebar Navigation + Dynamic Panel Views)
  return (
    <div className="app-container">
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        projects={projects}
        activeProject={activeProject}
        setActiveProject={setActiveProject}
      />

      <main className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard 
            setCurrentView={setCurrentView}
            setActiveProject={setActiveProject}
            projects={projects}
          />
        )}

        {currentView === 'projects' && (
          <Projects 
            projects={projects}
            setProjects={setProjects}
            setActiveProject={setActiveProject}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'project-detail' && activeProject && (
          <KanbanBoard 
            activeProject={activeProject}
            setActiveProject={setActiveProject}
            onProjectDeleted={handleProjectDeleted}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
