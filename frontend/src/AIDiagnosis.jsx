import React, { useState, useRef } from 'react';
import './AIDiagnosis.css';

export default function AIDiagnosis({ user, onLogout, onNavigate }) {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [patientInfoExpanded, setPatientInfoExpanded] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    gender: '',
    medicalHistory: ''
  });
  
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setUploadedImage(file);
        setFileName(file.name);
        setAnalysisResults(null); // Reset previous results
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file (JPEG, PNG, DICOM)');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleRunDiagnosis = async () => {
    if (!uploadedImage) {
      alert('Please upload an image first');
      return;
    }

    setIsAnalyzing(true);

    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock AI results
    const mockResults = {
      confidence: 94.7,
      abnormalities: [
        { name: 'Pneumonia', confidence: 87, severity: 'high' },
        { name: 'Small Nodule', confidence: 62, severity: 'medium' },
        { name: 'Mild Fibrosis', confidence: 45, severity: 'low' }
      ],
      analysis: "The AI analysis indicates signs of pneumonia in the lower right lobe with high confidence. A small nodule is detected in the upper left region requiring further investigation. Recommend immediate treatment for pneumonia and follow-up imaging for nodule monitoring."
    };

    setAnalysisResults(mockResults);
    setIsAnalyzing(false);
  };

  const handleSaveToRecord = () => {
    if (!analysisResults) {
      alert('Please run diagnosis first');
      return;
    }
    alert('Results saved to patient record successfully!');
  };

  const handleExportPDF = () => {
    if (!analysisResults) {
      alert('Please run diagnosis first');
      return;
    }
    alert('PDF report exported successfully!');
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
    <div className="ai-diagnosis">
      {/* Top Header */}
      <div className="ai-top-header">
        <div className="ai-top-left">
          <div className="ai-logo-small">
            <span className="logo-icon">🫁</span>
            <span className="logo-text">MediDiagnose AI</span>
          </div>
        </div>
        <div className="ai-top-right">
          <div className="notification-icon">
            <span className="notification-bell">🔔</span>
            <span className="notification-badge">3</span>
          </div>
          <div className="ai-profile">
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

      <div className="ai-main-layout">
        {/* Sidebar */}
        <div className="ai-sidebar">
          <nav className="sidebar-nav">
            <a href="#" className="nav-item" onClick={() => onNavigate('dashboard')}>
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </a>
            <a href="#" className="nav-item" onClick={() => onNavigate('upload')}>
              <span className="nav-icon">⬆️</span>
              <span className="nav-text">Upload Scan</span>
            </a>
            <a href="#" className="nav-item active">
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
        <div className="ai-content-area">
          {/* Header Section */}
          <div className="ai-header-section">
            <div className="ai-header-icon">🧠</div>
            <div className="ai-header-content">
              <h1 className="ai-title">AI-Powered Lung Diagnosis</h1>
              <p className="ai-subtitle">Upload chest X-ray or CT scan images for AI-assisted diagnosis and analysis</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="ai-main-grid">
            {/* Left Column - Upload */}
            <div className="ai-upload-section">
              <div className="upload-card">
                <div className="upload-header">
                  <span className="upload-icon">⬆️</span>
                  <span className="upload-title">Upload Medical Image</span>
                </div>
                
                <div 
                  className={`upload-area ${dragOver ? 'drag-over' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={handleChooseFile}
                >
                  <div className="upload-content">
                    <div className="upload-cloud-icon">☁️</div>
                    <div className="upload-text">Drag & drop your scan here</div>
                    <div className="upload-or">or click to browse files</div>
                    <button className="choose-file-btn" onClick={handleChooseFile}>
                      Choose File
                    </button>
                    <div className="upload-formats">
                      Supported formats: JPEG, PNG, DICOM (Max 50MB)
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.dcm,.dicom"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="preview-card">
                  <div className="preview-header">
                    <span className="preview-icon">🖼️</span>
                    <span className="preview-title">Image Preview</span>
                  </div>
                  <div className="image-container">
                    <div className="image-filename">{fileName}</div>
                    <div className="image-preview">
                      <img src={imagePreview} alt="Medical scan" />
                      <div className="image-tools">
                        <button className="tool-btn">🔍</button>
                        <button className="tool-btn">🔄</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="ai-results-section">
              {/* AI Confidence */}
              <div className="confidence-card">
                <div className="confidence-header">
                  <span className="confidence-icon">📊</span>
                  <span className="confidence-title">AI Confidence</span>
                </div>
                <div className="confidence-content">
                  {analysisResults ? (
                    <>
                      <div className="confidence-percentage">{analysisResults.confidence}%</div>
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill" 
                          style={{ width: `${analysisResults.confidence}%` }}
                        ></div>
                      </div>
                      <div className="confidence-label">High confidence detection</div>
                    </>
                  ) : (
                    <div className="no-analysis">
                      <div className="no-analysis-icon">🤖</div>
                      <div className="no-analysis-text">Run analysis to see confidence</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Detected Abnormalities */}
              <div className="abnormalities-card">
                <div className="abnormalities-header">
                  <span className="abnormalities-icon">⚠️</span>
                  <span className="abnormalities-title">Detected Abnormalities</span>
                </div>
                <div className="abnormalities-content">
                  {analysisResults ? (
                    analysisResults.abnormalities.map((abnormality, index) => (
                      <div key={index} className="abnormality-item">
                        <div className={`abnormality-indicator severity-${abnormality.severity}`}></div>
                        <div className="abnormality-name">{abnormality.name}</div>
                        <div className="abnormality-confidence">{abnormality.confidence}%</div>
                      </div>
                    ))
                  ) : (
                    <div className="no-analysis">
                      <div className="no-analysis-icon">🔬</div>
                      <div className="no-analysis-text">No abnormalities detected yet</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Details */}
              {analysisResults && (
                <div className="analysis-card">
                  <div className="analysis-content">
                    <p>{analysisResults.analysis}</p>
                  </div>
                </div>
              )}

              {/* Patient Information */}
              <div className="patient-info-card">
                <div 
                  className="patient-info-header"
                  onClick={() => setPatientInfoExpanded(!patientInfoExpanded)}
                >
                  <span className="patient-info-icon">👤</span>
                  <span className="patient-info-title">Patient Information</span>
                  <span className={`expand-icon ${patientInfoExpanded ? 'expanded' : ''}`}>▼</span>
                </div>
                {patientInfoExpanded && (
                  <div className="patient-info-content">
                    <div className="form-group">
                      <label>Patient Name</label>
                      <input
                        type="text"
                        value={patientInfo.name}
                        onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                        placeholder="Enter patient name"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Age</label>
                        <input
                          type="number"
                          value={patientInfo.age}
                          onChange={(e) => setPatientInfo({...patientInfo, age: e.target.value})}
                          placeholder="Age"
                        />
                      </div>
                      <div className="form-group">
                        <label>Gender</label>
                        <select
                          value={patientInfo.gender}
                          onChange={(e) => setPatientInfo({...patientInfo, gender: e.target.value})}
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Medical History</label>
                      <textarea
                        value={patientInfo.medicalHistory}
                        onChange={(e) => setPatientInfo({...patientInfo, medicalHistory: e.target.value})}
                        placeholder="Enter relevant medical history"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="ai-actions">
            <button 
              className="action-btn btn-primary"
              onClick={handleRunDiagnosis}
              disabled={!uploadedImage || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <span className="loading-spinner">⏳</span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span className="btn-icon">▶️</span>
                  Run Diagnosis
                </>
              )}
            </button>
            
            <button 
              className="action-btn btn-success"
              onClick={handleSaveToRecord}
              disabled={!analysisResults}
            >
              <span className="btn-icon">💾</span>
              Save to Patient Record
            </button>
            
            <button 
              className="action-btn btn-danger"
              onClick={handleExportPDF}
              disabled={!analysisResults}
            >
              <span className="btn-icon">📄</span>
              Export PDF
            </button>
          </div>

          {/* Bottom Toolbar */}
          <div className="ai-toolbar">
            <button className="tool-button tool-active">
              <span className="tool-icon">✈️</span>
            </button>
            <button className="tool-button">
              <span className="tool-icon">👆</span>
            </button>
            <button className="tool-button">
              <span className="tool-icon">💬</span>
            </button>
            <button className="tool-view-only">View only</button>
            <button className="tool-button">
              <span className="tool-icon">📏</span>
            </button>
            <button className="tool-button">
              <span className="tool-icon">📋</span>
            </button>
            <button className="tool-button">
              <span className="tool-icon">💻</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}