// frontend/src/components/Navbar.jsx
// Main Header Navigation Component

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, 
  Compass, 
  PlusCircle, 
  LayoutDashboard, 
  CheckCircle2, 
  History, 
  User, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
          <span className="brand-icon">
            <Flame className="flame-icon" />
          </span>
          <span className="brand-text">
            Primordial <span className="brand-badge">StreakSquad</span>
          </span>
        </Link>

        {/* Mobile menu toggle button */}
        <button 
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Navigation Links */}
        <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <Link 
            to="/explore" 
            className={`nav-item ${isActive('/explore') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Compass size={18} />
            <span>Explore</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link 
                to="/dashboard" 
                className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>

              <Link 
                to="/joined" 
                className={`nav-item ${isActive('/joined') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <CheckCircle2 size={18} />
                <span>My Challenges</span>
              </Link>

              <Link 
                to="/create" 
                className={`nav-item ${isActive('/create') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <PlusCircle size={18} />
                <span>New Goal</span>
              </Link>

              <Link 
                to="/history" 
                className={`nav-item ${isActive('/history') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <History size={18} />
                <span>History</span>
              </Link>

              {/* User Profile & Logout */}
              <div className="user-action-group">
                <Link 
                  to="/profile" 
                  className={`user-profile-badge ${isActive('/profile') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={16} />
                  <span className="user-name">{user?.name}</span>
                </Link>

                <button onClick={handleLogout} className="btn-logout" title="Sign Out">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="guest-action-group">
              <Link 
                to="/login" 
                className="btn btn-secondary btn-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="btn btn-primary btn-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
