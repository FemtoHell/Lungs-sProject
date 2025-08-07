import React, { useState, useEffect } from 'react';
import './SignUp.css';

const SITE_KEY = '6Lf2m5QrAAAAAI4kwN-6QCcVhzJPSYrwWKdnKFFp';

export default function SignUp({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);

  // Load reCAPTCHA script trong useEffect
  useEffect(() => {
    const loadRecaptcha = () => {
      if (typeof window !== 'undefined' && !document.getElementById('recaptcha-v3-script')) {
        const script = document.createElement('script');
        script.id = 'recaptcha-v3-script';
        script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
        script.async = true;
        document.head.appendChild(script);
      }
    };

    loadRecaptcha();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (!window.grecaptcha) {
      setMessage('reCAPTCHA not loaded. Please refresh the page.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      window.grecaptcha.ready(async () => {
        try {
          const captchaToken = await window.grecaptcha.execute(SITE_KEY, { action: 'register' });
          
          if (!captchaToken) {
            setMessage('Failed to get captcha token');
            setMessageType('error');
            setLoading(false);
            return;
          }

          const response = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              confirmPassword: formData.confirmPassword,
              captchaToken
            })
          });

          let data = {};
          try {
            const text = await response.text();
            if (text && text.trim().length > 0) {
              data = JSON.parse(text);
            }
          } catch (err) {
            setMessage('Server response error');
            setMessageType('error');
            setLoading(false);
            return;
          }

          if (response.ok) {
            setMessage(data.message || 'Registration successful! Please check your email to verify your account.');
            setMessageType('success');
            // Clear form
            setFormData({
              email: '',
              password: '',
              confirmPassword: ''
            });
          } else {
            setMessage(data.message || 'Registration failed');
            setMessageType('error');
          }
          
          setLoading(false);
        } catch (err) {
          setMessage('Error during registration: ' + err.message);
          setMessageType('error');
          setLoading(false);
        }
      });
    } catch (err) {
      setMessage('Unexpected error: ' + err.message);
      setMessageType('error');
      setLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    if (isFlipping || loading) return;
    
    setIsFlipping(true);
    
    // Trigger flip animation then switch page
    setTimeout(() => {
      onSwitchToLogin();
    }, 300); // Half of flip duration
  };

  return (
    <div className="signup-page">
      
      {/* Right side form with flip container */}
      <div className="form-section">
        <div className="flip-container">
          <div className={`flip-card ${isFlipping ? 'flipping' : ''}`}>
            <div className="signup-form-container">
              <div className="signup-form">
                
                <h1 className="title">Create Account</h1>

                <form onSubmit={handleSubmit}>
                  
                  <div className="form-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your email"
                      disabled={loading || isFlipping}
                    />
                  </div>

                  <div className="form-field">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Create a password"
                      minLength="6"
                      disabled={loading || isFlipping}
                    />
                  </div>

                  <div className="form-field">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="Confirm your password"
                      minLength="6"
                      disabled={loading || isFlipping}
                    />
                  </div>

                  {message && (
                    <div className={`message ${messageType}`}>
                      {message}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="sign-up-btn"
                    disabled={loading || isFlipping}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                  
                </form>

                {/* Divider */}
                <div className="divider">
                  <span>Or sign up with</span>
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
                  Sign up with Google
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
                  Sign up with Microsoft
                </button>

                <div className="signin-text">
                  Already have an account? 
                  <button 
                    className="signin-link flip-trigger"
                    onClick={handleSwitchToLogin}
                    disabled={loading || isFlipping}
                  >
                    Sign In
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