import React, { useState, useEffect } from 'react';
import './DoctorDashboard.css';
import AIDiagnosis from './AIDiagnosis';
import PatientRecords from './PatientRecords';

export default function DoctorDashboard({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats] = useState({
    totalPatients: 0,
    todaysScans: 0,
    pendingReviews: 0
  });
  const [latestScans, setLatestScans] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDoctorData();
    }
  }, [user]);

  const loadDoctorData = async () => {
    setLoading(true);
    await Promise.all([
      loadDoctorDashboardStats(),
      loadDoctorRecentScans(),
      loadDoctorRecentPatients()
    ]);
    setLoading(false);
  };

  const loadDoctorDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/doctor/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const loadDoctorRecentScans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/doctor/recent-scans?limit=4', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLatestScans(data.scans || []);
      }
    } catch (error) {
      console.error('Error loading recent scans:', error);
    }
  };

  const loadDoctorRecentPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/doctor/recent-patients?limit=3', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentPatients(data.patients || []);
      }
    } catch (error) {
      console.error('Error loading recent patients:', error);
    }
  };

  const formatScanTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `Today, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPatientAvatar = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const handleQuickActionClick = (action) => {
    setCurrentPage(action);
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="doctor-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Render Patient Records page
  if (currentPage === 'patients') {
    return <PatientRecords user={user} onLogout={onLogout} onNavigate={setCurrentPage} />;
  }

  // Render AI Diagnosis page
  if (currentPage === 'diagnosis') {
    return <AIDiagnosis user={user} onLogout={onLogout} onNavigate={setCurrentPage} />;
  }

  // Render other pages (upload, reports, settings)
  if (currentPage === 'upload' || currentPage === 'reports' || currentPage === 'settings') {
    return (
      <div className="doctor-dashboard">
        <div className="doctor-top-header">
          <div className="doctor-top-left">
            <div className="doctor-logo-small">
              <span className="logo-icon">🫁</span>
              <span className="logo-text">MediDiagnose AI</span>
            </div>
          </div>
          <div className="doctor-top-right">
            <div className="notification-icon">
              <span className="notification-bell">🔔</span>
              <span className="notification-badge">3</span>
            </div>
            <div className="doctor-profile">
              <div className="profile-avatar">
                {getPatientAvatar(user?.full_name || user?.email)}
              </div>
              <div className="profile-info">
                <div className="profile-name">Dr. {user?.full_name || user?.email?.split('@')[0] || 'Johnson'}</div>
                <div className="profile-role">Radiologist</div>
              </div>
            </div>
            <button className="logout-button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="doctor-main-layout">
          <div className="doctor-sidebar">
            <nav className="sidebar-nav">
              <a href="#" className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
                <span className="nav-icon">📊</span>
                <span className="nav-text">Dashboard</span>
              </a>
              <a href="#" className={`nav-item ${currentPage === 'upload' ? 'active' : ''}`} onClick={() => setCurrentPage('upload')}>
                <span className="nav-icon">⬆️</span>
                <span className="nav-text">Upload Scan</span>
              </a>
              <a href="#" className={`nav-item ${currentPage === 'diagnosis' ? 'active' : ''}`} onClick={() => setCurrentPage('diagnosis')}>
                <span className="nav-icon">🧠</span>
                <span className="nav-text">AI Diagnosis</span>
              </a>
              <a href="#" className={`nav-item ${currentPage === 'patients' ? 'active' : ''}`} onClick={() => setCurrentPage('patients')}>
                <span className="nav-icon">👥</span>
                <span className="nav-text">Patient Records</span>
              </a>
              <a href="#" className={`nav-item ${currentPage === 'reports' ? 'active' : ''}`} onClick={() => setCurrentPage('reports')}>
                <span className="nav-icon">📋</span>
                <span className="nav-text">Reports</span>
              </a>
              <a href="#" className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => setCurrentPage('settings')}>
                <span className="nav-icon">⚙️</span>
                <span className="nav-text">Settings</span>
              </a>
            </nav>
          </div>

          <div className="doctor-content-area">
            <div className="page-content">
              <h1 className="page-title">
                {currentPage === 'upload' && 'Upload Scan'}
                {currentPage === 'reports' && 'Reports'}
                {currentPage === 'settings' && 'Settings'}
              </h1>
              <p className="page-description">
                {currentPage === 'upload' && 'Upload medical scans and images for analysis.'}
                {currentPage === 'reports' && 'View and generate medical reports.'}
                {currentPage === 'settings' && 'Configure system and user preferences.'}
              </p>
              <div className="coming-soon">
                <div className="coming-soon-icon">🚧</div>
                <div className="coming-soon-text">This feature is coming soon...</div>
                <button className="back-to-dashboard-btn" onClick={() => setCurrentPage('dashboard')}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Dashboard (default)
  return (
    <div className="doctor-dashboard">
      {/* Header Bar */}
      <div className="doctor-top-header">
        <div className="doctor-top-left">
          <div className="doctor-logo-small">
            <span className="logo-icon">🫁</span>
            <span className="logo-text">MediDiagnose AI</span>
          </div>
        </div>
        <div className="doctor-top-right">
          <div className="notification-icon">
            <span className="notification-bell">🔔</span>
            <span className="notification-badge">3</span>
          </div>
          <div className="doctor-profile">
            <div className="profile-avatar">
              {getPatientAvatar(user?.full_name || user?.email)}
            </div>
            <div className="profile-info">
              <div className="profile-name">Dr. {user?.full_name || user?.email?.split('@')[0] || 'Johnson'}</div>
              <div className="profile-role">Radiologist</div>
            </div>
          </div>
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="doctor-main-layout">
        {/* Sidebar */}
        <div className="doctor-sidebar">
          <nav className="sidebar-nav">
            <a href="#" className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </a>
            <a href="#" className={`nav-item ${currentPage === 'upload' ? 'active' : ''}`} onClick={() => setCurrentPage('upload')}>
              <span className="nav-icon">⬆️</span>
              <span className="nav-text">Upload Scan</span>
            </a>
            <a href="#" className={`nav-item ${currentPage === 'diagnosis' ? 'active' : ''}`} onClick={() => setCurrentPage('diagnosis')}>
              <span className="nav-icon">🧠</span>
              <span className="nav-text">AI Diagnosis</span>
            </a>
            <a href="#" className={`nav-item ${currentPage === 'patients' ? 'active' : ''}`} onClick={() => setCurrentPage('patients')}>
              <span className="nav-icon">👥</span>
              <span className="nav-text">Patient Records</span>
            </a>
            <a href="#" className={`nav-item ${currentPage === 'reports' ? 'active' : ''}`} onClick={() => setCurrentPage('reports')}>
              <span className="nav-icon">📋</span>
              <span className="nav-text">Reports</span>
            </a>
            <a href="#" className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => setCurrentPage('settings')}>
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Settings</span>
            </a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="doctor-content-area">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome back, Dr. {user?.full_name || user?.email?.split('@')[0] || 'Johnson'}!</h1>
            <p className="welcome-subtitle">Here's what's happening with your patients today.</p>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">👥</div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalPatients.toLocaleString()}</div>
                <div className="stat-label">Total Patients</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">📊</div>
              <div className="stat-content">
                <div className="stat-number">{stats.todaysScans}</div>
                <div className="stat-label">Today's Scans</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon stat-icon-orange">⚠️</div>
              <div className="stat-content">
                <div className="stat-number">{stats.pendingReviews}</div>
                <div className="stat-label">Pending Reviews</div>
              </div>
            </div>
          </div>

          {/* Alert Banner */}
          {stats.pendingReviews > 0 && (
            <div className="alert-banner">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">{stats.pendingReviews} abnormal scans pending review</span>
              <span className="alert-arrow" onClick={() => setCurrentPage('patients')}>→</span>
            </div>
          )}

          {/* Content Grid */}
          <div className="content-grid">
            {/* Latest Scans Card */}
            <div className="content-card">
              <div className="card-header">
                <h3 className="card-title">Latest Scans</h3>
                <button className="view-all-btn" onClick={() => setCurrentPage('patients')}>View All</button>
              </div>
              <div className="scans-list">
                {latestScans.length > 0 ? (
                  latestScans.map((scan, index) => (
                    <div key={scan.id || index} className="scan-item">
                      <div className="scan-avatar">
                        <div className="scan-image">📷</div>
                      </div>
                      <div className="scan-details">
                        <div className="scan-patient">{scan.patientName}</div>
                        <div className="scan-time">{formatScanTime(scan.timestamp)}</div>
                      </div>
                      <div className="scan-status">
                        <span className={`status-badge status-${scan.status?.toLowerCase() || 'processing'}`}>
                          {scan.status || 'Processing'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <div className="no-data-icon">📊</div>
                    <p className="no-data-text">No recent scans</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="content-card">
              <div className="card-header">
                <h3 className="card-title">Quick Actions</h3>
              </div>
              <div className="actions-list">
                <button className="action-item action-upload" onClick={() => handleQuickActionClick('upload')}>
                  <div className="action-icon action-icon-blue">⬆️</div>
                  <div className="action-content">
                    <div className="action-title">Upload Scan</div>
                    <div className="action-subtitle">Add new medical images</div>
                  </div>
                  <div className="action-arrow">→</div>
                </button>
                
                <button className="action-item action-diagnosis" onClick={() => handleQuickActionClick('diagnosis')}>
                  <div className="action-icon action-icon-green">🧠</div>
                  <div className="action-content">
                    <div className="action-title">AI Diagnosis</div>
                    <div className="action-subtitle">Run AI analysis</div>
                  </div>
                  <div className="action-arrow">→</div>
                </button>
                
                <button className="action-item action-reports" onClick={() => handleQuickActionClick('reports')}>
                  <div className="action-icon action-icon-purple">📋</div>
                  <div className="action-content">
                    <div className="action-title">View Reports</div>
                    <div className="action-subtitle">Access patient reports</div>
                  </div>
                  <div className="action-arrow">→</div>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Patients Table */}
          <div className="content-card patients-card">
            <div className="card-header">
              <h3 className="card-title">Recent Patients</h3>
            </div>
            <div className="patients-table-container">
              {recentPatients.length > 0 ? (
                <table className="patients-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Last Scan</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPatients.map((patient, index) => (
                      <tr key={patient.id || index}>
                        <td className="patient-name">{patient.name}</td>
                        <td className="patient-age">{patient.age || 'N/A'}</td>
                        <td className="patient-scan">{patient.lastScan}</td>
                        <td className="patient-status">
                          <span className={`status-badge status-${(patient.status || 'normal').toLowerCase()}`}>
                            {patient.status || 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">
                  <div className="no-data-icon">👥</div>
                  <p className="no-data-text">No patients found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}