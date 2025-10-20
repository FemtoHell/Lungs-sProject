import React, { useState, useEffect } from 'react';
import './DoctorSettings.css';

export default function DoctorSettings({ user, onLogout, onNavigate }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Profile Settings State
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialization: 'Pulmonologist',
    licenseNumber: '',
    hospitalName: '',
    department: '',
    bio: ''
  });

  // AI Settings State
  const [aiSettings, setAiSettings] = useState({
    confidenceThreshold: 85,
    autoFlagCritical: true,
    reportLanguage: 'en',
    priorityDiseases: ['Pneumonia', 'COVID-19', 'Lung Cancer']
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailCritical: true,
    emailDaily: false,
    smsEmergency: false,
    inAppNotifications: true
  });

  // Display Settings State
  const [displaySettings, setDisplaySettings] = useState({
    theme: 'light',
    language: 'en',
    fontSize: 'medium',
    measurementUnit: 'metric'
  });

  const diseaseOptions = [
    'Pneumonia',
    'COVID-19',
    'Lung Cancer',
    'Tuberculosis',
    'Pulmonary Fibrosis',
    'COPD',
    'Asthma',
    'Pleural Effusion'
  ];

  useEffect(() => {
    loadUserSettings();
  }, [user]);

  const loadUserSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load profile data
      if (user) {
        setProfileData({
          fullName: user.full_name || '',
          email: user.email || '',
          phone: user.phone || '',
          specialization: user.specialization || 'Pulmonologist',
          licenseNumber: user.license_number || '',
          hospitalName: user.hospital_name || '',
          department: user.department || '',
          bio: user.bio || ''
        });
      }

      // Load AI settings
      const aiResponse = await fetch('/doctor/settings/ai', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        setAiSettings(aiData);
      }

      // Load notification settings
      const notifResponse = await fetch('/doctor/settings/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        setNotificationSettings(notifData);
      }

      // Load display settings
      const displayResponse = await fetch('/doctor/settings/display', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (displayResponse.ok) {
        const displayData = await displayResponse.json();
        setDisplaySettings(displayData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAiSettingChange = (field, value) => {
    setAiSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDisplayChange = (field, value) => {
    setDisplaySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePriorityDisease = (disease) => {
    setAiSettings(prev => ({
      ...prev,
      priorityDiseases: prev.priorityDiseases.includes(disease)
        ? prev.priorityDiseases.filter(d => d !== disease)
        : [...prev.priorityDiseases, disease]
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');

      // Save based on active tab
      let endpoint = '';
      let data = {};

      switch (activeTab) {
        case 'profile':
          endpoint = '/doctor/settings/profile';
          data = profileData;
          break;
        case 'ai':
          endpoint = '/doctor/settings/ai';
          data = aiSettings;
          break;
        case 'notifications':
          endpoint = '/doctor/settings/notifications';
          data = notificationSettings;
          break;
        case 'display':
          endpoint = '/doctor/settings/display';
          data = displaySettings;
          break;
        default:
          break;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        alert('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    loadUserSettings();
  };

  const getPatientAvatar = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderProfileSettings = () => (
    <div className="settings-card">
      <div className="settings-card-header">
        <h3 className="settings-card-title">Personal Information</h3>
        <p className="settings-card-description">Update your personal and professional information</p>
      </div>
      <div className="settings-card-body">
        {/* Avatar Section */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-large">
            {getPatientAvatar(profileData.fullName || user?.full_name || user?.email)}
          </div>
          <div className="profile-avatar-actions">
            <button className="upload-avatar-btn">Upload New Photo</button>
            <button className="remove-avatar-btn">Remove Photo</button>
            <p className="avatar-hint">JPG, PNG or GIF. Max size 2MB</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="settings-form-grid">
          <div className="settings-form-group">
            <label className="settings-form-label">
              Full Name <span className="required-mark">*</span>
            </label>
            <input
              type="text"
              className="settings-form-input"
              value={profileData.fullName}
              onChange={(e) => handleProfileChange('fullName', e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="settings-form-group">
            <label className="settings-form-label">
              Email <span className="required-mark">*</span>
            </label>
            <input
              type="email"
              className="settings-form-input"
              value={profileData.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              placeholder="your.email@hospital.com"
              disabled
            />
            <span className="input-hint">Email cannot be changed</span>
          </div>

          <div className="settings-form-group">
            <label className="settings-form-label">Phone Number</label>
            <input
              type="tel"
              className="settings-form-input"
              value={profileData.phone}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              placeholder="+84 123 456 789"
            />
          </div>

          <div className="settings-form-group">
            <label className="settings-form-label">Specialization</label>
            <select
              className="settings-form-select"
              value={profileData.specialization}
              onChange={(e) => handleProfileChange('specialization', e.target.value)}
            >
              <option value="Pulmonologist">Pulmonologist</option>
              <option value="Radiologist">Radiologist</option>
              <option value="Thoracic Surgeon">Thoracic Surgeon</option>
              <option value="Internal Medicine">Internal Medicine</option>
              <option value="Emergency Medicine">Emergency Medicine</option>
            </select>
          </div>

          <div className="settings-form-group">
            <label className="settings-form-label">Medical License Number</label>
            <input
              type="text"
              className="settings-form-input"
              value={profileData.licenseNumber}
              onChange={(e) => handleProfileChange('licenseNumber', e.target.value)}
              placeholder="e.g., VN-12345-MD"
            />
          </div>

          <div className="settings-form-group">
            <label className="settings-form-label">Hospital/Clinic Name</label>
            <input
              type="text"
              className="settings-form-input"
              value={profileData.hospitalName}
              onChange={(e) => handleProfileChange('hospitalName', e.target.value)}
              placeholder="Enter hospital name"
            />
          </div>

          <div className="settings-form-group settings-form-group-full">
            <label className="settings-form-label">Department</label>
            <input
              type="text"
              className="settings-form-input"
              value={profileData.department}
              onChange={(e) => handleProfileChange('department', e.target.value)}
              placeholder="e.g., Radiology Department"
            />
          </div>

          <div className="settings-form-group settings-form-group-full">
            <label className="settings-form-label">Bio</label>
            <textarea
              className="settings-form-textarea"
              value={profileData.bio}
              onChange={(e) => handleProfileChange('bio', e.target.value)}
              placeholder="Brief professional biography..."
              rows={4}
            />
          </div>
        </div>
      </div>
      <div className="settings-actions">
        <button className="settings-btn settings-btn-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button 
          className={`settings-btn settings-btn-save ${isSaving ? 'saving' : ''}`}
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderAISettings = () => (
    <div className="settings-card">
      <div className="settings-card-header">
        <h3 className="settings-card-title">AI Diagnosis Configuration</h3>
        <p className="settings-card-description">Configure AI model behavior and detection preferences</p>
      </div>
      <div className="settings-card-body">
        {/* Confidence Threshold */}
        <div className="ai-setting-item">
          <div className="ai-setting-header">
            <h4 className="ai-setting-title">AI Confidence Threshold</h4>
          </div>
          <p className="ai-setting-description">
            Set minimum confidence level for AI predictions. Higher values reduce false positives but may miss subtle cases.
          </p>
          <div className="confidence-slider-container">
            <div className="confidence-slider-header">
              <span>Minimum Confidence Level</span>
              <span className="confidence-value">{aiSettings.confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              step="1"
              value={aiSettings.confidenceThreshold}
              onChange={(e) => handleAiSettingChange('confidenceThreshold', parseInt(e.target.value))}
              className="confidence-slider"
            />
            <div className="slider-labels">
              <span>50% (More Sensitive)</span>
              <span>99% (More Specific)</span>
            </div>
          </div>
        </div>

        {/* Auto Flag Critical */}
        <div className="ai-setting-item">
          <div className="ai-setting-header">
            <h4 className="ai-setting-title">Auto-flag Critical Cases</h4>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={aiSettings.autoFlagCritical}
                onChange={(e) => handleAiSettingChange('autoFlagCritical', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p className="ai-setting-description">
            Automatically flag and prioritize cases with critical findings for immediate review.
          </p>
        </div>

        {/* Priority Diseases */}
        <div className="ai-setting-item">
          <div className="ai-setting-header">
            <h4 className="ai-setting-title">Priority Disease Detection</h4>
          </div>
          <p className="ai-setting-description">
            Select diseases that require immediate attention and notification.
          </p>
          <div className="priority-diseases-list">
            {diseaseOptions.map(disease => (
              <label 
                key={disease}
                className={`disease-checkbox ${aiSettings.priorityDiseases.includes(disease) ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={aiSettings.priorityDiseases.includes(disease)}
                  onChange={() => togglePriorityDisease(disease)}
                />
                <span className="disease-label">{disease}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Report Language */}
        <div className="ai-setting-item">
          <div className="ai-setting-header">
            <h4 className="ai-setting-title">Report Language</h4>
          </div>
          <p className="ai-setting-description">
            Language for AI-generated reports and diagnoses.
          </p>
          <select
            className="settings-form-select"
            value={aiSettings.reportLanguage}
            onChange={(e) => handleAiSettingChange('reportLanguage', e.target.value)}
            style={{ maxWidth: '300px', marginTop: '12px' }}
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </div>
      </div>
      <div className="settings-actions">
        <button className="settings-btn settings-btn-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button 
          className={`settings-btn settings-btn-save ${isSaving ? 'saving' : ''}`}
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-card">
      <div className="settings-card-header">
        <h3 className="settings-card-title">Notification Preferences</h3>
        <p className="settings-card-description">Manage how you receive alerts and updates</p>
      </div>
      <div className="settings-card-body">
        <div className="notification-channels">
          {/* Email - Critical Cases */}
          <div className="notification-channel">
            <div className="channel-info">
              <div className="channel-icon">📧</div>
              <div className="channel-details">
                <h4 className="channel-name">Email - Critical Cases</h4>
                <p className="channel-description">Immediate email for urgent and critical findings</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.emailCritical}
                onChange={(e) => handleNotificationChange('emailCritical', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Email - Daily Summary */}
          <div className="notification-channel">
            <div className="channel-info">
              <div className="channel-icon">📊</div>
              <div className="channel-details">
                <h4 className="channel-name">Email - Daily Summary</h4>
                <p className="channel-description">Daily digest of scans and diagnoses at 6:00 PM</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.emailDaily}
                onChange={(e) => handleNotificationChange('emailDaily', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* SMS - Emergency Only */}
          <div className="notification-channel">
            <div className="channel-info">
              <div className="channel-icon">📱</div>
              <div className="channel-details">
                <h4 className="channel-name">SMS - Emergency Only</h4>
                <p className="channel-description">Text message for life-threatening conditions</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.smsEmergency}
                onChange={(e) => handleNotificationChange('smsEmergency', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* In-App Notifications */}
          <div className="notification-channel">
            <div className="channel-info">
              <div className="channel-icon">🔔</div>
              <div className="channel-details">
                <h4 className="channel-name">In-App Notifications</h4>
                <p className="channel-description">Real-time notifications within the application</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.inAppNotifications}
                onChange={(e) => handleNotificationChange('inAppNotifications', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
      <div className="settings-actions">
        <button className="settings-btn settings-btn-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button 
          className={`settings-btn settings-btn-save ${isSaving ? 'saving' : ''}`}
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="settings-card">
      <div className="settings-card-header">
        <h3 className="settings-card-title">Display & Appearance</h3>
        <p className="settings-card-description">Customize how the application looks and behaves</p>
      </div>
      <div className="settings-card-body">
        {/* Theme Selection */}
        <div className="ai-setting-item">
          <div className="ai-setting-header">
            <h4 className="ai-setting-title">Theme</h4>
          </div>
          <p className="ai-setting-description">Choose your preferred color scheme</p>
          <div className="display-options">
            <div 
              className={`display-option ${displaySettings.theme === 'light' ? 'selected' : ''}`}
              onClick={() => handleDisplayChange('theme', 'light')}
            >
              <div className="display-option-icon">☀️</div>
              <p className="display-option-name">Light Mode</p>
            </div>
            <div 
              className={`display-option ${displaySettings.theme === 'dark' ? 'selected' : ''}`}
              onClick={() => handleDisplayChange('theme', 'dark')}
            >
              <div className="display-option-icon">🌙</div>
              <p className="display-option-name">Dark Mode</p>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="ai-setting-item">
          <div className="ai-setting-header">
            <h4 className="ai-setting-title">Interface Language</h4>
          </div>
          <p className="ai-setting-description">Select your preferred interface language</p>
          <select
            className="settings-form-select"
            value={displaySettings.language}
            onChange={(e) => handleDisplayChange('language', e.target.value)}
            style={{ maxWidth: '300px', marginTop: '12px' }}
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="ai-setting-item">
          <div className="ai-setting-header">
            <h4 className="ai-setting-title">Font Size</h4>
          </div>
          <p className="ai-setting-description">Adjust text size for better readability</p>
          <select
            className="settings-form-select"
            value={displaySettings.fontSize}
            onChange={(e) => handleDisplayChange('fontSize', e.target.value)}
            style={{ maxWidth: '300px', marginTop: '12px' }}
          >
            <option value="small">Small</option>
            <option value="medium">Medium (Default)</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra Large</option>
          </select>
        </div>

        {/* Measurement Units */}
        <div className="ai-setting-item">
          <div className="ai-setting-header">
            <h4 className="ai-setting-title">Measurement Units</h4>
          </div>
          <p className="ai-setting-description">Choose between metric and imperial units</p>
          <div className="display-options">
            <div 
              className={`display-option ${displaySettings.measurementUnit === 'metric' ? 'selected' : ''}`}
              onClick={() => handleDisplayChange('measurementUnit', 'metric')}
            >
              <div className="display-option-icon">📏</div>
              <p className="display-option-name">Metric (cm, kg)</p>
            </div>
            <div 
              className={`display-option ${displaySettings.measurementUnit === 'imperial' ? 'selected' : ''}`}
              onClick={() => handleDisplayChange('measurementUnit', 'imperial')}
            >
              <div className="display-option-icon">📐</div>
              <p className="display-option-name">Imperial (inch, lbs)</p>
            </div>
          </div>
        </div>
      </div>
      <div className="settings-actions">
        <button className="settings-btn settings-btn-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button 
          className={`settings-btn settings-btn-save ${isSaving ? 'saving' : ''}`}
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'ai':
        return renderAISettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'display':
        return renderDisplaySettings();
      default:
        return renderProfileSettings();
    }
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
            <a href="#" className="nav-item" onClick={() => onNavigate('reports')}>
              <span className="nav-icon">📋</span>
              <span className="nav-text">Reports</span>
            </a>
            <a href="#" className="nav-item active">
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Settings</span>
            </a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="doctor-content-area">
          <div className="settings-page">
            {/* Page Header */}
            <div className="settings-header">
              <h1 className="settings-title">Settings</h1>
              <p className="settings-subtitle">Manage your account and application preferences</p>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="save-success">
                <span className="success-icon">✓</span>
                Settings saved successfully!
              </div>
            )}

            {/* Settings Layout */}
            <div className="settings-layout">
              {/* Settings Navigation Sidebar */}
              <div className="settings-sidebar">
                <nav className="settings-nav">
                  <div
                    className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <span className="settings-nav-icon">👤</span>
                    <span className="settings-nav-text">Personal Profile</span>
                  </div>
                  <div
                    className={`settings-nav-item ${activeTab === 'ai' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ai')}
                  >
                    <span className="settings-nav-icon">🤖</span>
                    <span className="settings-nav-text">AI Diagnosis</span>
                  </div>
                  <div
                    className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    <span className="settings-nav-icon">🔔</span>
                    <span className="settings-nav-text">Notifications</span>
                  </div>
                  <div
                    className={`settings-nav-item ${activeTab === 'display' ? 'active' : ''}`}
                    onClick={() => setActiveTab('display')}
                  >
                    <span className="settings-nav-icon">🎨</span>
                    <span className="settings-nav-text">Display</span>
                  </div>
                </nav>
              </div>

              {/* Settings Content */}
              <div className="settings-content">
                {renderActiveTab()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}