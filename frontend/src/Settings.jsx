import React, { useState, useEffect } from 'react';
import './Settings.css';

export default function Settings() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    dataAnonymization: true,
    automaticUpdates: false,
    diagnosticLogging: false
  });

  const [backupSchedule, setBackupSchedule] = useState('daily');
  const [modelVersion, setModelVersion] = useState('v1.2.3 (Stable)');
  
  const [permissions, setPermissions] = useState({
    'View Diagnoses': {
      admin: true,
      doctor: true,
      nurse: true,
      technician: false,
      guest: false
    },
    'Edit Diagnoses': {
      admin: true,
      doctor: true,
      nurse: false,
      technician: false,
      guest: false
    },
    'Manage Users': {
      admin: true,
      doctor: false,
      nurse: false,
      technician: false,
      guest: false
    },
    'Configure System': {
      admin: true,
      doctor: false,
      nurse: false,
      technician: false,
      guest: false
    },
    'View Logs': {
      admin: true,
      doctor: true,
      nurse: true,
      technician: true,
      guest: false
    },
    'Run Backups': {
      admin: true,
      doctor: false,
      nurse: false,
      technician: false,
      guest: false
    }
  });

  const handleSettingToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePermissionChange = (feature, role) => {
    setPermissions(prev => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        [role]: !prev[feature][role]
      }
    }));
  };

  const handleSaveChanges = async () => {
    try {
      // API call to save settings
      console.log('Saving settings:', { settings, permissions, backupSchedule, modelVersion });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    }
  };

  const handleRunBackup = async () => {
    try {
      alert('Backup started successfully!');
    } catch (error) {
      console.error('Error running backup:', error);
      alert('Error running backup');
    }
  };

  const handleManageStorage = () => {
    alert('Storage management feature coming soon!');
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>System Settings</h1>
      </div>

      <div className="settings-content">
        <div className="settings-grid">
          {/* AI Model Version */}
          <div className="settings-card">
            <div className="card-header">
              <h3>AI Model Version</h3>
              <span className="status-badge active">Active</span>
            </div>
            
            <div className="form-group">
              <label>Current Version</label>
              <select 
                value={modelVersion}
                onChange={(e) => setModelVersion(e.target.value)}
                className="form-select"
              >
                <option value="v1.2.3 (Stable)">v1.2.3 (Stable)</option>
                <option value="v1.2.4 (Beta)">v1.2.4 (Beta)</option>
                <option value="v1.2.2 (Previous)">v1.2.2 (Previous)</option>
              </select>
              <small className="form-hint">Last updated: July 28, 2023 at 10:45 AM</small>
            </div>

            <div className="model-performance">
              <h4>Model Performance</h4>
              <div className="performance-metrics">
                <div className="metric">
                  <label>Accuracy</label>
                  <div className="metric-value">94.3%</div>
                </div>
                <div className="metric">
                  <label>Avg. Response Time</label>
                  <div className="metric-value">1.2s</div>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Usage */}
          <div className="settings-card">
            <div className="card-header">
              <h3>Storage Usage</h3>
            </div>
            
            <div className="storage-overview">
              <div className="storage-header">
                <span className="storage-used">78% used</span>
                <span className="storage-total">780GB / 1TB</span>
              </div>
              
              <div className="storage-bar">
                <div className="storage-progress" style={{ width: '78%' }}></div>
              </div>
              
              <div className="storage-breakdown">
                <div className="storage-item">
                  <div className="storage-dot patient-data"></div>
                  <span>Patient Data</span>
                  <span className="storage-size">450GB</span>
                </div>
                <div className="storage-item">
                  <div className="storage-dot ai-models"></div>
                  <span>AI Models</span>
                  <span className="storage-size">220GB</span>
                </div>
                <div className="storage-item">
                  <div className="storage-dot system-logs"></div>
                  <span>System Logs</span>
                  <span className="storage-size">110GB</span>
                </div>
              </div>
              
              <button className="btn-manage-storage" onClick={handleManageStorage}>
                📁 Manage Storage
              </button>
            </div>
          </div>

          {/* System Configuration */}
          <div className="settings-card">
            <div className="card-header">
              <h3>System Configuration</h3>
            </div>
            
            <div className="config-options">
              <div className="config-item">
                <div className="config-info">
                  <h4>Enable Email Alerts</h4>
                  <p>Send email notifications for critical system events</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.emailAlerts}
                    onChange={() => handleSettingToggle('emailAlerts')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="config-item">
                <div className="config-info">
                  <h4>Data Anonymization</h4>
                  <p>Automatically anonymize patient data for analysis</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.dataAnonymization}
                    onChange={() => handleSettingToggle('dataAnonymization')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="config-item">
                <div className="config-info">
                  <h4>Automatic Updates</h4>
                  <p>Allow system to automatically update when new versions are available</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.automaticUpdates}
                    onChange={() => handleSettingToggle('automaticUpdates')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="config-item">
                <div className="config-info">
                  <h4>Diagnostic Logging</h4>
                  <p>Enable detailed diagnostic logging for troubleshooting</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.diagnosticLogging}
                    onChange={() => handleSettingToggle('diagnosticLogging')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* System Backup */}
          <div className="settings-card">
            <div className="card-header">
              <h3>System Backup</h3>
            </div>
            
            <div className="backup-info">
              <div className="backup-status">
                <div className="backup-last">
                  <label>Last Backup</label>
                  <div className="backup-date">July 29, 2023 at 03:45 AM</div>
                  <div className="backup-details">
                    <span className="success-badge">Successful</span>
                    <span className="backup-size">Backup size: 42.3 GB</span>
                  </div>
                </div>
              </div>

              <div className="backup-schedule">
                <h4>Backup Schedule</h4>
                <div className="radio-group">
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="backup" 
                      value="daily"
                      checked={backupSchedule === 'daily'}
                      onChange={(e) => setBackupSchedule(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    Daily
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="backup" 
                      value="weekly"
                      checked={backupSchedule === 'weekly'}
                      onChange={(e) => setBackupSchedule(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    Weekly
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="backup" 
                      value="monthly"
                      checked={backupSchedule === 'monthly'}
                      onChange={(e) => setBackupSchedule(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    Monthly
                  </label>
                </div>
              </div>

              <button className="btn-run-backup" onClick={handleRunBackup}>
                ☁️ Run Backup Now
              </button>
            </div>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="permissions-section">
          <div className="permissions-header">
            <h3>Permissions Matrix</h3>
            <button className="btn-add-role">+ Add Role</button>
          </div>
          
          <div className="permissions-table">
            <table>
              <thead>
                <tr>
                  <th>Features / Roles</th>
                  <th>Admin</th>
                  <th>Doctor</th>
                  <th>Nurse</th>
                  <th>Technician</th>
                  <th>Guest</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissions).map(([feature, roles]) => (
                  <tr key={feature}>
                    <td className="feature-name">{feature}</td>
                    {Object.entries(roles).map(([role, hasPermission]) => (
                      <td key={role} className="permission-cell">
                        <label className="checkbox-custom">
                          <input 
                            type="checkbox" 
                            checked={hasPermission}
                            onChange={() => handlePermissionChange(feature, role)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-footer">
          <button className="btn-save-changes" onClick={handleSaveChanges}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}