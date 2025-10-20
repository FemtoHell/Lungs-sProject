import { useState, useEffect } from 'react'
import './App.css'
import Login from './Login'
import SignUp from './SignUp'
import AdminDashboard from './AdminDashboard'
import DoctorDashboard from './DoctorDashboard'
import PatientDashboard from './PatientDashboard' // ✅ THÊM IMPORT

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra token khi app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token và get user info
      fetch('/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          
          // ✅ ROLE-BASED ROUTING
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            if (payload.is_superuser) {
              console.log('🔐 Admin user detected, routing to AdminDashboard');
              setCurrentPage('admin-dashboard');
            } else if (payload.is_staff && !payload.is_superuser) {
              console.log('👨‍⚕️ Doctor user detected, routing to DoctorDashboard');
              setCurrentPage('doctor-dashboard');
            } else {
              console.log('👤 Patient user detected, routing to PatientDashboard');
              setCurrentPage('patient-dashboard');
            }
          } catch (error) {
            console.error('Error decoding token for routing:', error);
            // Fallback: route based on data.user if available
            if (data.user.is_superuser) {
              setCurrentPage('admin-dashboard');
            } else if (data.user.is_staff) {
              setCurrentPage('doctor-dashboard');
            } else {
              setCurrentPage('patient-dashboard');
            }
          }
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const switchToSignUp = () => setCurrentPage('signup');
  const switchToLogin = () => setCurrentPage('login');
  
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    
    // ✅ ROLE-BASED ROUTING SAU LOGIN
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        if (payload.is_superuser) {
          console.log('🔐 Admin login success, routing to AdminDashboard');
          setCurrentPage('admin-dashboard');
        } else if (payload.is_staff && !payload.is_superuser) {
          console.log('👨‍⚕️ Doctor login success, routing to DoctorDashboard');
          setCurrentPage('doctor-dashboard');
        } else {
          console.log('👤 Patient login success, routing to PatientDashboard');
          setCurrentPage('patient-dashboard');
        }
      } catch (error) {
        console.error('Error decoding token after login:', error);
        // Fallback to admin dashboard
        setCurrentPage('admin-dashboard');
      }
    } else {
      // Fallback if no token
      setCurrentPage('admin-dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentPage('login');
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {currentPage === 'login' && (
        <Login 
          onSwitchToSignUp={switchToSignUp} 
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {currentPage === 'signup' && (
        <SignUp onSwitchToLogin={switchToLogin} />
      )}
      
      {/* ✅ ADMIN DASHBOARD - CHỈ CHO SUPERUSER */}
      {currentPage === 'admin-dashboard' && (
        <AdminDashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      )}
      
      {/* ✅ DOCTOR DASHBOARD - CHỈ CHO STAFF (KHÔNG PHẢI SUPERUSER) */}
      {currentPage === 'doctor-dashboard' && (
        <DoctorDashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      )}
      
      {/* ✅ PATIENT DASHBOARD - CHO REGULAR USERS */}
      {currentPage === 'patient-dashboard' && (
        <PatientDashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  )
}

export default App