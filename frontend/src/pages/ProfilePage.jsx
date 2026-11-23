// frontend/src/pages/ProfilePage.jsx
// User Profile: Account Identity, Session Details & Streak Freezes

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Mail,
  Calendar,
  ShieldCheck,
  LogOut,
  Snowflake,
  Flame,
  Award,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    refreshUser();
    api.getUserBadges()
      .then((res) => {
        if (res.success) {
          setBadges(res.badges || []);
        }
      })
      .catch(() => {});
  }, []);

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
          <div className="mb-6">
            <h3>
              <Award size={20} style={{ display: 'inline', marginRight: 8, color: '#f59e0b' }} />
              Milestone Badges ({badges.length})
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              Badges unlocked automatically as you submit check-ins and build consecutive streaks:
            </p>
            {badges.length === 0 ? (
              <div className="empty-badge-box">
                <span className="text-muted text-sm">No badges unlocked yet. Complete your first daily check-in to earn the "🌱 First Step" badge!</span>
              </div>
            ) : (
              <div className="badges-grid-list">
                {badges.map((b) => (
                  <div key={b.id} className="badge-pill-item">
                    <span className="badge-emoji-large">{b.icon}</span>
                    <div className="badge-pill-text">
                      <strong>{b.title}</strong>
                      <span>{b.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h3>
            <Flame size={20} style={{ display: 'inline', marginRight: 8, color: '#f59e0b' }} />
            Goal Accountability Tips
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
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
