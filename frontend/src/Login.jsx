import React, { useState } from 'react';
import './Login.css';

export default function Login({ onSwitchToSignUp, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        // Gọi callback để chuyển đến dashboard với thông tin user
        onLoginSuccess(data.user || { email });
      } else {
        alert(data.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      alert('Lỗi kết nối: ' + error.message);
    }
    
    setLoading(false);
  };

  const handleSwitchToSignUp = () => {
    if (isFlipping || loading) return;
    
    setIsFlipping(true);
    
    // Trigger flip animation then switch page
    setTimeout(() => {
      onSwitchToSignUp();
    }, 300); // Half of flip duration
  };

  return (
    <div className="login-page">
      
      {/* Right side form with flip container */}
      <div className="form-section">
        <div className="flip-container">
          <div className={`flip-card ${isFlipping ? 'flipping' : ''}`}>
            <div className="login-form-container">
              <div className="login-form">
                
                <h1 className="title">Sign In</h1>

                <form onSubmit={handleLogin}>
                  
                  <div className="form-field">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <svg className="input-icon input-icon-left" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email address"
                        disabled={isFlipping}
                        className="with-icon-left"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Password</label>
                    <div className="input-wrapper">
                      <svg className="input-icon input-icon-left" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        disabled={isFlipping}
                        className="with-icon-both"
                      />
                      <button
                        type="button"
                        className="input-icon input-icon-right toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isFlipping}
                      >
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="form-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={isFlipping}
                      />
                      Remember me
                    </label>
                    <a href="#" className="forgot-link">Forgot password?</a>
                  </div>

                  <button 
                    type="submit" 
                    className="sign-in-btn"
                    disabled={loading || isFlipping}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                  
                </form>

                {/* Divider */}
                <div className="divider">
                  <span>Or sign in with</span>
                </div>

                {/* OAuth Buttons */}
                <button 
                  className="oauth-btn google-btn"
                  onClick={() => window.location.href = '/auth/google'}
                  disabled={loading || isFlipping}
                >
                  <img 
                    src="https://developers.google.com/identity/images/g-logo.png" 
                    alt="Google"
                  />
                  Sign in with Google
                </button>

                <button 
                  className="oauth-btn microsoft-btn" 
                  disabled={loading || isFlipping}
                >
                  <svg width="18" height="18" viewBox="0 0 23 23">
                    <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                    <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
                    <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
                    <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
                  </svg>
                  Sign in with Microsoft
                </button>

                <div className="signup-text">
                  Don't have an account? 
                  <button 
                    className="signup-link flip-trigger"
                    onClick={handleSwitchToSignUp}
                    disabled={loading || isFlipping}
                  >
                    Sign Up
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}