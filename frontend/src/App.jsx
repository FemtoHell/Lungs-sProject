import { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import SignUp from './SignUp';
import AdminDashboard from './AdminDashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  useEffect(() => {
    // Check URL path and token to determine current page
    const path = window.location.pathname;
    const token = localStorage.getItem('token');
    
    if (path === '/admin-dashboard' && token) {
      // Verify user has admin access
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.is_superuser || payload.is_staff) {
          setCurrentPage('admin-dashboard');
        } else {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } catch (error) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (path === '/signup') {
      setCurrentPage('signup');
    } else if (path === '/login' || path === '/') {
      setCurrentPage('login');
    } else {
      // If token exists, check role and redirect
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.is_superuser || payload.is_staff) {
            window.location.href = '/admin-dashboard';
          } else {
            setCurrentPage('login');
          }
        } catch (error) {
          localStorage.removeItem('token');
          setCurrentPage('login');
        }
      } else {
        setCurrentPage('login');
      }
    }
  }, []);

  const switchToSignUp = () => {
    setCurrentPage('signup');
    window.history.pushState({}, '', '/signup');
  };

  const switchToLogin = () => {
    setCurrentPage('login');
    window.history.pushState({}, '', '/login');
  };

  return (
    <div className="app">
      {currentPage === 'login' && <Login onSwitchToSignUp={switchToSignUp} />}
      {currentPage === 'signup' && <SignUp onSwitchToLogin={switchToLogin} />}
      {currentPage === 'admin-dashboard' && <AdminDashboard />}
    </div>
  );
}

export default App;