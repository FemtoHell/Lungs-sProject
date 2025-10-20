import React, { useState, useEffect } from 'react';
import './BookAppointment.css';

export default function BookAppointment({ user, onLogout, onNavigate }) {
  const [appointmentData, setAppointmentData] = useState({
    appointmentType: 'consultation',
    preferredDate: '',
    timeSlot: '',
    doctorId: '',
    reason: '',
    symptoms: '',
    urgency: 'routine'
  });

  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadDoctors();
    loadUpcomingAppointments();
  }, []);

  useEffect(() => {
    if (appointmentData.doctorId && appointmentData.preferredDate) {
      loadAvailableSlots(appointmentData.doctorId, appointmentData.preferredDate);
    }
  }, [appointmentData.doctorId, appointmentData.preferredDate]);

  const loadDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/patient/doctors/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const loadAvailableSlots = async (doctorId, date) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/patient/appointments/slots?doctorId=${doctorId}&date=${date}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
    }
  };

  const loadUpcomingAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/patient/appointments/upcoming?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUpcomingAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error loading upcoming appointments:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setAppointmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDoctorSelect = (doctorId) => {
    setAppointmentData(prev => ({
      ...prev,
      doctorId: doctorId,
      timeSlot: '' // Reset time slot when doctor changes
    }));
  };

  const handleTimeSlotSelect = (slot) => {
    setAppointmentData(prev => ({
      ...prev,
      timeSlot: slot
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!appointmentData.appointmentType) {
      alert('Please select appointment type');
      return;
    }
    if (!appointmentData.preferredDate) {
      alert('Please select preferred date');
      return;
    }
    if (!appointmentData.doctorId) {
      alert('Please select a doctor');
      return;
    }
    if (!appointmentData.timeSlot) {
      alert('Please select a time slot');
      return;
    }
    if (!appointmentData.reason) {
      alert('Please enter reason for appointment');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/patient/appointments/book', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        
        // Reset form
        setAppointmentData({
          appointmentType: 'consultation',
          preferredDate: '',
          timeSlot: '',
          doctorId: '',
          reason: '',
          symptoms: '',
          urgency: 'routine'
        });
        
        // Reload upcoming appointments
        loadUpcomingAppointments();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to book appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Error booking appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      setAppointmentData({
        appointmentType: 'consultation',
        preferredDate: '',
        timeSlot: '',
        doctorId: '',
        reason: '',
        symptoms: '',
        urgency: 'routine'
      });
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

  const getDoctorAvatar = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getPatientAvatar = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

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
            <div className="nav-item active">
              <span className="nav-icon">📅</span>
              <span className="nav-text">Book Appointment</span>
            </div>
            <div className="nav-item" onClick={() => onNavigate('view-results')}>
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
          <div className="book-appointment-page">
            {/* Page Header */}
            <div className="appointment-header">
              <h1 className="appointment-title">Book Appointment</h1>
              <p className="appointment-subtitle">Schedule a consultation with our specialist doctors</p>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="success-message">
                <span className="success-icon">✓</span>
                Appointment booked successfully! You will receive a confirmation email shortly.
              </div>
            )}

            {/* Appointment Layout */}
            <div className="appointment-layout">
              {/* Left Column - Form */}
              <div className="appointment-form-card">
                <div className="form-card-header">
                  <span className="form-card-icon">📝</span>
                  <h3 className="form-card-title">Appointment Details</h3>
                </div>
                <div className="form-card-body">
                  {/* Appointment Form */}
                  <div className="appointment-form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        Appointment Type <span className="required-star">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={appointmentData.appointmentType}
                        onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                      >
                        <option value="consultation">General Consultation</option>
                        <option value="follow-up">Follow-up Visit</option>
                        <option value="scan">Scan Appointment</option>
                        <option value="results">Results Discussion</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Preferred Date <span className="required-star">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-input"
                        min={today}
                        value={appointmentData.preferredDate}
                        onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Urgency Level</label>
                      <select
                        className="form-select"
                        value={appointmentData.urgency}
                        onChange={(e) => handleInputChange('urgency', e.target.value)}
                      >
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>

                    <div className="form-group form-group-full">
                      <label className="form-label">
                        Reason for Appointment <span className="required-star">*</span>
                      </label>
                      <textarea
                        className="form-textarea"
                        placeholder="Please describe the reason for your visit..."
                        value={appointmentData.reason}
                        onChange={(e) => handleInputChange('reason', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="form-group form-group-full">
                      <label className="form-label">Symptoms (Optional)</label>
                      <textarea
                        className="form-textarea"
                        placeholder="List any symptoms you're experiencing..."
                        value={appointmentData.symptoms}
                        onChange={(e) => handleInputChange('symptoms', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Doctor Selection */}
                  <div className="form-group form-group-full" style={{ marginTop: '24px' }}>
                    <label className="form-label">
                      Select Doctor <span className="required-star">*</span>
                    </label>
                    <div className="doctor-selection-grid">
                      {doctors.length > 0 ? (
                        doctors.map((doctor) => (
                          <div
                            key={doctor.id}
                            className={`doctor-option ${appointmentData.doctorId === doctor.id ? 'selected' : ''}`}
                            onClick={() => handleDoctorSelect(doctor.id)}
                          >
                            <div className="doctor-avatar">
                              {getDoctorAvatar(doctor.name)}
                            </div>
                            <div className="doctor-info">
                              <h4 className="doctor-name">Dr. {doctor.name}</h4>
                              <p className="doctor-specialty">{doctor.specialty || 'Pulmonologist'}</p>
                              <p className="doctor-availability">
                                ✓ Available {doctor.availability || 'Mon-Fri'}
                              </p>
                            </div>
                            <div className="doctor-checkbox"></div>
                          </div>
                        ))
                      ) : (
                        <div className="no-data">
                          <div className="no-data-icon">👨‍⚕️</div>
                          <p className="no-data-text">No doctors available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time Slot Selection */}
                  {appointmentData.doctorId && appointmentData.preferredDate && (
                    <div className="form-group form-group-full" style={{ marginTop: '24px' }}>
                      <label className="form-label">
                        Select Time Slot <span className="required-star">*</span>
                      </label>
                      <div className="time-slots-grid">
                        {availableSlots.length > 0 ? (
                          availableSlots.map((slot) => (
                            <div
                              key={slot.time}
                              className={`time-slot ${appointmentData.timeSlot === slot.time ? 'selected' : ''} ${!slot.available ? 'unavailable' : ''}`}
                              onClick={() => slot.available && handleTimeSlotSelect(slot.time)}
                            >
                              {slot.time}
                            </div>
                          ))
                        ) : (
                          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                            No available time slots for selected date
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="appointment-actions">
                    <button className="btn-cancel" onClick={handleCancel}>
                      Cancel
                    </button>
                    <button 
                      className="btn-submit" 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Booking...' : 'Book Appointment'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Upcoming Appointments */}
              <div className="upcoming-appointments-card">
                <div className="form-card-header">
                  <span className="form-card-icon">📅</span>
                  <h3 className="form-card-title">Your Upcoming Appointments</h3>
                </div>
                <div className="form-card-body">
                  {upcomingAppointments.length > 0 ? (
                    <div className="appointments-list-sidebar">
                      {upcomingAppointments.map((appointment, index) => {
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}