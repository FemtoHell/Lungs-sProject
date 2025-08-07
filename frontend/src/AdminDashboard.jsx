import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalScans: 24630,
    activeDoctors: 114,
    abnormalRate: 23,
    systemUptime: 99.98
  });

  useEffect(() => {
    // Decode JWT to get user info
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
        
        // Load dashboard data
        loadDashboardData();
      } catch (error) {
        console.error('Error decoding token:', error);
        handleLogout();
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <div className="logo-icon">🩺</div>
          <h2>MediDiagnose AI</h2>
        </div>
        
        <nav className="nav-menu">
          <div className="nav-section">
            <h4>Main</h4>
            <a href="#" className="nav-item active">
              <span className="nav-icon">📊</span>
              Dashboard
            </a>
          </div>
          
          <div className="nav-section">
            <h4>Management</h4>
            <a href="#" className="nav-item">
              <span className="nav-icon">👥</span>
              Users
            </a>
            <a href="#" className="nav-item">
              <span className="nav-icon">📝</span>
              Logs
            </a>
          </div>
          
          <div className="nav-section">
            <h4>System</h4>
            <a href="#" className="nav-item">
              <span className="nav-icon">⚙️</span>
              Settings
            </a>
            <a href="#" className="nav-item">
              <span className="nav-icon">🔒</span>
              Security
            </a>
            <a href="#" className="nav-item">
              <span className="nav-icon">❓</span>
              Help
            </a>
          </div>
        </nav>
        
        <div className="ai-assistant">
          <div className="assistant-avatar">🤖</div>
          <div className="assistant-info">
            <div className="assistant-title">AI Assistant</div>
            <div className="assistant-status">Online</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="header-right">
            <div className="system-status">
              <span className="status-dot online"></span>
              System Online
            </div>
            <div className="user-info">
              <span className="user-name">System Admin</span>
              <span className="user-role">Administrator</span>
              <div className="user-avatar">👤</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div>
                  <h3>Total Scans</h3>
                  <div className="stat-value">{stats.totalScans.toLocaleString()}</div>
                </div>
                <div className="stat-icon blue">📋</div>
              </div>
              <div className="stat-change positive">
                <span className="arrow">↗</span>
                +12% from last month
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div>
                  <h3>Active Doctors</h3>
                  <div className="stat-value">{stats.activeDoctors}</div>
                </div>
                <div className="stat-icon green">👨‍⚕️</div>
              </div>
              <div className="stat-change positive">
                <span className="arrow">↗</span>
                +5% from last week
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div>
                  <h3>Abnormal Rate</h3>
                  <div className="stat-value">{stats.abnormalRate}%</div>
                </div>
                <div className="stat-icon orange">⚠️</div>
              </div>
              <div className="stat-change neutral">
                <span className="arrow">▲</span>
                Within normal range
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div>
                  <h3>System Uptime</h3>
                  <div className="stat-value">{stats.systemUptime}%</div>
                </div>
                <div className="stat-icon green">💻</div>
              </div>
              <div className="stat-change positive">
                <span className="arrow">●</span>
                Excellent performance
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Daily Scan Trend</h3>
                <select className="time-filter">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                </select>
              </div>
              <div className="chart-placeholder">
                <div className="chart-mock">
                  <div className="chart-bars">
                    <div className="bar" style={{height: '60%'}}></div>
                    <div className="bar" style={{height: '80%'}}></div>
                    <div className="bar" style={{height: '45%'}}></div>
                    <div className="bar" style={{height: '90%'}}></div>
                    <div className="bar" style={{height: '70%'}}></div>
                    <div className="bar" style={{height: '85%'}}></div>
                    <div className="bar" style={{height: '95%'}}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="chart-card">
              <div className="chart-header">
                <h3>Usage by Department</h3>
                <select className="time-filter">
                  <option>This month</option>
                  <option>Last month</option>
                  <option>Last 3 months</option>
                </select>
              </div>
              <div className="chart-placeholder">
                <div className="chart-mock">
                  <div className="pie-chart">
                    <div className="pie-segment"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent System Alerts */}
          <div className="alerts-section">
            <div className="section-header">
              <h3>Recent System Alerts</h3>
              <a href="#" className="view-all">View All</a>
            </div>
            
            <div className="alerts-list">
              <div className="alert-item error">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <h4>AI Processing Timeout</h4>
                  <p>Model response time exceeded 30 seconds for chest X-ray analysis</p>
                  <small>2 minutes ago</small>
                </div>
              </div>
              
              <div className="alert-item warning">
                <div className="alert-icon">⚡</div>
                <div className="alert-content">
                  <h4>High System Load</h4>
                  <p>CPU usage reached 85% during peak hours</p>
                  <small>15 minutes ago</small>
                </div>
              </div>
              
              <div className="alert-item info">
                <div className="alert-icon">ℹ️</div>
                <div className="alert-content">
                  <h4>Model Update Available</h4>
                  <p>New AI model version 2.1.3 is ready for deployment</p>
                  <small>1 hour ago</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}