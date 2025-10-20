import React, { useState, useEffect } from 'react';
import './Reports.css';

export default function Reports({ user, onLogout, onNavigate }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [showFilters, setShowFilters] = useState(true);
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0,
    limit: 10
  });

  const [filters, setFilters] = useState({
    search: '',
    reportType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [stats, setStats] = useState({
    totalReports: 0,
    completedReports: 0,
    pendingReports: 0,
    thisMonthReports: 0
  });

  useEffect(() => {
    loadReports();
    loadReportStats();
  }, [pagination.currentPage, filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.reportType && { reportType: filters.reportType }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });
      
      const response = await fetch(`/doctor/reports?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setPagination(prev => ({
          ...prev,
          ...data.pagination
        }));
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/doctor/report-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading report stats:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      reportType: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const handleViewReport = (reportId) => {
    // Navigate to report detail page or open modal
    console.log('View report:', reportId);
    alert(`Opening report ${reportId}...`);
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/doctor/reports/${reportId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    }
  };

  const handleShareReport = (reportId) => {
    // Open share modal
    console.log('Share report:', reportId);
    alert(`Share report ${reportId} via email or link...`);
  };

  const handleGenerateReport = () => {
    // Navigate to AI Diagnosis or open report generation modal
    onNavigate('diagnosis');
  };

  const handleExportAll = async () => {
    if (window.confirm('Export all reports as ZIP file?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/doctor/reports/export-all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `all_reports_${new Date().toISOString().split('T')[0]}.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          alert('Failed to export reports');
        }
      } catch (error) {
        console.error('Error exporting reports:', error);
        alert('Error exporting reports');
      }
    }
  };

  const formatDate = (dateString) => {
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
    return name.charAt(0).toUpperCase();
  };

  const getReportTypeClass = (type) => {
    const typeMap = {
      'Chest X-Ray': 'xray',
      'CT Scan': 'ct',
      'MRI': 'mri'
    };
    return typeMap[type] || 'xray';
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'Completed': 'completed',
      'Pending': 'pending',
      'Draft': 'draft'
    };
    return statusMap[status] || 'pending';
  };

  const renderTableView = () => (
    <div className="reports-table-container">
      {loading ? (
        <div className="reports-loading">
          <div className="loading-spinner">Loading reports...</div>
        </div>
      ) : reports.length > 0 ? (
        <table className="reports-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Patient</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Doctor</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="report-id">{report.reportId}</td>
                <td>
                  <div className="report-patient-info">
                    <div className="patient-avatar-small">
                      {getPatientAvatar(report.patientName)}
                    </div>
                    <span className="patient-name-small">{report.patientName}</span>
                  </div>
                </td>
                <td>
                  <span className={`report-type-badge type-${getReportTypeClass(report.reportType)}`}>
                    {report.reportType}
                  </span>
                </td>
                <td>
                  <span className={`report-status-badge status-${getStatusClass(report.status)}`}>
                    {report.status}
                  </span>
                </td>
                <td className="report-date">{formatDate(report.createdAt)}</td>
                <td className="report-date">{report.doctorName || 'N/A'}</td>
                <td>
                  <div className="report-actions">
                    <button 
                      className="report-action-btn view-report-btn" 
                      onClick={() => handleViewReport(report.id)}
                      title="View Report"
                    >
                      👁️
                    </button>
                    <button 
                      className="report-action-btn download-report-btn" 
                      onClick={() => handleDownloadReport(report.id)}
                      title="Download PDF"
                    >
                      📥
                    </button>
                    <button 
                      className="report-action-btn share-report-btn" 
                      onClick={() => handleShareReport(report.id)}
                      title="Share Report"
                    >
                      📤
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="no-reports">
          <div className="no-reports-icon">📋</div>
          <h3 className="no-reports-title">No Reports Found</h3>
          <p className="no-reports-subtitle">Try adjusting your filters or create a new report</p>
          <button className="create-first-report-btn" onClick={handleGenerateReport}>
            Create First Report
          </button>
        </div>
      )}
    </div>
  );

  const renderGridView = () => (
    <div className="reports-grid">
      {loading ? (
        <div className="reports-loading">
          <div className="loading-spinner">Loading reports...</div>
        </div>
      ) : reports.length > 0 ? (
        reports.map((report) => (
          <div key={report.id} className="report-card" onClick={() => handleViewReport(report.id)}>
            <div className="report-card-header">
              <span className="report-card-id">{report.reportId}</span>
              <span className={`report-status-badge status-${getStatusClass(report.status)}`}>
                {report.status}
              </span>
            </div>
            
            <div className="report-card-patient">
              <div className="patient-avatar-small">
                {getPatientAvatar(report.patientName)}
              </div>
              <div>
                <div className="patient-name-small">{report.patientName}</div>
                <span className={`report-type-badge type-${getReportTypeClass(report.reportType)}`}>
                  {report.reportType}
                </span>
              </div>
            </div>

            <div className="report-card-details">
              <div className="report-detail-row">
                <span className="detail-icon">📅</span>
                <span>{formatDate(report.createdAt)}</span>
              </div>
              <div className="report-detail-row">
                <span className="detail-icon">👨‍⚕️</span>
                <span>{report.doctorName || 'N/A'}</span>
              </div>
              {report.diagnosis && (
                <div className="report-detail-row">
                  <span className="detail-icon">🔬</span>
                  <span>{report.diagnosis}</span>
                </div>
              )}
            </div>

            <div className="report-card-footer">
              <div className="report-card-actions">
                <button 
                  className="report-action-btn view-report-btn" 
                  onClick={(e) => { e.stopPropagation(); handleViewReport(report.id); }}
                  title="View Report"
                >
                  👁️
                </button>
                <button 
                  className="report-action-btn download-report-btn" 
                  onClick={(e) => { e.stopPropagation(); handleDownloadReport(report.id); }}
                  title="Download PDF"
                >
                  📥
                </button>
                <button 
                  className="report-action-btn share-report-btn" 
                  onClick={(e) => { e.stopPropagation(); handleShareReport(report.id); }}
                  title="Share Report"
                >
                  📤
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="no-reports">
          <div className="no-reports-icon">📋</div>
          <h3 className="no-reports-title">No Reports Found</h3>
          <p className="no-reports-subtitle">Try adjusting your filters or create a new report</p>
          <button className="create-first-report-btn" onClick={handleGenerateReport}>
            Create First Report
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="doctor-dashboard">
      {/* Top Header */}
      <div className="doctor-top-header">
        <div className="doctor-top-left">
          <div className="doctor-logo-small">
            <img src="/images/DH_VLU.png" alt="VLU Logo" className="logo-image" />
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
            <a href="#" className="nav-item" onClick={() => onNavigate('dashboard')}>
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </a>
            <a href="#" className="nav-item" onClick={() => onNavigate('upload')}>
              <span className="nav-icon">⬆️</span>
              <span className="nav-text">Upload Scan</span>
            </a>
            <a href="#" className="nav-item" onClick={() => onNavigate('diagnosis')}>
              <span className="nav-icon">🧠</span>
              <span className="nav-text">AI Diagnosis</span>
            </a>
            <a href="#" className="nav-item" onClick={() => onNavigate('patients')}>
              <span className="nav-icon">👥</span>
              <span className="nav-text">Patient Records</span>
            </a>
            <a href="#" className="nav-item active">
              <span className="nav-icon">📋</span>
              <span className="nav-text">Reports</span>
            </a>
            <a href="#" className="nav-item" onClick={() => onNavigate('settings')}>
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Settings</span>
            </a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="doctor-content-area">
          <div className="reports-page">
            {/* Page Header */}
            <div className="reports-header">
              <div className="reports-header-left">
                <h1 className="reports-title">Medical Reports</h1>
                <p className="reports-subtitle">View, manage, and generate diagnostic reports</p>
              </div>
              <div className="reports-header-actions">
                <button className="export-all-btn" onClick={handleExportAll}>
                  <span>📦</span>
                  Export All
                </button>
                <button className="generate-report-btn" onClick={handleGenerateReport}>
                  <span>➕</span>
                  Generate Report
                </button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="reports-stats">
              <div className="report-stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon stat-icon-blue">📋</div>
                </div>
                <h3 className="stat-value">{stats.totalReports}</h3>
                <p className="stat-label">Total Reports</p>
                <div className="stat-trend trend-up">
                  ↑ 12% from last month
                </div>
              </div>

              <div className="report-stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon stat-icon-green">✓</div>
                </div>
                <h3 className="stat-value">{stats.completedReports}</h3>
                <p className="stat-label">Completed</p>
                <div className="stat-trend trend-up">
                  ↑ 8% completion rate
                </div>
              </div>

              <div className="report-stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon stat-icon-orange">⏳</div>
                </div>
                <h3 className="stat-value">{stats.pendingReports}</h3>
                <p className="stat-label">Pending Review</p>
                <div className="stat-trend trend-down">
                  ↓ 5% from yesterday
                </div>
              </div>

              <div className="report-stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon stat-icon-purple">📅</div>
                </div>
                <h3 className="stat-value">{stats.thisMonthReports}</h3>
                <p className="stat-label">This Month</p>
                <div className="stat-trend trend-up">
                  ↑ 15% vs last month
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="reports-filters-section">
              <div className="filters-header">
                <h3 className="filters-title">Filters</h3>
                <button className="toggle-filters-btn" onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? '▲ Hide' : '▼ Show'}
                </button>
              </div>

              {showFilters && (
                <>
                  <div className="filters-content">
                    <div className="filter-group">
                      <label className="filter-label">Search</label>
                      <input
                        type="text"
                        className="filter-input"
                        placeholder="Report ID, Patient name..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Report Type</label>
                      <select
                        className="filter-select"
                        value={filters.reportType}
                        onChange={(e) => handleFilterChange('reportType', e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="Chest X-Ray">Chest X-Ray</option>
                        <option value="CT Scan">CT Scan</option>
                        <option value="MRI">MRI</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Status</label>
                      <select
                        className="filter-select"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Date From</label>
                      <input
                        type="date"
                        className="filter-input"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="filters-actions">
                    <button className="apply-filters-btn" onClick={loadReports}>
                      Apply Filters
                    </button>
                    <button className="clear-filters-btn" onClick={clearFilters}>
                      Clear Filters
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Reports List */}
            <div className="reports-list-section">
              <div className="reports-list-header">
                <div className="list-header-left">
                  <h3 className="list-title">Reports List</h3>
                  <div className="list-count">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalReports)} of {pagination.totalReports} reports
                  </div>
                </div>
                <div className="list-header-right">
                  <div className="view-toggle">
                    <button 
                      className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setViewMode('table')}
                    >
                      📊 Table
                    </button>
                    <button 
                      className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      🔲 Grid
                    </button>
                  </div>

                  <div className="sort-group">
                    <label className="sort-label">Sort by:</label>
                    <select
                      className="sort-select"
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        handleFilterChange('sortBy', sortBy);
                        handleFilterChange('sortOrder', sortOrder);
                      }}
                    >
                      <option value="created_at-desc">Newest First</option>
                      <option value="created_at-asc">Oldest First</option>
                      <option value="patient_name-asc">Patient Name (A-Z)</option>
                      <option value="patient_name-desc">Patient Name (Z-A)</option>
                      <option value="status-asc">Status</option>
                    </select>
                  </div>
                </div>
              </div>

              {viewMode === 'table' ? renderTableView() : renderGridView()}

              {/* Pagination */}
              {reports.length > 0 && (
                <div className="reports-pagination">
                  <div className="pagination-info">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="page-btn"
                      disabled={!pagination.hasPrev}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                      Previous
                    </button>
                    
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = index + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = index + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + index;
                      } else {
                        pageNum = pagination.currentPage - 2 + index;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`page-btn ${pageNum === pagination.currentPage ? 'page-btn-active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      className="page-btn"
                      disabled={!pagination.hasNext}
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}