import React, { useState, useEffect } from 'react';
import './PatientRecords.css';

export default function PatientRecords({ user, onLogout, onNavigate }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPatients: 0,
    limit: 10
  });
  const [filters, setFilters] = useState({
    search: '',
    diagnosis: '',
    scanType: '',
    startDate: '',
    endDate: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [diagnosesList, setDiagnosesList] = useState([]);
  const [scanTypesList, setScanTypesList] = useState([]);

  useEffect(() => {
    loadPatients();
    loadFilterOptions();
  }, [pagination.currentPage, filters]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.diagnosis && { diagnosis: filters.diagnosis }),
        ...(filters.scanType && { scanType: filters.scanType }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });
      
      const response = await fetch(`/doctor/patients?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
        setPagination(prev => ({
          ...prev,
          ...data.pagination
        }));
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load diagnoses
      const diagnosesResponse = await fetch('/doctor/diagnoses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (diagnosesResponse.ok) {
        const diagnosesData = await diagnosesResponse.json();
        setDiagnosesList(diagnosesData.diagnoses || []);
      }
      
      // Load scan types
      const scanTypesResponse = await fetch('/doctor/scan-types', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (scanTypesResponse.ok) {
        const scanTypesData = await scanTypesResponse.json();
        setScanTypesList(scanTypesData.scanTypes || []);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
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
      diagnosis: '',
      scanType: '',
      startDate: '',
      endDate: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const formatScanTime = (timestamp) => {
    if (!timestamp) return 'No scans';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  const getPatientAvatar = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getDiagnosisStatusClass = (diagnosis) => {
    if (!diagnosis || diagnosis === 'No diagnosis' || diagnosis === 'No records') {
      return 'normal';
    }
    
    const abnormalTerms = ['abnormal', 'suspicious', 'concerning', 'positive', 'irregular', 'covid', 'pneumonia'];
    const diagnosisLower = diagnosis.toLowerCase();
    
    if (abnormalTerms.some(term => diagnosisLower.includes(term))) {
      return 'abnormal';
    }
    
    return 'normal';
  };

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
            <a href="#" className="nav-item" onClick={() => onNavigate && onNavigate('dashboard')}>
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </a>
            <a href="#" className="nav-item" onClick={() => onNavigate && onNavigate('upload')}>
              <span className="nav-icon">⬆️</span>
              <span className="nav-text">Upload Scan</span>
            </a>
            <a href="#" className="nav-item" onClick={() => onNavigate && onNavigate('diagnosis')}>
              <span className="nav-icon">🧠</span>
              <span className="nav-text">AI Diagnosis</span>
            </a>
            <a href="#" className="nav-item active">
              <span className="nav-icon">👥</span>
              <span className="nav-text">Patient Records</span>
            </a>
            <a href="#" className="nav-item" onClick={() => onNavigate && onNavigate('reports')}>
              <span className="nav-icon">📋</span>
              <span className="nav-text">Reports</span>
            </a>
            <a href="#" className="nav-item" onClick={() => onNavigate && onNavigate('settings')}>
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Settings</span>
            </a>
          </nav>
        </div>

        {/* Patient Records Content */}
        <div className="doctor-content-area">
          <div className="patient-records-page">
            {/* Page Header */}
            <div className="patient-records-header">
              <div className="page-header-left">
                <h1 className="page-title">Patient Records</h1>
                <p className="page-description">Manage and view patient medical records</p>
              </div>
              <button className="new-patient-btn">
                <span className="btn-icon">+</span>
                New Patient Record
              </button>
            </div>

            {/* Filters Section */}
            <div className="patient-filters-section">
              <div className="filters-row">
                <div className="filter-group">
                  <label className="filter-label">Search Patients</label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Name, ID, or Phone Number"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Diagnosis</label>
                  <select
                    className="filter-select"
                    value={filters.diagnosis}
                    onChange={(e) => handleFilterChange('diagnosis', e.target.value)}
                  >
                    <option value="">All Diagnoses</option>
                    {diagnosesList.map((diagnosis, index) => (
                      <option key={index} value={diagnosis}>{diagnosis}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Scan Type</label>
                  <select
                    className="filter-select"
                    value={filters.scanType}
                    onChange={(e) => handleFilterChange('scanType', e.target.value)}
                  >
                    <option value="">All Types</option>
                    {scanTypesList.map((scanType, index) => (
                      <option key={index} value={scanType}>{scanType}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Date Range</label>
                  <input
                    type="date"
                    className="filter-input filter-date"
                    placeholder="mm/dd/yyyy"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="filters-actions">
                <button className="apply-filters-btn" onClick={loadPatients}>
                  Apply Filters
                </button>
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Patient List Section */}
            <div className="patient-list-section">
              <div className="patient-list-header">
                <div className="list-header-left">
                  <h3 className="list-title">Patient List</h3>
                  <div className="list-count">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalPatients)} of {pagination.totalPatients} patients
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
                      <option value="created_at-desc">Last Scan Date</option>
                      <option value="full_name-asc">Name (A-Z)</option>
                      <option value="full_name-desc">Name (Z-A)</option>
                      <option value="date_of_birth-asc">Age (Youngest)</option>
                      <option value="date_of_birth-desc">Age (Oldest)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Patient Table */}
              <div className="patient-table-container">
                {loading ? (
                  <div className="patients-loading">
                    <div className="loading-spinner">Loading patients...</div>
                  </div>
                ) : patients.length > 0 ? (
                  <table className="patient-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Date of Birth</th>
                        <th>Gender</th>
                        <th>Last Diagnosis</th>
                        <th>Last Scan</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((patient) => (
                        <tr key={patient.id}>
                          <td className="patient-id">{patient.patientId}</td>
                          <td className="patient-name-cell">
                            <div className="patient-info">
                              <div className="patient-avatar">
                                {getPatientAvatar(patient.name)}
                              </div>
                              <div className="patient-details">
                                <div className="patient-name">{patient.name}</div>
                                <div className="patient-email">{patient.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="patient-dob">{patient.dateOfBirth}</td>
                          <td className="patient-gender">{patient.gender}</td>
                          <td className="patient-diagnosis">
                            <span className={`diagnosis-badge diagnosis-${getDiagnosisStatusClass(patient.lastDiagnosis)}`}>
                              {patient.lastDiagnosis === 'No records' ? 'Normal' : patient.lastDiagnosis}
                            </span>
                          </td>
                          <td className="patient-last-scan">{formatScanTime(patient.lastScan)}</td>
                          <td className="patient-actions">
                            <div className="action-buttons">
                              <button className="action-btn view-btn" title="View Details">
                                👁️
                              </button>
                              <button className="action-btn edit-btn" title="Edit Patient">
                                ✏️
                              </button>
                              <button className="action-btn delete-btn" title="Delete Patient">
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-patients">
                    <div className="no-patients-icon">👥</div>
                    <div className="no-patients-text">No patients found</div>
                    <div className="no-patients-subtitle">Try adjusting your search criteria</div>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {patients.length > 0 && (
                <div className="pagination-section">
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