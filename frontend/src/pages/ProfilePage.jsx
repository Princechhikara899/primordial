// frontend/src/pages/ProfilePage.jsx
// User Profile: Account Identity, Session Details & Streak Freezes

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Calendar,
  ShieldCheck,
  LogOut,
  Snowflake,
  Flame,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Your account identity, session details, and available streak freezes.</p>
      </div>

      <div className="profile-grid">
        {/* User Info Card */}
        <div className="profile-card">
          <div className="profile-avatar-large">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h2>{user?.name}</h2>
          <span className="profile-role-badge">StreakSquad Member</span>

          <div className="profile-info-list">
            <div className="profile-info-item">
              <Mail size={16} />
              <span>{user?.email}</span>
            </div>
            <div className="profile-info-item">
              <Calendar size={16} />
              <span>Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
            </div>
            <div className="profile-info-item">
              <ShieldCheck size={16} />
              <span>Auth Method: Session Cookie (HTTP-Only)</span>
            </div>
            <div className="profile-info-item">
              <Snowflake size={16} className="text-blue" />
              <span>Available Streak Freezes: <strong>{user?.streakFreezes ?? 2}</strong></span>
            </div>
          </div>

          <button onClick={handleLogout} className="btn btn-outline-danger btn-block mt-4">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Account Summary & Best Practices */}
        <div className="project-details-card">
          <h3>
            <Flame size={20} style={{ display: 'inline', marginRight: 8, color: '#f59e0b' }} />
            Goal Accountability Tips
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            Primordial helps you stay consistent using simple and proven accountability principles:
          </p>

          <div className="roles-list">
            <div className="role-box">
              <div className="role-header">
                <strong>Daily Check-ins</strong>
              </div>
              <p>Check in once every calendar day. The database enforces a unique constraint to ensure honest daily submissions.</p>
            </div>

            <div className="role-box">
              <div className="role-header">
                <strong>Consecutive Streaks</strong>
              </div>
              <p>Your current streak increases every consecutive day you check in. If you miss a day, your streak will reset to 0 unless protected.</p>
            </div>

            <div className="role-box">
              <div className="role-header">
                <strong>Streak Freezes</strong>
              </div>
              <p>You start with 2 streak freezes. If you miss a day due to an emergency or travel, use a freeze to keep your streak alive.</p>
            </div>

            <div className="role-box">
              <div className="role-header">
                <strong>Squad Leaderboard</strong>
              </div>
              <p>Rankings are computed live from PostgreSQL check-ins. Keep checking in daily to reach and hold the #1 rank!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
