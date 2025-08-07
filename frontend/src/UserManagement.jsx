import React, { useState, useEffect } from 'react';
import './UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All Roles');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'Patient'
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, filterRole, filterStatus]);

  const loadUsers = async () => {
    console.log('🔄 Loading users...');
    setLoading(true);
    setError(''); // Clear previous errors
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('❌ No authentication token found');
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }
      
      console.log('🎫 Token found, making request...');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        role: filterRole !== 'All Roles' ? filterRole : '',
        status: filterStatus !== 'All' ? filterStatus : ''
      });

      console.log('🔍 Request params:', Object.fromEntries(params));

      const response = await fetch(`/admin/users?${params}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Users data received:', {
          users: data.users?.length || 0,
          totalUsers: data.totalUsers,
          totalPages: data.totalPages,
          message: data.message
        });
        
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalUsers(data.totalUsers || 0);
        setError(''); // Clear any previous errors
        
        // Show message if collection doesn't exist
        if (data.message) {
          console.log('ℹ️ Info message:', data.message);
        }
        
      } else {
        // Handle specific HTTP errors
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Error response:', errorData);
        
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
          localStorage.removeItem('token');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else if (response.status === 403) {
          setError('Access denied. Administrator privileges required.');
        } else if (response.status === 500) {
          setError(`Server error: ${errorData.message || 'Internal server error'}`);
        } else {
          setError(errorData.message || `Failed to load users (HTTP ${response.status})`);
        }
      }
      
    } catch (error) {
      console.error('❌ Network/Connection error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Connection failed. Please check if the server is running.');
      } else {
        setError(`Network error: ${error.message}`);
      }
    } finally {
      setLoading(false);
      console.log('✅ Load users completed');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      if (response.ok) {
        loadUsers();
        setSuccess('User status updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error updating user status');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Error updating user status');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          loadUsers();
          setSuccess('User deleted successfully');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          const data = await response.json();
          setError(data.message || 'Error deleting user');
          setTimeout(() => setError(''), 5000);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Error deleting user');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const validateForm = () => {
    setError(''); // Clear previous errors
    
    if (!newUser.email) {
      setError('Email is required');
      return false;
    }
    if (!newUser.password || newUser.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (!newUser.email.includes('@') || !newUser.email.includes('.')) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (response.ok) {
        setShowAddModal(false);
        setNewUser({ email: '', password: '', full_name: '', role: 'Patient' });
        loadUsers();
        setSuccess('User created successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Error creating user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setNewUser({ email: '', password: '', full_name: '', role: 'Patient' });
    setError('');
    setSuccess('');
  };

  const getUserRole = (user) => {
    if (user.is_superuser) return 'Administrator';
    if (user.is_staff) return 'Doctor/Staff';
    return 'Patient';
  };

  const getUserId = (user, index) => {
    const baseIndex = ((currentPage - 1) * 10) + index + 1;
    if (user.is_superuser) return `ADM-${String(baseIndex).padStart(3, '0')}`;
    if (user.is_staff) return `DR-${String(baseIndex).padStart(3, '0')}`;
    return `PAT-${String(baseIndex).padStart(3, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          {error}
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="page-header">
        <div className="page-title">
          <h1>User Management</h1>
          <p>Manage system users and their permissions</p>
        </div>
        <button 
          className="add-user-btn"
          onClick={() => setShowAddModal(true)}
        >
          <span className="btn-icon">+</span>
          Add New User
        </button>
      </div>

      <div className="filters-card">
        <div className="filters">
          <div className="filter-group">
            <label>Role</label>
            <select 
              value={filterRole} 
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1); // Reset to first page when filtering
              }}
              className="filter-select"
            >
              <option>All Roles</option>
              <option>Administrator</option>
              <option>Doctor</option>
              <option>Patient</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <div className="status-filter">
              <label className="radio-label">
                <input type="radio" name="status" value="All"
                  checked={filterStatus === 'All'}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }} />
                <span className="radio-custom"></span>
                All
              </label>
              <label className="radio-label">
                <input type="radio" name="status" value="Active"
                  checked={filterStatus === 'Active'}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }} />
                <span className="radio-custom"></span>
                Active
              </label>
              <label className="radio-label">
                <input type="radio" name="status" value="Suspended"
                  checked={filterStatus === 'Suspended'}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }} />
                <span className="radio-custom"></span>
                Suspended
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={user._id}>
                    <td>
                      <span className="user-id">{getUserId(user, index)}</span>
                    </td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <span className="user-name">
                            {user.full_name || user.email.split('@')[0]}
                          </span>
                          <span className="user-email-small">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${getUserRole(user).toLowerCase().replace('/', '-')}`}>
                        {getUserRole(user)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'suspended'}`}>
                        {user.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="action-btn view" title="View Details">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                          </svg>
                        </button>
                        <button className="action-btn edit" title="Edit User">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button 
                          className={`action-btn toggle ${user.is_active ? 'suspend' : 'activate'}`}
                          title={user.is_active ? 'Suspend User' : 'Activate User'}
                          onClick={() => handleStatusChange(user._id, !user.is_active)}
                        >
                          {user.is_active ? 
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                            :
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          }
                        </button>
                        {!user.is_superuser && (
                          <button 
                            className="action-btn delete" 
                            title="Delete User"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    <div className="no-data-content">
                      <span className="no-data-icon">👥</span>
                      <p>No users found</p>
                      <small>
                        {totalUsers === 0 
                          ? "The user database is empty. Click 'Add New User' to create the first user." 
                          : "Try adjusting your filters or add a new user"}
                      </small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pagination-card">
        <div className="pagination">
          <span className="pagination-info">
            Showing {users.length} of {totalUsers} users
          </span>
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L12 2L3 7V9H4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V9H21ZM12 8C13.66 8 15 9.34 15 11C15 12.66 13.66 14 12 14C10.34 14 9 12.66 9 11C9 9.34 10.34 8 12 8Z"/>
                  </svg>
                </div>
                <div>
                  <h2>Add New User</h2>
                  <p>Create a new user account with appropriate permissions</p>
                </div>
              </div>
              <button 
                className="modal-close-btn"
                onClick={handleModalClose}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddUser} className="modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">
                    <span className="label-text">Email Address</span>
                    <span className="label-required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      className="form-input"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="user@example.com"
                      required
                      disabled={isSubmitting}
                    />
                    <div className="input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-text">Password</span>
                    <span className="label-required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      className="form-input"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="••••••••"
                      required
                      minLength="6"
                      disabled={isSubmitting}
                    />
                    <div className="input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10 C20,8.9,19.1,8,18,8z M12,17c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S13.1,17,12,17z M15.1,8H8.9V6c0-1.71,1.39-3.1,3.1-3.1 s3.1,1.39,3.1,3.1V8z"/>
                      </svg>
                    </div>
                  </div>
                  <small className="form-hint">Minimum 6 characters</small>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-text">Full Name</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                      placeholder="John Doe"
                      disabled={isSubmitting}
                    />
                    <div className="input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">
                    <span className="label-text">Role</span>
                    <span className="label-required">*</span>
                  </label>
                  <div className="select-wrapper">
                    <select
                      className="form-select"
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      disabled={isSubmitting}
                    >
                      <option value="Patient">Patient - Regular user with basic access</option>
                      <option value="Doctor">Doctor/Staff - Healthcare provider access</option>
                      <option value="Administrator">Administrator - Full system access</option>
                    </select>
                    <div className="select-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 10l5 5 5-5z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleModalClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="btn-spinner"></div>
                      Creating User...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                      Add User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}