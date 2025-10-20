import React, { useState, useEffect } from 'react';
import './ViewResults.css';

export default function ViewResults({ user, onLogout, onNavigate }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    scanType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadResults();
  }, [filters]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.scanType && { scanType: filters.scanType }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });
      
      const response = await fetch(`/patient/results?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      scanType: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const handleViewResult = (result) => {
    setSelectedResult(result);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResult(null);
  };

  const handleDownloadResult = async (resultId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/patient/results/${resultId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan_result_${resultId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download result');
      }
    } catch (error) {
      console.error('Error downloading result:', error);
      alert('Error downloading result');
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
            <div className="nav-item active">
              <span className="nav-icon">📋</span>
              <span className="nav-text">My Results</span>
            </div>
            <div className="nav-item" onClick={() => onNavigate('profile')}>
              <span className="nav-icon">👤</span>
              <span className="nav-text">Profile</span>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="patient-content-area">
          <div className="view-results-page">
            {/* Page Header */}
            <div className="results-header">
              <h1 className="results-title">My Scan Results</h1>
              <p className="results-subtitle">View and download your medical scan results</p>
            </div>

            {/* Filters Section */}
            <div className="results-filters-section">
              <div className="results-filters-grid">
                <div className="filter-group">
                  <label className="filter-label">Search</label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Search by scan type..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Scan Type</label>
                  <select
                    className="filter-select"
                    value={filters.scanType}
                    onChange={(e) => handleFilterChange('scanType', e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="chest-xray">Chest X-Ray</option>
                    <option value="ct-scan">CT Scan</option>
                    <option value="mri">MRI</option>
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
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="filters-actions">
                <button className="apply-filters-btn" onClick={loadResults}>
                  Apply Filters
                </button>
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Results List */}
            <div className="results-list-section">
              <div className="results-list-header">
                <div className="list-header-left">
                  <h3 className="list-title">Your Results</h3>
                  <div className="list-count">
                    Showing {results.length} result{results.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="list-header-right">
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
                      <option value="date-desc">Newest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="type-asc">Scan Type (A-Z)</option>
                      <option value="status-asc">Status</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Results Cards Grid */}
              {loading ? (
                <div className="results-loading">
                  <div className="loading-spinner">Loading results...</div>
                </div>
              ) : results.length > 0 ? (
                <div className="results-cards-grid">
                  {results.map((result) => (
                    <div key={result.id} className="result-card" onClick={() => handleViewResult(result)}>
                      <div className="result-card-header">
                        <div className="result-type-info">
                          <div className="result-type-icon">📄</div>
                          <div className="result-type-details">
                            <h4>{result.scanType || 'Chest X-Ray'}</h4>
                            <p className="result-date-small">{formatDate(result.date)}</p>
                          </div>
                        </div>
                        <span className={`result-status-badge status-${result.status?.toLowerCase() || 'normal'}`}>
                          {result.status || 'Normal'}
                        </span>
                      </div>

                      <div className="result-card-body">
                        <div className="result-detail-row">
                          <span className="detail-icon">👨‍⚕️</span>
                          <span className="result-detail-label">Doctor:</span>
                          <span>Dr. {result.doctorName || 'N/A'}</span>
                        </div>
                        <div className="result-detail-row">
                          <span className="detail-icon">🏥</span>
                          <span className="result-detail-label">Location:</span>
                          <span>{result.location || 'Main Clinic'}</span>
                        </div>

                        {result.findings && (
                          <div className="result-findings">
                            <h5 className="findings-title">Key Findings:</h5>
                            <p className="findings-text">
                              {result.findings.length > 100 
                                ? result.findings.substring(0, 100) + '...' 
                                : result.findings}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="result-card-footer">
                        <button 
                          className="result-action-btn view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewResult(result);
                          }}
                        >
                          <span>👁️</span>
                          View Details
                        </button>
                        <button 
                          className="result-action-btn download-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadResult(result.id);
                          }}
                        >
                          <span>📥</span>
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <div className="no-results-icon">📋</div>
                  <h3 className="no-results-title">No Results Found</h3>
                  <p className="no-results-subtitle">You don't have any scan results yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Result Detail Modal */}
      {showModal && selectedResult && (
        <div className="result-modal-overlay" onClick={handleCloseModal}>
          <div className="result-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="result-modal-header">
              <h2 className="result-modal-title">Scan Result Details</h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <div className="result-modal-body">
              {/* Scan Image */}
              {selectedResult.imageUrl && (
                <div className="result-detail-section">
                  <h3 className="section-title">Scan Image</h3>
                  <img 
                    src={selectedResult.imageUrl} 
                    alt="Scan result" 
                    className="result-scan-image"
                  />
                </div>
              )}

              {/* Basic Information */}
              <div className="result-detail-section">
                <h3 className="section-title">Basic Information</h3>
                <div className="result-info-grid">
                  <div className="info-item">
                    <span className="info-label">Scan Type</span>
                    <span className="info-value">{selectedResult.scanType || 'Chest X-Ray'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Date</span>
                    <span className="info-value">{formatDate(selectedResult.date)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Doctor</span>
                    <span className="info-value">Dr. {selectedResult.doctorName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status</span>
                    <span className={`result-status-badge status-${selectedResult.status?.toLowerCase() || 'normal'}`}>
                      {selectedResult.status || 'Normal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Findings */}
              <div className="result-detail-section">
                <h3 className="section-title">Detailed Findings</h3>
                <div className="findings-full">
                  <p>{selectedResult.findings || 'No detailed findings available.'}</p>
                </div>
              </div>

              {/* Recommendations */}
              {selectedResult.recommendations && (
                <div className="result-detail-section">
                  <h3 className="section-title">Recommendations</h3>
                  <div className="findings-full">
                    <p>{selectedResult.recommendations}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="result-modal-footer">
              <button 
                className="modal-btn modal-btn-secondary"
                onClick={handleCloseModal}
              >
                Close
              </button>
              <button 
                className="modal-btn modal-btn-primary"
                onClick={() => handleDownloadResult(selectedResult.id)}
              >
                <span>📥</span>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}