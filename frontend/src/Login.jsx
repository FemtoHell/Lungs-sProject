import React, { useState } from 'react';
import './Login.css';

export default function Login({ onSwitchToSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

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
        
        // Decode JWT để lấy user info
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          
          // Check if user is admin/staff
          if (payload.is_superuser || payload.is_staff) {
            window.location.href = '/admin-dashboard';
          } else {
            // For now, show alert for non-admin users
            alert('Chỉ admin mới có thể truy cập hệ thống này!');
            localStorage.removeItem('token');
          }
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
          alert('Lỗi xác thực token');
          localStorage.removeItem('token');
        }
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
                    <label>Username</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      disabled={isFlipping}
                    />
                  </div>

                  <div className="form-field">
                    <label>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      disabled={isFlipping}
                    />
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