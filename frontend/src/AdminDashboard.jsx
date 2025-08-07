import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            Overview
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            Users
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="nav-icon">⚙️</span>
            Settings
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Dashboard</h1>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-email">{user?.email}</span>
                <span className="user-role">
                  {user?.is_superuser ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            </div>
            
            <button className="logout-btn" onClick={handleLogout}>
              <span>🚪</span> Logout
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="welcome-section">
                <h2>Welcome back, {user?.email?.split('@')[0]}!</h2>
                <p>Here's what's happening with your application today.</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>Total Users</h3>
                    <p className="stat-number">1,234</p>
                    <span className="stat-change">+12% from last month</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🔐</div>
                  <div className="stat-content">
                    <h3>Active Sessions</h3>
                    <p className="stat-number">89</p>
                    <span className="stat-change">+5% from yesterday</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <h3>System Health</h3>
                    <p className="stat-number">99.9%</p>
                    <span className="stat-change success">All systems operational</span>
                  </div>
                </div>
              </div>

              {user?.is_superuser && (
                <div className="superuser-section">
                  <h3>🔒 Super Admin Controls</h3>
                  <div className="admin-controls">
                    <button className="control-btn danger">
                      System Maintenance
                    </button>
                    <button className="control-btn warning">
                      Database Backup
                    </button>
                    <button className="control-btn primary">
                      Server Logs
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-tab">
              <div className="tab-header">
                <h2>User Management</h2>
                <button className="add-user-btn">+ Add User</button>
              </div>

              {loading ? (
                <div className="loading">Loading users...</div>
              ) : (
                <div className="users-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{user?.email}</td>
                        <td>
                          <span className="status active">Active</span>
                        </td>
                        <td>
                          <span className="role admin">
                            {user?.is_superuser ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>
                        <td>Today</td>
                        <td>
                          <button className="action-btn">Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <h2>System Settings</h2>
              
              <div className="settings-section">
                <h3>Application Settings</h3>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Enable user registration
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Require email verification
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" />
                    Enable Google OAuth
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>Security Settings</h3>
                <div className="setting-item">
                  <label>
                    Session timeout (minutes):
                    <input type="number" defaultValue="30" className="number-input" />
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Require strong passwords
                  </label>
                </div>
              </div>

              <button className="save-settings-btn">Save Settings</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}