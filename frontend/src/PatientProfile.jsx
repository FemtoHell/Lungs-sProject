import React, { useState, useEffect } from 'react';
import './PatientProfile.css';

export default function PatientProfile({ user, onLogout, onNavigate }) {
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    emergency_contact: '',
    blood_type: '',
    allergies: '',
    current_medications: ''
  });

  const [medicalHistory, setMedicalHistory] = useState([]);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalScans: 0,
    lastVisit: null
  });

  useEffect(() => {
    loadProfileData();
    loadMedicalHistory();
    loadPatientStats();
  }, []);

  const loadProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/patient/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data.profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadMedicalHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/patient/medical-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMedicalHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading medical history:', error);
    }
  };

  const loadPatientStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/patient/profile/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePersonalInfo = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/patient/profile/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: profileData.full_name,
          phone: profileData.phone,
          date_of_birth: profileData.date_of_birth,
          gender: profileData.gender,
          address: profileData.address,
          emergency_contact: profileData.emergency_contact
        })
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        setIsEditingPersonal(false);
        loadProfileData();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMedicalInfo = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/patient/profile/medical-info', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blood_type: profileData.blood_type,
          allergies: profileData.allergies,
          current_medications: profileData.current_medications
        })
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        setIsEditingMedical(false);
        loadProfileData();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update medical information');
      }
    } catch (error) {
      console.error('Error updating medical info:', error);
      alert('Error updating medical information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = (section) => {
    if (section === 'personal') {
      setIsEditingPersonal(false);
      loadProfileData(); // Reload to reset changes
    } else if (section === 'medical') {
      setIsEditingMedical(false);
      loadProfileData(); // Reload to reset changes
    }
  };

  const handleChangePassword = () => {
    alert('Password change functionality will open a modal here.');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion functionality will be implemented.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPatientAvatar = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="patient-dashboard">
      {/* Top Header */}
      <div className="patient-top-header">
        <div className="patient-top-left">
          <div className="patient-logo-small">
            <img src="/images/DH_VLU.png" alt="VLU Logo" className="logo-image" />
          </div>
        </div>
        <div className="patient-top-right">
          <div className="notification-icon">
            <span className="notification-bell">🔔</span>
            <span className="notification-badge">2</span>
          </div>
          <div className="patient-profile">
            <div className="profile-avatar">
              {getPatientAvatar(user?.full_name || user?.email)}
            </div>
            <div className="profile-info">
              <div className="profile-name">{user?.full_name || user?.email?.split('@')[0] || 'Patient'}</div>
              <div className="profile-role">Patient</div>
            </div>
          </div>
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="patient-main-layout">
        {/* Sidebar */}
        <div className="patient-sidebar">
          <nav className="sidebar-nav">
            <div className="nav-item" onClick={() => onNavigate('dashboard')}>
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </div>
            <div className="nav-item" onClick={() => onNavigate('book-appointment')}>
              <span className="nav-icon">📅</span>
              <span className="nav-text">Book Appointment</span>
            </div>
            <div className="nav-item" onClick={() => onNavigate('view-results')}>
              <span className="nav-icon">📋</span>
              <span className="nav-text">My Results</span>
            </div>
            <div className="nav-item active">
              <span className="nav-icon">👤</span>
              <span className="nav-text">Profile</span>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="patient-content-area">
          <div className="patient-profile-page">
            {/* Page Header */}
            <div className="profile-header">
              <h1 className="profile-title">My Profile</h1>
              <p className="profile-subtitle">Manage your personal information and medical records</p>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="success-message">
                <span className="success-icon">✓</span>
                Profile updated successfully!
              </div>
            )}

            {/* Profile Layout */}
            <div className="profile-layout">
              {/* Left Sidebar - Profile Summary */}
              <div className="profile-sidebar-card">
                <div className="profile-avatar-section">
                  <div className="profile-avatar-large">
                    {getPatientAvatar(profileData.full_name || user?.full_name || user?.email)}
                  </div>
                  <h2 className="profile-name-large">
                    {profileData.full_name || user?.full_name || 'Patient Name'}
                  </h2>
                  <p className="profile-email-large">
                    {profileData.email || user?.email || 'email@example.com'}
                  </p>
                </div>

                <div className="profile-stats-section">
                  <div className="profile-stat-item">
                    <div className="stat-item-left">
                      <div className="stat-item-icon">📅</div>
                      <span className="stat-item-label">Appointments</span>
                    </div>
                    <span className="stat-item-value">{stats.totalAppointments}</span>
                  </div>

                  <div className="profile-stat-item">
                    <div className="stat-item-left">
                      <div className="stat-item-icon">📊</div>
                      <span className="stat-item-label">Total Scans</span>
                    </div>
                    <span className="stat-item-value">{stats.totalScans}</span>
                  </div>

                  <div className="profile-stat-item">
                    <div className="stat-item-left">
                      <div className="stat-item-icon">🏥</div>
                      <span className="stat-item-label">Last Visit</span>
                    </div>
                    <span className="stat-item-value" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {formatDate(stats.lastVisit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Content - Profile Details */}
              <div className="profile-main-content">
                {/* Personal Information */}
                <div className="profile-section-card">
                  <div className="profile-section-header">
                    <div className="section-header-left">
                      <span className="section-icon">👤</span>
                      <h3 className="section-title">Personal Information</h3>
                    </div>
                    {!isEditingPersonal && (
                      <button className="edit-btn" onClick={() => setIsEditingPersonal(true)}>
                        <span>✏️</span>
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="profile-section-body">
                    {isEditingPersonal ? (
                      <>
                        <div className="profile-edit-grid">
                          <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                              type="text"
                              className="form-input"
                              value={profileData.full_name || ''}
                              onChange={(e) => handleInputChange('full_name', e.target.value)}
                              placeholder="Enter your full name"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                              type="tel"
                              className="form-input"
                              value={profileData.phone || ''}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              placeholder="+84 123 456 789"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Date of Birth</label>
                            <input
                              type="date"
                              className="form-input"
                              value={profileData.date_of_birth || ''}
                              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Gender</label>
                            <select
                              className="form-select"
                              value={profileData.gender || ''}
                              onChange={(e) => handleInputChange('gender', e.target.value)}
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="form-group form-group-full">
                            <label className="form-label">Address</label>
                            <input
                              type="text"
                              className="form-input"
                              value={profileData.address || ''}
                              onChange={(e) => handleInputChange('address', e.target.value)}
                              placeholder="Enter your address"
                            />
                          </div>

                          <div className="form-group form-group-full">
                            <label className="form-label">Emergency Contact</label>
                            <input
                              type="text"
                              className="form-input"
                              value={profileData.emergency_contact || ''}
                              onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                              placeholder="Name and phone number"
                            />
                          </div>
                        </div>

                        <div className="profile-form-actions">
                          <button className="btn-cancel" onClick={() => handleCancelEdit('personal')}>
                            Cancel
                          </button>
                          <button 
                            className="btn-save" 
                            onClick={handleSavePersonalInfo}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="profile-info-grid">
                        <div className="profile-info-item">
                          <span className="info-item-label">Full Name</span>
                          <span className="info-item-value">{profileData.full_name || 'Not set'}</span>
                        </div>

                        <div className="profile-info-item">
                          <span className="info-item-label">Email</span>
                          <span className="info-item-value">{profileData.email || 'Not set'}</span>
                        </div>

                        <div className="profile-info-item">
                          <span className="info-item-label">Phone</span>
                          <span className="info-item-value">{profileData.phone || 'Not set'}</span>
                        </div>

                        <div className="profile-info-item">
                          <span className="info-item-label">Date of Birth</span>
                          <span className="info-item-value">{formatDate(profileData.date_of_birth)}</span>
                        </div>

                        <div className="profile-info-item">
                          <span className="info-item-label">Gender</span>
                          <span className="info-item-value">{profileData.gender || 'Not set'}</span>
                        </div>

                        <div className="profile-info-item">
                          <span className="info-item-label">Emergency Contact</span>
                          <span className="info-item-value">{profileData.emergency_contact || 'Not set'}</span>
                        </div>

                        <div className="profile-info-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="info-item-label">Address</span>
                          <span className="info-item-value">{profileData.address || 'Not set'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medical Information */}
                <div className="profile-section-card">
                  <div className="profile-section-header">
                    <div className="section-header-left">
                      <span className="section-icon">🩺</span>
                      <h3 className="section-title">Medical Information</h3>
                    </div>
                    {!isEditingMedical && (
                      <button className="edit-btn" onClick={() => setIsEditingMedical(true)}>
                        <span>✏️</span>
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="profile-section-body">
                    {isEditingMedical ? (
                      <>
                        <div className="profile-edit-grid">
                          <div className="form-group">
                            <label className="form-label">Blood Type</label>
                            <select
                              className="form-select"
                              value={profileData.blood_type || ''}
                              onChange={(e) => handleInputChange('blood_type', e.target.value)}
                            >
                              <option value="">Select Blood Type</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </select>
                          </div>

                          <div className="form-group form-group-full">
                            <label className="form-label">Allergies</label>
                            <textarea
                              className="form-textarea"
                              value={profileData.allergies || ''}
                              onChange={(e) => handleInputChange('allergies', e.target.value)}
                              placeholder="List any allergies (medications, food, etc.)"
                              rows={3}
                            />
                          </div>

                          <div className="form-group form-group-full">
                            <label className="form-label">Current Medications</label>
                            <textarea
                              className="form-textarea"
                              value={profileData.current_medications || ''}
                              onChange={(e) => handleInputChange('current_medications', e.target.value)}
                              placeholder="List any medications you're currently taking"
                              rows={3}
                            />
                          </div>
                        </div>

                        <div className="profile-form-actions">
                          <button className="btn-cancel" onClick={() => handleCancelEdit('medical')}>
                            Cancel
                          </button>
                          <button 
                            className="btn-save" 
                            onClick={handleSaveMedicalInfo}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="profile-info-grid">
                        <div className="profile-info-item">
                          <span className="info-item-label">Blood Type</span>
                          <span className="info-item-value">{profileData.blood_type || 'Not set'}</span>
                        </div>

                        <div className="profile-info-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="info-item-label">Allergies</span>
                          <span className="info-item-value">{profileData.allergies || 'None reported'}</span>
                        </div>

                        <div className="profile-info-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="info-item-label">Current Medications</span>
                          <span className="info-item-value">{profileData.current_medications || 'None reported'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medical History */}
                <div className="profile-section-card">
                  <div className="profile-section-header">
                    <div className="section-header-left">
                      <span className="section-icon">📜</span>
                      <h3 className="section-title">Medical History</h3>
                    </div>
                  </div>

                  <div className="profile-section-body">
                    {medicalHistory.length > 0 ? (
                      <div className="medical-history-list">
                        {medicalHistory.map((item, index) => (
                          <div key={index} className="medical-history-item">
                            <div className="history-item-header">
                              <h4 className="history-item-title">{item.condition || 'Medical Event'}</h4>
                              <span className="history-item-date">{formatDate(item.date)}</span>
                            </div>
                            <p className="history-item-description">
                              {item.description || 'No description available'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-history">
                        <div className="no-history-icon">📜</div>
                        <p className="no-history-text">No medical history recorded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Settings */}
                <div className="profile-section-card">
                  <div className="profile-section-header">
                    <div className="section-header-left">
                      <span className="section-icon">🔒</span>
                      <h3 className="section-title">Security Settings</h3>
                    </div>
                  </div>

                  <div className="profile-section-body">
                    <div className="security-options">
                      <div className="security-option-item">
                        <div className="security-option-info">
                          <h4>Password</h4>
                          <p>Change your account password</p>
                        </div>
                        <button className="security-action-btn" onClick={handleChangePassword}>
                          Change Password
                        </button>
                      </div>

                      <div className="security-option-item">
                        <div className="security-option-info">
                          <h4>Delete Account</h4>
                          <p>Permanently delete your account and all data</p>
                        </div>
                        <button className="security-action-btn danger" onClick={handleDeleteAccount}>
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}