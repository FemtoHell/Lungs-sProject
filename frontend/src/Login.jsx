import React, { useState } from 'react';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        alert('Đăng nhập thành công!');
      } else {
        alert(data.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      alert('Lỗi kết nối: ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      
      {/* Login Form - Positioned Right */}
      <div className="login-form-container">
        <div className="login-form">
          
          <h1 className="title">Sign In</h1>

          <form onSubmit={handleLogin}>
            
            <div className="form-field">
              <label>Username</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            <button 
              type="submit" 
              className="sign-in-btn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            
          </form>

          {/* OAuth Buttons */}
          <button 
            className="oauth-btn google-btn"
            onClick={() => window.location.href = '/auth/google'}
          >
            <img 
              src="https://developers.google.com/identity/images/g-logo.png" 
              alt="Google"
            />
            Sign in with Google
          </button>

          <button className="oauth-btn microsoft-btn">
            <svg width="18" height="18" viewBox="0 0 23 23">
              <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
              <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
              <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
              <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
            </svg>
            Sign in with Microsoft
          </button>

          <div className="signup-text">
            Don't have an account? <a href="#" className="signup-link">Sign Up</a>
          </div>

        </div>
      </div>
    </div>
  );
}