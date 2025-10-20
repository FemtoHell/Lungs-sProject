import React, { useState, useRef } from 'react';
import './UploadScan.css';

export default function UploadScan({ user, onLogout, onNavigate }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const fileInputRef = useRef(null);

  // Patient Info State
  const [patientSearch, setPatientSearch] = useState('');
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    patientId: '',
    age: '',
    gender: '',
    contact: '',
    notes: ''
  });

  // Scan Metadata State
  const [scanMetadata, setScanMetadata] = useState({
    scanType: 'chest-xray',
    scanDate: new Date().toISOString().split('T')[0],
    bodyPart: 'Chest',
    urgency: 'routine',
    referringDoctor: '',
    clinicalInfo: ''
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/dicom'];
      const validExtensions = ['.dcm', '.dicom'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      return validTypes.includes(file.type) || validExtensions.includes(fileExtension);
    });

    if (validFiles.length === 0) {
      alert('Please select valid image files (JPEG, PNG, DICOM)');
      return;
    }

    const newFiles = validFiles.map((file, index) => ({
      id: Date.now() + index,
      file: file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'application/dicom',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      uploadProgress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all files?')) {
      setUploadedFiles([]);
    }
  };

  const handlePatientInfoChange = (field, value) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScanMetadataChange = (field, value) => {
    setScanMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearchPatient = async () => {
    if (!patientSearch.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/doctor/search-patient?query=${patientSearch}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.patient) {
          setPatientInfo({
            name: data.patient.name || '',
            patientId: data.patient.patientId || '',
            age: data.patient.age || '',
            gender: data.patient.gender || '',
            contact: data.patient.contact || '',
            notes: ''
          });
        } else {
          alert('Patient not found. Please enter details manually.');
        }
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      alert('Error searching patient. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one scan image');
      return;
    }

    if (!patientInfo.name || !patientInfo.patientId) {
      alert('Please enter patient name and ID');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      
      // Add files
      uploadedFiles.forEach((fileItem, index) => {
        formData.append(`scans`, fileItem.file);
      });

      // Add patient info
      formData.append('patientInfo', JSON.stringify(patientInfo));
      
      // Add scan metadata
      formData.append('scanMetadata', JSON.stringify(scanMetadata));

      const token = localStorage.getItem('token');
      const response = await fetch('/doctor/upload-scans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
        
        // Reset form
        setUploadedFiles([]);
        setPatientInfo({
          name: '',
          patientId: '',
          age: '',
          gender: '',
          contact: '',
          notes: ''
        });
        setScanMetadata({
          scanType: 'chest-xray',
          scanDate: new Date().toISOString().split('T')[0],
          bodyPart: 'Chest',
          urgency: 'routine',
          referringDoctor: '',
          clinicalInfo: ''
        });
        setPatientSearch('');

        // Optionally navigate to patient records or AI diagnosis
        // onNavigate('patients');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to upload scans. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading scans:', error);
      alert('Error uploading scans. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (uploadedFiles.length > 0) {
      if (window.confirm('Are you sure you want to cancel? All uploaded files will be lost.')) {
        setUploadedFiles([]);
        setPatientInfo({
          name: '',
          patientId: '',
          age: '',
          gender: '',
          contact: '',
          notes: ''
        });
      }
    }
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
            <a href="#" className="nav-item active">
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
            <a href="#" className="nav-item" onClick={() => onNavigate('reports')}>
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
          <div className="upload-scan-page">
            {/* Page Header */}
            <div className="upload-scan-header">
              <h1 className="upload-scan-title">Upload Medical Scans</h1>
              <p className="upload-scan-subtitle">Upload chest X-rays, CT scans, or DICOM files for AI analysis</p>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="upload-success">
                <span className="success-icon">✓</span>
                Scans uploaded successfully! You can now run AI diagnosis.
              </div>
            )}

            {/* Upload Layout */}
            <div className="upload-layout">
              {/* Left Column - Upload Zone */}
              <div className="upload-zone-card">
                <div className="upload-zone-header">
                  <span className="upload-zone-icon">☁️</span>
                  <h3 className="upload-zone-title">Upload Files</h3>
                </div>
                <div className="upload-zone-body">
                  {/* Drop Zone */}
                  <div 
                    className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={handleBrowseClick}
                  >
                    <div className="drop-zone-content">
                      <div className="upload-icon-large">📂</div>
                      <h3 className="drop-zone-title">
                        {dragActive ? 'Drop files here' : 'Drag & drop your scans here'}
                      </h3>
                      <p className="drop-zone-description">or click to browse files</p>
                      <button className="browse-button" onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}>
                        Browse Files
                      </button>
                      <p className="supported-formats">
                        Supported formats: JPEG, PNG, DICOM (.dcm) • Max 50MB per file
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.dcm,.dicom"
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                  />

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="uploaded-files-section">
                      <div className="uploaded-files-header">
                        <h4 className="uploaded-files-title">
                          Uploaded Files ({uploadedFiles.length})
                        </h4>
                        <button className="clear-all-btn" onClick={handleClearAll}>
                          Clear All
                        </button>
                      </div>
                      <div className="uploaded-files-list">
                        {uploadedFiles.map(file => (
                          <div key={file.id} className="uploaded-file-item">
                            <div className="file-thumbnail">
                              {file.preview ? (
                                <img src={file.preview} alt={file.name} />
                              ) : (
                                <div className="file-icon-placeholder">📄</div>
                              )}
                            </div>
                            <div className="file-details">
                              <p className="file-name">{file.name}</p>
                              <div className="file-info">
                                <span>{file.size}</span>
                                <span>•</span>
                                <span>{file.type.includes('dicom') ? 'DICOM' : file.type.split('/')[1].toUpperCase()}</span>
                              </div>
                            </div>
                            <div className="file-actions">
                              <button className="file-action-btn" title="View">
                                👁️
                              </button>
                              <button 
                                className="file-action-btn delete-file-btn" 
                                onClick={() => handleDeleteFile(file.id)}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadedFiles.length === 0 && (
                    <div className="no-files-state">
                      <div className="no-files-icon">📭</div>
                      <p className="no-files-text">No files uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Patient Info & Metadata */}
              <div>
                {/* Patient Information Card */}
                <div className="patient-info-card">
                  <div className="patient-info-header">
                    <span className="patient-info-icon">👤</span>
                    <h3 className="patient-info-title">Patient Information</h3>
                  </div>
                  <div className="patient-info-body">
                    {/* Search Patient */}
                    <div className="patient-search-section">
                      <label className="search-label">Search Existing Patient</label>
                      <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Search by name, ID, or phone..."
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearchPatient()}
                        />
                      </div>
                    </div>

                    <div className="patient-form-divider">
                      <div className="divider-line"></div>
                      <span className="divider-text">OR ENTER MANUALLY</span>
                      <div className="divider-line"></div>
                    </div>

                    {/* Patient Form */}
                    <div className="patient-form-grid">
                      <div className="form-group">
                        <label className="form-label">Patient Name *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter patient name"
                          value={patientInfo.name}
                          onChange={(e) => handlePatientInfoChange('name', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Patient ID *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g., P-2024-001"
                          value={patientInfo.patientId}
                          onChange={(e) => handlePatientInfoChange('patientId', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Age</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Age"
                          value={patientInfo.age}
                          onChange={(e) => handlePatientInfoChange('age', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select
                          className="form-select"
                          value={patientInfo.gender}
                          onChange={(e) => handlePatientInfoChange('gender', e.target.value)}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="form-group form-group-full">
                        <label className="form-label">Contact Number</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="+84 123 456 789"
                          value={patientInfo.contact}
                          onChange={(e) => handlePatientInfoChange('contact', e.target.value)}
                        />
                      </div>

                      <div className="form-group form-group-full">
                        <label className="form-label">Clinical Notes</label>
                        <textarea
                          className="form-textarea"
                          placeholder="Any relevant clinical information..."
                          value={patientInfo.notes}
                          onChange={(e) => handlePatientInfoChange('notes', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Scan Metadata */}
                    <div className="scan-metadata-section">
                      <h4 className="metadata-title">Scan Details</h4>
                      <div className="metadata-grid">
                        <div className="form-group">
                          <label className="form-label">Scan Type</label>
                          <select
                            className="form-select"
                            value={scanMetadata.scanType}
                            onChange={(e) => handleScanMetadataChange('scanType', e.target.value)}
                          >
                            <option value="chest-xray">Chest X-Ray</option>
                            <option value="ct-scan">CT Scan</option>
                            <option value="mri">MRI</option>
                            <option value="ultrasound">Ultrasound</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Scan Date</label>
                          <input
                            type="date"
                            className="form-input"
                            value={scanMetadata.scanDate}
                            onChange={(e) => handleScanMetadataChange('scanDate', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Body Part</label>
                          <select
                            className="form-select"
                            value={scanMetadata.bodyPart}
                            onChange={(e) => handleScanMetadataChange('bodyPart', e.target.value)}
                          >
                            <option value="Chest">Chest</option>
                            <option value="Abdomen">Abdomen</option>
                            <option value="Head">Head</option>
                            <option value="Spine">Spine</option>
                            <option value="Extremities">Extremities</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Urgency Level</label>
                          <select
                            className="form-select"
                            value={scanMetadata.urgency}
                            onChange={(e) => handleScanMetadataChange('urgency', e.target.value)}
                          >
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                            <option value="emergency">Emergency</option>
                          </select>
                        </div>

                        <div className="form-group form-group-full">
                          <label className="form-label">Referring Doctor</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Name of referring physician"
                            value={scanMetadata.referringDoctor}
                            onChange={(e) => handleScanMetadataChange('referringDoctor', e.target.value)}
                          />
                        </div>

                        <div className="form-group form-group-full">
                          <label className="form-label">Clinical Information</label>
                          <textarea
                            className="form-textarea"
                            placeholder="Reason for scan, symptoms, medical history..."
                            value={scanMetadata.clinicalInfo}
                            onChange={(e) => handleScanMetadataChange('clinicalInfo', e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Section */}
                    <div className="submit-section">
                      <div className="submit-actions">
                        <button 
                          className="submit-btn cancel-btn" 
                          onClick={handleCancel}
                          disabled={isUploading}
                        >
                          Cancel
                        </button>
                        <button 
                          className={`submit-btn upload-submit-btn ${isUploading ? 'uploading' : ''}`}
                          onClick={handleSubmit}
                          disabled={isUploading || uploadedFiles.length === 0}
                        >
                          {isUploading ? (
                            <>
                              <span className="btn-icon">⏳</span>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <span className="btn-icon">⬆️</span>
                              Upload & Continue
                            </>
                          )}
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