// frontend/src/pages/LoginPage.jsx
// User Login Page with Generic Fictional Persona Selectors

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click demo accounts
  const setDemoUser = (userEmail) => {
    setEmail(userEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <LogIn size={28} />
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your Primordial account to track your streaks.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Accounts Quick-Select for Instant Testing */}
        <div className="demo-accounts-box">
          <div className="demo-header">
            <Sparkles size={16} />
            <span>Quick Demo Personas</span>
          </div>
          <div className="demo-buttons-grid">
            <button 
              type="button" 
              className="demo-btn" 
              onClick={() => setDemoUser('alex@example.com')}
            >
              Alex (5-Day Active Streak)
            </button>
            <button 
              type="button" 
              className="demo-btn" 
              onClick={() => setDemoUser('sarah@example.com')}
            >
              Sarah (Protected by Freeze)
            </button>
            <button 
              type="button" 
              className="demo-btn" 
              onClick={() => setDemoUser('david@example.com')}
            >
              David (Coding & Study)
            </button>
            <button 
              type="button" 
              className="demo-btn" 
              onClick={() => setDemoUser('elena@example.com')}
            >
              Elena (Reading Enthusiast)
            </button>
          </div>
          <p className="demo-note">Clicking fills credentials automatically (password: <code>password123</code>).</p>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
