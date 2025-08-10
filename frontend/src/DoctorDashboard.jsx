import React, { useState, useEffect } from 'react';
import './DoctorDashboard.css';

export default function DoctorDashboard() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todaysScans: 0,
    pendingReviews: 0,
    completedScans: 0,
    abnormalFindings: 0
  });

  const [latestScans, setLatestScans] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkDoctorAuthAndLoadData();
  }, []);

  const checkDoctorAuthAndLoadData = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.log('❌ Token expired');
          handleDoctorLogout();
          return;
        }
        
        // Check if user has doctor privileges (not admin)
        if (!payload.is_staff || payload.is_superuser) {
          console.log('❌ User is not a doctor or is admin');
          alert('Access denied. Doctor privileges required.');
          handleDoctorLogout();
          return;
        }
        
        console.log('✅ User authenticated as doctor:', payload.email);
        setUser(payload);
        
        // Load all dashboard data
        await Promise.all([
          loadDoctorDashboardStats(),
          loadDoctorRecentScans(),
          loadDoctorRecentPatients()
        ]);
        
      } catch (error) {
        console.error('Error decoding token:', error);
        handleDoctorLogout();
      }
    } else {
      console.log('❌ No token found');
      handleDoctorLogout();
    }
    setLoading(false);
  };

  const loadDoctorDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Loading doctor dashboard stats...');
      
      const response = await fetch('/doctor/dashboard-stats', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Doctor dashboard stats loaded:', data);
        setStats(data);
        setError('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to load doctor dashboard stats:', errorData);
        setError('Failed to load dashboard statistics');
      }
    } catch (error) {
      console.error('Error loading doctor dashboard stats:', error);
      setError('Network error loading dashboard data');
    }
  };

  const loadDoctorRecentScans = async () => {
    setLoadingScans(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Loading doctor recent scans...');
      
      const response = await fetch('/doctor/recent-scans?limit=4', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Doctor recent scans loaded:', data.scans?.length || 0, 'scans');
        
        // Transform data cho UI
        const transformedScans = (data.scans || []).map(scan => ({
          id: scan.id,
          patientName: scan.patientName,
          time: formatDoctorScanTime(scan.timestamp),
          status: scan.status,
          avatar: getDoctorPatientAvatar(scan.patientName),
          recordId: scan.recordId
        }));
        
        setLatestScans(transformedScans);
      } else {
        console.error('❌ Failed to load doctor recent scans');
        setLatestScans([]);
      }
    } catch (error) {
      console.error('Error loading doctor recent scans:', error);
      setLatestScans([]);
    }
    setLoadingScans(false);
  };

  const loadDoctorRecentPatients = async () => {
    setLoadingPatients(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Loading doctor recent patients...');
      
      const response = await fetch('/doctor/recent-patients?limit=3', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Doctor recent patients loaded:', data.patients?.length || 0, 'patients');
        setRecentPatients(data.patients || []);
      } else {
        console.error('❌ Failed to load doctor recent patients');
        setRecentPatients([]);
      }
    } catch (error) {
      console.error('Error loading doctor recent patients:', error);
      setRecentPatients([]);
    }
    setLoadingPatients(false);
  };

  // Helper functions
  const formatDoctorScanTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDoctorPatientAvatar = (name) => {
    if (!name || name === 'Unknown Patient') return '?';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleDoctorLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleDoctorNavigation = (page) => {
    setCurrentPage(page);
  };

  const handleDoctorRefreshData = async () => {
    console.log('🔄 Refreshing doctor dashboard data...');
    setError('');
    await Promise.all([
      loadDoctorDashboardStats(),
      loadDoctorRecentScans(),
      loadDoctorRecentPatients()
    ]);
  };

  const getDoctorStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#22c55e';
      case 'Processing': return '#f59e0b';
      case 'Alert': return '#ef4444';
      default: return '#64748b';
    }
  };

  const renderDoctorDashboard = () => (
    <div className="doctor-content">
      {/* Alert Banner for Pending Reviews */}
      {stats.pendingReviews > 0 && (
        <div className="doctor-alert-banner">
          <span className="doctor-alert-icon">⚠️</span>
          <span>{stats.pendingReviews} abnormal scans pending review</span>
          <button className="doctor-alert-action">→</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="doctor-stats-grid">
        <div className="doctor-stat-card">
          <div className="doctor-stat-icon">👥</div>
          <div className="doctor-stat-content">
            <div className="doctor-stat-value">{stats.totalPatients.toLocaleString()}</div>
            <div className="doctor-stat-label">Total Patients</div>
          </div>
        </div>
        
        <div className="doctor-stat-card">
          <div className="doctor-stat-icon">📊</div>
          <div className="doctor-stat-content">
            <div className="doctor-stat-value">{stats.todaysScans}</div>
            <div className="doctor-stat-label">Today's Scans</div>
          </div>
        </div>
        
        <div className="doctor-stat-card">
          <div className="doctor-stat-icon">⚠️</div>
          <div className="doctor-stat-content">
            <div className="doctor-stat-value">{stats.pendingReviews}</div>
            <div className="doctor-stat-label">Pending Reviews</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="doctor-main-grid">
        {/* Latest Scans */}
        <div className="doctor-card">
          <div className="doctor-card-header">
            <h3>Latest Scans</h3>
            <button className="doctor-view-all-btn">View All</button>
          </div>
          <div className="doctor-scans-list">
            {latestScans.length > 0 ? (
              latestScans.map(scan => (
                <div key={scan.id} className="doctor-scan-item">
                  <div className="doctor-scan-avatar">{scan.avatar}</div>
                  <div className="doctor-scan-info">
                    <div className="doctor-scan-patient">{scan.patientName}</div>
                    <div className="doctor-scan-time">{scan.time}</div>
                  </div>
                  <div 
                    className="doctor-scan-status"
                    style={{ color: getDoctorStatusColor(scan.status) }}
                  >
                    {scan.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="doctor-no-data">
                <div className="doctor-no-data-icon">📊</div>
                <p>No recent scans found</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="doctor-card">
          <div className="doctor-card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="doctor-quick-actions">
            <button className="doctor-action-btn doctor-upload">
              <div className="doctor-action-icon">⬆️</div>
              <div className="doctor-action-content">
                <div className="doctor-action-title">Upload New Scan</div>
                <div className="doctor-action-subtitle">Add patient imaging data</div>
              </div>
              <div className="doctor-action-arrow">→</div>
            </button>
            
            <button className="doctor-action-btn doctor-diagnosis">
              <div className="doctor-action-icon">🔍</div>
              <div className="doctor-action-content">
                <div className="doctor-action-title">Start Diagnosis</div>
                <div className="doctor-action-subtitle">Run AI analysis</div>
              </div>
              <div className="doctor-action-arrow">→</div>
            </button>
            
            <button className="doctor-action-btn doctor-reports">
              <div className="doctor-action-icon">📋</div>
              <div className="doctor-action-content">
                <div className="doctor-action-title">View Reports</div>
                <div className="doctor-action-subtitle">Access patient reports</div>
              </div>
              <div className="doctor-action-arrow">→</div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Patients Table */}
      <div className="doctor-card">
        <div className="doctor-card-header">
          <h3>Recent Patients</h3>
        </div>
        <div className="doctor-patients-table">
          {recentPatients.length > 0 ? (
            <table>
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
                    <td>{patient.name}</td>
                    <td>{patient.age || 'N/A'}</td>
                    <td>{patient.lastScan}</td>
                    <td>
                      <span className={`doctor-status-badge ${patient.status.toLowerCase()}`}>
                        {patient.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="doctor-no-data">
              <div className="doctor-no-data-icon">👥</div>
              <p>No patients found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDoctorContent = () => {
    switch (currentPage) {
      case 'upload':
        return <div className="doctor-page-content"><h1>Upload Scan</h1><p>Upload functionality coming soon...</p></div>;
      case 'diagnosis':
        return <div className="doctor-page-content"><h1>AI Diagnosis</h1><p>AI diagnosis tools coming soon...</p></div>;
      case 'patients':
        return <div className="doctor-page-content"><h1>Patient Records</h1><p>Patient management coming soon...</p></div>;
      case 'reports':
        return <div className="doctor-page-content"><h1>Reports</h1><p>Reports system coming soon...</p></div>;
      case 'settings':
        return <div className="doctor-page-content"><h1>Settings</h1><p>Settings panel coming soon...</p></div>;
      default:
        return renderDoctorDashboard();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="doctor-loading">
        <div className="doctor-loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <div className="doctor-loading">Authentication required</div>;
  }

  return (
    <div className="doctor-dashboard">
      {/* Sidebar */}
      <div className="doctor-sidebar">
        <div className="doctor-sidebar-header">
          <div className="doctor-logo">
            <div className="doctor-logo-icon">🫁</div>
            <div className="doctor-logo-text">
              <div className="doctor-brand-name">MediDiagnose AI</div>
            </div>
          </div>
        </div>
        
        <nav className="doctor-sidebar-nav">
          <div className="doctor-nav-section">
            <a 
              href="#" 
              className={`doctor-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleDoctorNavigation('dashboard'); }}
            >
              <span className="doctor-nav-icon">📊</span>
              Dashboard
            </a>
            <a 
              href="#" 
              className={`doctor-nav-item ${currentPage === 'upload' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleDoctorNavigation('upload'); }}
            >
              <span className="doctor-nav-icon">⬆️</span>
              Upload Scan
            </a>
            <a 
              href="#" 
              className={`doctor-nav-item ${currentPage === 'diagnosis' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleDoctorNavigation('diagnosis'); }}
            >
              <span className="doctor-nav-icon">🔍</span>
              AI Diagnosis
            </a>
            <a 
              href="#" 
              className={`doctor-nav-item ${currentPage === 'patients' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleDoctorNavigation('patients'); }}
            >
              <span className="doctor-nav-icon">👥</span>
              Patient Records
            </a>
            <a 
              href="#" 
              className={`doctor-nav-item ${currentPage === 'reports' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleDoctorNavigation('reports'); }}
            >
              <span className="doctor-nav-icon">📋</span>
              Reports
            </a>
            <a 
              href="#" 
              className={`doctor-nav-item ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleDoctorNavigation('settings'); }}
            >
              <span className="doctor-nav-icon">⚙️</span>
              Settings
            </a>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="doctor-main-content">
        <header className="doctor-header">
          <h1>Welcome back, Dr. {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Johnson'}!</h1>
          <div className="doctor-header-subtitle">Here's what's happening with your patients today.</div>
          <div className="doctor-header-right">
            <div className="doctor-user-info">
              <div className="doctor-user-avatar">👨‍⚕️</div>
              <span className="doctor-user-name">Dr. {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Johnson'}</span>
              <span className="doctor-user-role">Radiologist</span>
            </div>
            <button className="doctor-logout-btn" onClick={handleDoctorLogout}>Logout</button>
          </div>
        </header>

        {renderDoctorContent()}
      </div>
    </div>
  );
}