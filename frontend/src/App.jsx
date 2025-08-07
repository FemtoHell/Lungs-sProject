import { useState, useEffect } from 'react'
import './App.css'
import Login from './Login'
import SignUp from './SignUp'
import AdminDashboard from './AdminDashboard'

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
          setCurrentPage('dashboard');
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
    setCurrentPage('dashboard');
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
      {currentPage === 'dashboard' && (
        <AdminDashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  )
}

export default App