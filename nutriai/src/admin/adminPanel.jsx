// nutriai/src/components/adminPanel.jsx
// Admin panel to manage homecook applications

import { useState, useEffect } from 'react';
import { 
  getPendingApplications, 
  getAllApplications,
  approveApplication, 
  rejectApplication,
  getAllUsers,
  getAdminStats 
} from '../services/api';
import './adminPanel.css';

export default function AdminPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      if (activeTab === 'pending') {
        const res = await getPendingApplications();
        setApplications(res.data.applications || []);
      } else if (activeTab === 'all') {
        const res = await getAllApplications();
        setApplications(res.data.applications || []);
      } else if (activeTab === 'users') {
        const res = await getAllUsers();
        setUsers(res.data.users || []);
      } else if (activeTab === 'stats') {
        const res = await getAdminStats();
        setStats(res.data.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Admin panel error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId) => {
    if (!window.confirm('Approve this homecook application?')) return;

    try {
      await approveApplication(applicationId);
      alert('Application approved! User is now a homecook.');
      loadData();
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
      alert('Application rejected');
      setRejectingId(null);
      setRejectionReason('');
      loadData();
    } catch (err) {
      alert('Failed to reject: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: '#fff4e1', color: '#c05621', label: '⏳ Pending' },
      approved: { bg: '#e4f7e9', color: '#166534', label: '✅ Approved' },
      rejected: { bg: '#ffe5e5', color: '#b91c1c', label: '❌ Rejected' }
    };
    const badge = badges[status] || badges.pending;
    
    return (
      <span style={{
        background: badge.bg,
        color: badge.color,
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {badge.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const badges = {
      consumer: { bg: '#f5f5f5', color: '#555', label: 'Consumer' },
      homecook: { bg: '#fff7e9', color: '#eea641', label: '👨‍🍳 Homecook' },
      admin: { bg: '#e0f2fe', color: '#0369a1', label: '⚡ Admin' }
    };
    const badge = badges[role] || badges.consumer;
    
    return (
      <span style={{
        background: badge.bg,
        color: badge.color,
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: '600'
      }}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>⚡ Admin Panel</h2>
        {onClose && <button className="btn-close" onClick={onClose}>✕</button>}
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending
        </button>
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Applications
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="admin-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'pending' && (
              <div className="applications-list">
                <h3>Pending Homecook Applications</h3>
                {applications.length === 0 ? (
                  <div className="empty-state">
                    <p>✨ No pending applications</p>
                    <p>All caught up!</p>
                  </div>
                ) : (
                  applications.map(app => (
                    <div key={app.id} className="application-card">
                      <div className="app-card-header">
                        <div>
                          <h4>{app.full_name}</h4>
                          <p className="app-email">{app.email}</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>

                      <div className="app-details">
                        <p><strong>Applied:</strong> {new Date(app.applied_at).toLocaleDateString()}</p>
                        
                        <div className="app-text">
                          <strong>Why they want to be a homecook:</strong>
                          <p>{app.application_text}</p>
                        </div>

                        {app.specialties && app.specialties.length > 0 && (
                          <div>
                            <strong>Specialties:</strong>
                            <div className="tag-list">
                              {app.specialties.map((s, i) => (
                                <span key={i} className="tag">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {app.experience_years > 0 && (
                          <p><strong>Experience:</strong> {app.experience_years} years</p>
                        )}

                        {app.sample_dishes && app.sample_dishes.length > 0 && (
                          <div>
                            <strong>Sample dishes:</strong>
                            <div className="tag-list">
                              {app.sample_dishes.map((d, i) => (
                                <span key={i} className="tag tag-secondary">{d}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {app.status === 'pending' && (
                        <div className="app-actions">
                          {rejectingId === app.id ? (
                            <div className="reject-form">
                              <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                rows="3"
                              />
                              <div className="reject-actions">
                                <button 
                                  className="btn-secondary"
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectionReason('');
                                  }}
                                >
                                  Cancel
                                </button>
                                <button 
                                  className="btn-danger"
                                  onClick={() => handleReject(app.id)}
                                >
                                  Confirm Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button 
                                className="btn-danger"
                                onClick={() => setRejectingId(app.id)}
                              >
                                ❌ Reject
                              </button>
                              <button 
                                className="btn-success"
                                onClick={() => handleApprove(app.id)}
                              >
                                ✅ Approve
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'all' && (
              <div className="applications-list">
                <h3>All Applications</h3>
                {applications.length === 0 ? (
                  <div className="empty-state">
                    <p>No applications yet</p>
                  </div>
                ) : (
                  applications.map(app => (
                    <div key={app.id} className="application-card compact">
                      <div className="app-card-header">
                        <div>
                          <h4>{app.full_name}</h4>
                          <p className="app-email">{app.email}</p>
                          <p className="app-date">Applied: {new Date(app.applied_at).toLocaleDateString()}</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>

                      {app.status === 'rejected' && app.rejection_reason && (
                        <div className="rejection-reason">
                          <strong>Rejection reason:</strong> {app.rejection_reason}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="users-list">
                <h3>All Users ({users.length})</h3>
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
                        <td>{user.full_name}</td>
                        <td>{user.email}</td>
                        <td>{getRoleBadge(user.role)}</td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          {user.homecook_approved ? (
                            <span className="status-approved">✅ Approved</span>
                          ) : user.homecook_status === 'pending' ? (
                            <span className="status-pending">⏳ Pending</span>
                          ) : (
                            <span className="status-na">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-details">
                    <h3>{stats.total_users || 0}</h3>
                    <p>Total Users</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">👨‍🍳</div>
                  <div className="stat-details">
                    <h3>{stats.total_homecooks || 0}</h3>
                    <p>Homecooks</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-details">
                    <h3>{stats.pending_applications || 0}</h3>
                    <p>Pending Applications</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🍽️</div>
                  <div className="stat-details">
                    <h3>{stats.total_meals || 0}</h3>
                    <p>Total Meals Logged</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🥫</div>
                  <div className="stat-details">
                    <h3>{stats.total_pantry_items || 0}</h3>
                    <p>Pantry Items</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-details">
                    <h3>{stats.total_recipes || 0}</h3>
                    <p>Homecook Recipes</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}