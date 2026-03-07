// nutriai/src/admin/adminDashboard.jsx
// IMPROVED VERSION - Better scrolling, cleaner design

import { useState, useEffect } from 'react';
import { 
  getPendingApplications,
  getAllUsers,
  getAdminStats,
  approveApplication,
  rejectApplication,
  logout
} from '../services/api';
import './adminDashboard.css';

export default function AdminDashboard({ onLogout }) {
  const [activeView, setActiveView] = useState('overview');
  const [pendingApps, setPendingApps] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [admin, setAdmin] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
        alert('Access denied! Admin only.');
        onLogout();
        return;
      }
      setAdmin(user);
    }
    
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, appsRes, usersRes] = await Promise.all([
        getAdminStats(),
        getPendingApplications(),
        getAllUsers()
      ]);

      setStats(statsRes.data.stats);
      setPendingApps(appsRes.data.applications || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Admin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleApprove = async (applicationId) => {
    if (!window.confirm('Approve this homecook application?')) return;

    try {
      await approveApplication(applicationId);
      alert('✅ Application approved!');
      loadDashboardData();
    } catch (err) {
      alert('Failed to approve: ' + err.message);
    }
  };

  const handleReject = async (applicationId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await rejectApplication(applicationId, rejectionReason);
      alert('❌ Application rejected');
      setRejectingId(null);
      setRejectionReason('');
      loadDashboardData();
    } catch (err) {
      alert('Failed to reject: ' + err.message);
    }
  };

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-screen">
          <div className="loading-spinner">⚡</div>
          <h2>Loading Admin Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Admin Header - FIXED */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-logo">
            <span className="admin-logo-icon">⚡</span>
            <span className="admin-logo-text">NutriAI Admin</span>
          </div>
          {admin && (
            <div className="admin-welcome">
              <span className="welcome-text">Welcome,</span>
              <strong className="admin-name">{admin.full_name}</strong>
            </div>
          )}
        </div>
        <div className="admin-header-right">
          {/* IMPROVED REFRESH BUTTON */}
          <button 
            className={`refresh-btn-icon ${refreshing ? 'spinning' : ''}`}
            onClick={handleRefresh} 
            title="Refresh Data"
            disabled={refreshing}
          >
            🔄
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Admin Navigation - FIXED */}
      <nav className="admin-nav">
        <button 
          className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          <span className="nav-icon">📊</span>
          <span>Overview</span>
        </button>
        <button 
          className={`nav-btn ${activeView === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveView('applications')}
        >
          <span className="nav-icon">📝</span>
          <span>Applications</span>
          {pendingApps.length > 0 && (
            <span className="badge">{pendingApps.length}</span>
          )}
        </button>
        <button 
          className={`nav-btn ${activeView === 'users' ? 'active' : ''}`}
          onClick={() => setActiveView('users')}
        >
          <span className="nav-icon">👥</span>
          <span>Users</span>
        </button>
      </nav>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">❌</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Content - SCROLLABLE */}
      <main className="admin-main">
        {/* OVERVIEW VIEW */}
        {activeView === 'overview' && (
          <div className="overview-view">
            <div className="view-header">
              <h2 className="view-title">Dashboard Overview</h2>
              <p className="view-subtitle">System statistics and quick actions</p>
            </div>

            {/* Stats Grid */}
            {stats && (
              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>{stats.total_users || 0}</h3>
                    <p>Total Users</p>
                    <span className="stat-trend">All registered users</span>
                  </div>
                </div>

                <div className="stat-card orange">
                  <div className="stat-icon">👨‍🍳</div>
                  <div className="stat-content">
                    <h3>{stats.total_homecooks || 0}</h3>
                    <p>Active Homecooks</p>
                    <span className="stat-trend">Approved cooks</span>
                  </div>
                </div>

                <div className="stat-card yellow">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-content">
                    <h3>{pendingApps.length}</h3>
                    <p>Pending Applications</p>
                    <span className="stat-trend">Needs review</span>
                  </div>
                </div>

                <div className="stat-card green">
                  <div className="stat-icon">🍽️</div>
                  <div className="stat-content">
                    <h3>{stats.total_meals || 0}</h3>
                    <p>Total Meals Logged</p>
                    <span className="stat-trend">All time</span>
                  </div>
                </div>

                <div className="stat-card purple">
                  <div className="stat-icon">🥫</div>
                  <div className="stat-content">
                    <h3>{stats.total_pantry_items || 0}</h3>
                    <p>Pantry Items</p>
                    <span className="stat-trend">Currently tracked</span>
                  </div>
                </div>

                <div className="stat-card pink">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>{stats.total_recipes || 0}</h3>
                    <p>Homecook Recipes</p>
                    <span className="stat-trend">Available</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h3 className="section-title">Quick Actions</h3>
              <div className="actions-grid">
                <button 
                  className="action-card"
                  onClick={() => setActiveView('applications')}
                >
                  <span className="action-icon">📝</span>
                  <div className="action-content">
                    <span className="action-text">Review Applications</span>
                    <span className="action-desc">
                      {pendingApps.length > 0 
                        ? `${pendingApps.length} pending` 
                        : 'All caught up!'}
                    </span>
                  </div>
                  {pendingApps.length > 0 && (
                    <span className="action-badge">{pendingApps.length}</span>
                  )}
                </button>

                <button 
                  className="action-card"
                  onClick={() => setActiveView('users')}
                >
                  <span className="action-icon">👥</span>
                  <div className="action-content">
                    <span className="action-text">Manage Users</span>
                    <span className="action-desc">{users.length} total users</span>
                  </div>
                </button>

                <button 
                  className="action-card"
                  onClick={handleRefresh}
                >
                  <span className="action-icon">🔄</span>
                  <div className="action-content">
                    <span className="action-text">Refresh Data</span>
                    <span className="action-desc">Update statistics</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity-section">
              <h3 className="section-title">Recent Pending Applications</h3>
              {pendingApps.length === 0 ? (
                <div className="empty-state-card">
                  <div className="empty-icon">✨</div>
                  <p className="empty-title">No pending applications</p>
                  <p className="empty-subtitle">All applications have been reviewed!</p>
                </div>
              ) : (
                <div className="activity-list">
                  {pendingApps.slice(0, 3).map(app => (
                    <div key={app.id} className="activity-item">
                      <div className="activity-avatar">{app.full_name.charAt(0)}</div>
                      <div className="activity-details">
                        <p className="activity-title">{app.full_name}</p>
                        <p className="activity-subtitle">{app.email}</p>
                      </div>
                      <div className="activity-meta">
                        <span className="activity-date">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                        <span className="activity-badge">⏳ Pending</span>
                      </div>
                    </div>
                  ))}
                  {pendingApps.length > 3 && (
                    <button 
                      className="view-all-btn"
                      onClick={() => setActiveView('applications')}
                    >
                      View all {pendingApps.length} applications →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* APPLICATIONS VIEW */}
        {activeView === 'applications' && (
          <div className="applications-view">
            <div className="view-header">
              <h2 className="view-title">
                Homecook Applications
              </h2>
              <p className="view-subtitle">
                {pendingApps.length} pending review
              </p>
            </div>

            {pendingApps.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon">✨</div>
                <p className="empty-title">No pending applications</p>
                <p className="empty-subtitle">All caught up! Check back later.</p>
              </div>
            ) : (
              <div className="applications-list">
                {pendingApps.map(app => (
                  <div key={app.id} className="application-card">
                    <div className="app-header">
                      <div className="app-user">
                        <div className="app-avatar">
                          {app.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="app-user-info">
                          <h4>{app.full_name}</h4>
                          <p>{app.email}</p>
                        </div>
                      </div>
                      <div className="app-status">
                        <span className="status-badge pending">⏳ Pending</span>
                        <span className="app-date">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="app-content">
                      <div className="app-section">
                        <strong>Application:</strong>
                        <p>{app.application_text}</p>
                      </div>

                      {app.specialties && app.specialties.length > 0 && (
                        <div className="app-section">
                          <strong>Specialties:</strong>
                          <div className="tag-list">
                            {app.specialties.map((s, i) => (
                              <span key={i} className="tag">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {app.experience_years > 0 && (
                        <div className="app-section">
                          <strong>Experience:</strong> {app.experience_years} years
                        </div>
                      )}

                      {app.sample_dishes && app.sample_dishes.length > 0 && (
                        <div className="app-section">
                          <strong>Sample dishes:</strong>
                          <div className="tag-list">
                            {app.sample_dishes.map((d, i) => (
                              <span key={i} className="tag tag-green">{d}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="app-actions">
                      {rejectingId === app.id ? (
                        <div className="reject-form">
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Provide a reason for rejection..."
                            rows="3"
                          />
                          <div className="reject-buttons">
                            <button 
                              className="btn-cancel"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectionReason('');
                              }}
                            >
                              Cancel
                            </button>
                            <button 
                              className="btn-reject"
                              onClick={() => handleReject(app.id)}
                            >
                              Confirm Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button 
                            className="btn-reject"
                            onClick={() => setRejectingId(app.id)}
                          >
                            ❌ Reject
                          </button>
                          <button 
                            className="btn-approve"
                            onClick={() => handleApprove(app.id)}
                          >
                            ✅ Approve
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS VIEW */}
        {activeView === 'users' && (
          <div className="users-view">
            <div className="view-header">
              <h2 className="view-title">All Users</h2>
              <p className="view-subtitle">{users.length} registered users</p>
            </div>

            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Homecook Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-small">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          {user.full_name}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role === 'admin' && '⚡ '}
                          {user.role === 'homecook' && '👨‍🍳 '}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        {user.homecook_approved ? (
                          <span className="status-badge approved">✅ Approved</span>
                        ) : user.homecook_status === 'pending' ? (
                          <span className="status-badge pending">⏳ Pending</span>
                        ) : (
                          <span className="status-badge na">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}