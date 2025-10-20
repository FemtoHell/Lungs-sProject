import React, { useState, useEffect } from 'react';
import './PatientDashboard.css';
import BookAppointment from './BookAppointment';
import ViewResults from './ViewResults';
import PatientProfile from './PatientProfile';

export default function PatientDashboard({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalScans: 0,
    pendingResults: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPatientData();
    }
  }, [user]);

  const loadPatientData = async () => {
    setLoading(true);
    await Promise.all([
      loadPatientStats(),
      loadUpcomingAppointments(),
      loadRecentResults()
    ]);
    setLoading(false);
  };

  const loadPatientStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/patient/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading patient stats:', error);
    }
  };

  const loadUpcomingAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/patient/appointments/upcoming?limit=3', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadRecentResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/patient/results/recent?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentResults(data.results || []);
      }
    } catch (error) {
      console.error('Error loading recent results:', error);
    }
  };

  const formatAppointmentDate = (dateString) => {
    if (!dateString) return { day: '?', month: '?' };
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
    };
  };

  const formatResultDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="patient-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Render Book Appointment page
  if (currentPage === 'book-appointment') {
    return <BookAppointment user={user} onLogout={onLogout} onNavigate={handleNavigate} />;
  }

  // Render View Results page
  if (currentPage === 'view-results') {
    return <ViewResults user={user} onLogout={onLogout} onNavigate={handleNavigate} />;
  }

  // Render Patient Profile page
  if (currentPage === 'profile') {
    return <PatientProfile user={user} onLogout={onLogout} onNavigate={handleNavigate} />;
  }

  // Render Dashboard (default)
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
            <div 
              className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigate('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </div>
            <div 
              className={`nav-item ${currentPage === 'book-appointment' ? 'active' : ''}`}
              onClick={() => handleNavigate('book-appointment')}
            >
              <span className="nav-icon">📅</span>
              <span className="nav-text">Book Appointment</span>
            </div>
            <div 
              className={`nav-item ${currentPage === 'view-results' ? 'active' : ''}`}
              onClick={() => handleNavigate('view-results')}
            >
              <span className="nav-icon">📋</span>
              <span className="nav-text">My Results</span>
            </div>
            <div 
              className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`}
              onClick={() => handleNavigate('profile')}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-text">Profile</span>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="patient-content-area">
          {/* Welcome Section */}
          <div className="patient-welcome-section">
            <h1 className="patient-welcome-title">
              Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'Patient'}!
            </h1>
            <p className="patient-welcome-subtitle">Here's your health overview</p>
          </div>

          {/* Quick Stats */}
          <div className="patient-quick-stats">
            <div className="patient-stat-card">
              <div className="stat-icon stat-icon-green">📅</div>
              <div className="stat-content">
                <div className="stat-number">{stats.upcomingAppointments}</div>
                <div className="stat-label">Upcoming Appointments</div>
              </div>
            </div>

            <div className="patient-stat-card">
              <div className="stat-icon stat-icon-blue">📊</div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalScans}</div>
                <div className="stat-label">Total Scans</div>
              </div>
            </div>

            <div className="patient-stat-card">
              <div className="stat-icon stat-icon-purple">⏳</div>
              <div className="stat-content">
                <div className="stat-number">{stats.pendingResults}</div>
                <div className="stat-label">Pending Results</div>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="patient-dashboard-grid">
            {/* Left Column - Upcoming Appointments */}
            <div className="patient-card">
              <div className="patient-card-header">
                <h3 className="card-title">
                  <span className="card-icon">📅</span>
                  Upcoming Appointments
                </h3>
                <button 
                  className="view-all-btn"
                  onClick={() => handleNavigate('book-appointment')}
                >
                  View All
                </button>
              </div>
              <div className="patient-card-body">
                {appointments.length > 0 ? (
                  <div className="appointments-list">
                    {appointments.map((appointment, index) => {
                      const dateInfo = formatAppointmentDate(appointment.appointmentDate);
                      return (
                        <div key={appointment.id || index} className="appointment-item">
                          <div className="appointment-date">
                            <div className="appointment-day">{dateInfo.day}</div>
                            <div className="appointment-month">{dateInfo.month}</div>
                          </div>
                          <div className="appointment-details">
                            <h4 className="appointment-title">{appointment.type || 'General Checkup'}</h4>
                            <p className="appointment-doctor">Dr. {appointment.doctorName || 'TBA'}</p>
                            <p className="appointment-time">
                              🕐 {appointment.time || '10:00 AM'}
                            </p>
                          </div>
                          <span className={`appointment-status status-${appointment.status?.toLowerCase() || 'pending'}`}>
                            {appointment.status || 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-data">
                    <div className="no-data-icon">📅</div>
                    <p className="no-data-text">No upcoming appointments</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Quick Actions & Recent Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Quick Actions */}
              <div className="patient-card">
                <div className="patient-card-header">
                  <h3 className="card-title">
                    <span className="card-icon">⚡</span>
                    Quick Actions
                  </h3>
                </div>
                <div className="patient-card-body">
                  <div className="quick-actions-grid">
                    <button 
                      className="action-btn-large"
                      onClick={() => handleNavigate('book-appointment')}
                    >
                      <div className="action-btn-icon">📅</div>
                      <div className="action-btn-content">
                        <h4 className="action-btn-title">Book Appointment</h4>
                        <p className="action-btn-subtitle">Schedule a consultation</p>
                      </div>
                      <span className="action-arrow">→</span>
                    </button>

                    <button 
                      className="action-btn-large"
                      onClick={() => handleNavigate('view-results')}
                    >
                      <div className="action-btn-icon">📋</div>
                      <div className="action-btn-content">
                        <h4 className="action-btn-title">View Results</h4>
                        <p className="action-btn-subtitle">Check your scan results</p>
                      </div>
                      <span className="action-arrow">→</span>
                    </button>

                    <button 
                      className="action-btn-large"
                      onClick={() => handleNavigate('profile')}
                    >
                      <div className="action-btn-icon">👤</div>
                      <div className="action-btn-content">
                        <h4 className="action-btn-title">Update Profile</h4>
                        <p className="action-btn-subtitle">Manage your information</p>
                      </div>
                      <span className="action-arrow">→</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Results */}
              <div className="patient-card">
                <div className="patient-card-header">
                  <h3 className="card-title">
                    <span className="card-icon">📋</span>
                    Recent Results
                  </h3>
                  <button 
                    className="view-all-btn"
                    onClick={() => handleNavigate('view-results')}
                  >
                    View All
                  </button>
                </div>
                <div className="patient-card-body">
                  {recentResults.length > 0 ? (
                    <div className="results-list">
                      {recentResults.map((result, index) => (
                        <div 
                          key={result.id || index} 
                          className="result-item"
                          onClick={() => handleNavigate('view-results')}
                        >
                          <div className="result-icon">📄</div>
                          <div className="result-info">
                            <h4 className="result-title">{result.scanType || 'Chest X-Ray'}</h4>
                            <p className="result-date">{formatResultDate(result.date)}</p>
                          </div>
                          <span className={`result-status status-${result.status?.toLowerCase() || 'normal'}`}>
                            {result.status || 'Normal'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-data">
                      <div className="no-data-icon">📋</div>
                      <p className="no-data-text">No recent results</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}