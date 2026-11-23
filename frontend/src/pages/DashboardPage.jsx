// frontend/src/pages/DashboardPage.jsx
// User Dashboard: Overview Stats, Streak Freezes & Active Challenges

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, 
  CheckCircle2, 
  Layers, 
  PlusCircle, 
  MessageSquare, 
  Trophy, 
  ArrowRight,
  TrendingUp,
  Snowflake,
  Clock,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check-in modal state
  const [checkInModal, setCheckInModal] = useState({ 
    open: false, 
    challenge: null, 
    note: '' 
  });
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState('');

  // Streak Freeze modal state
  const [freezeModal, setFreezeModal] = useState({
    open: false,
    challengeId: '',
    date: '',
    loading: false,
    msg: '',
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const dashRes = await api.getDashboardStats();
      if (dashRes.success) {
        setStats(dashRes.stats);
        setChallenges(dashRes.challenges || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Quick check-in submission
  const handleOpenCheckIn = (challenge) => {
    setCheckInModal({ 
      open: true, 
      challenge, 
      note: '' 
    });
    setCheckInMsg('');
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!checkInModal.challenge) return;

    try {
      setCheckInLoading(true);
      setCheckInMsg('');
      const res = await api.submitCheckIn(checkInModal.challenge.id, checkInModal.note);
      setCheckInMsg(res.message);
      await fetchDashboardData();
      setTimeout(() => {
        setCheckInModal({ open: false, challenge: null, note: '' });
        setCheckInMsg('');
      }, 1500);
    } catch (err) {
      setCheckInMsg(err.message || 'Failed to submit check-in.');
    } finally {
      setCheckInLoading(false);
    }
  };

  // Helper to format local date YYYY-MM-DD
  const getLocalDateString = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Open Freeze Modal
  const handleOpenFreeze = () => {
    const yesterdayStr = getLocalDateString(-1);
    const defaultChallengeId = challenges.length > 0 ? String(challenges[0].id) : '';

    setFreezeModal({
      open: true,
      challengeId: defaultChallengeId,
      date: yesterdayStr,
      loading: false,
      msg: '',
    });
  };

  const handleApplyFreeze = async (e) => {
    e.preventDefault();
    if (!freezeModal.challengeId) {
      setFreezeModal((prev) => ({ ...prev, msg: 'Please select a challenge.' }));
      return;
    }

    try {
      setFreezeModal((prev) => ({ ...prev, loading: true, msg: '' }));
      const res = await api.useStreakFreeze(freezeModal.challengeId, freezeModal.date);
      setFreezeModal((prev) => ({
        ...prev,
        loading: false,
        msg: res.message || 'Streak Freeze applied successfully!',
      }));
      await Promise.all([fetchDashboardData(), refreshUser()]);
      setTimeout(() => {
        setFreezeModal({ open: false, challengeId: '', date: '', loading: false, msg: '' });
      }, 2000);
    } catch (err) {
      setFreezeModal((prev) => ({
        ...prev,
        loading: false,
        msg: err.message || 'Failed to apply streak freeze.',
      }));
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const availableFreezes = stats?.availableFreezes ?? user?.streakFreezes ?? 0;

  return (
    <div className="page-container">
      {/* Top Banner / Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h1>Welcome back, {user?.name}!</h1>
          <p>Stay accountable, check in daily, and protect your consistency streak.</p>
        </div>
        <div className="welcome-actions">
          <Link to="/explore" className="btn btn-secondary">
            <PlusCircle size={18} />
            <span>Join Squad</span>
          </Link>
          <Link to="/create" className="btn btn-primary">
            <Sparkles size={18} />
            <span>Create Goal</span>
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* 4 Summary Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-blue">
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Challenges</span>
            <span className="stat-value">{stats?.activeChallenges ?? 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-green">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Check-ins</span>
            <span className="stat-value">{stats?.totalCheckIns ?? 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-orange">
            <Flame size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Current Streak</span>
            <span className="stat-value">{stats?.currentStreak ?? 0} <small>days</small></span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-teal">
            <Snowflake size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Streak Freezes</span>
            <span className="stat-value">{availableFreezes} <small>left</small></span>
          </div>
          <button
            onClick={handleOpenFreeze}
            className="btn btn-sm btn-outline mt-2"
            disabled={availableFreezes <= 0 || challenges.length === 0}
            title={availableFreezes <= 0 ? 'No freezes available' : 'Use a freeze to protect a missed day'}
          >
            Use Freeze
          </button>
        </div>
      </div>

      {/* Active Challenges Section */}
      <div className="dashboard-section mt-6">
        <div className="section-header-flex">
          <div>
            <h2>My Active Challenges ({challenges.length})</h2>
            <p>Your current squads and daily goal milestones.</p>
          </div>
          <Link to="/joined" className="view-all-link">
            <span>View All</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {challenges.length === 0 ? (
          <div className="empty-state-card">
            <TrendingUp size={48} className="empty-icon" />
            <h3>No active challenges</h3>
            <p>You haven't enrolled in any goals yet. Browse public squads or create your own!</p>
            <div className="empty-actions">
              <Link to="/explore" className="btn btn-primary">Explore Challenges</Link>
              <Link to="/create" className="btn btn-secondary">Create a Challenge</Link>
            </div>
          </div>
        ) : (
          <div className="challenges-grid">
            {challenges.map((c) => {
              const currentStreak = c.progress?.currentStreak || 0;
              const totalCheckIns = c.progress?.totalCheckIns || 0;
              const progressPct = c.progress?.progressPercentage || 0;

              return (
                <div key={c.id} className="challenge-card joined-card">
                  <div className="card-top">
                    <span className="challenge-duration">
                      <Clock size={14} />
                      <span>{c.duration} Days</span>
                    </span>
                    <div className="streak-tag">
                      <Flame size={15} />
                      <span>{currentStreak} Day Streak</span>
                    </div>
                  </div>

                  <h3 className="challenge-title">{c.title}</h3>
                  <p className="challenge-desc">{c.description}</p>

                  {/* Progress Bar */}
                  <div className="progress-section">
                    <div className="progress-labels">
                      <span>Goal: {totalCheckIns} / {c.duration} check-ins</span>
                      <span className="progress-pct">{progressPct}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="joined-actions-footer">
                    <button 
                      onClick={() => handleOpenCheckIn(c)} 
                      className="btn btn-primary btn-sm flex-1"
                    >
                      <CheckCircle2 size={16} />
                      <span>Check In</span>
                    </button>

                    <Link 
                      to={`/challenges/${c.id}/leaderboard`} 
                      className="btn-icon-link" 
                      title="Leaderboard"
                    >
                      <Trophy size={18} />
                    </Link>

                    <Link 
                      to={`/challenges/${c.id}/chat`} 
                      className="btn-icon-link" 
                      title="Squad Chat"
                    >
                      <MessageSquare size={18} />
                    </Link>

                    <Link 
                      to={`/challenges/${c.id}`} 
                      className="btn-icon-link" 
                      title="Details"
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Check In Modal */}
      {checkInModal.open && (
        <div 
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setCheckInModal({ open: false, challenge: null, note: '' }); }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3>Check In: {checkInModal.challenge?.title}</h3>
              <button 
                className="btn-close" 
                onClick={() => setCheckInModal({ open: false, challenge: null, note: '' })}
              >
                ✕
              </button>
            </div>

            {checkInMsg && (
              <div className={`alert ${checkInMsg.toLowerCase().includes('success') ? 'alert-success' : 'alert-error'}`}>
                {checkInMsg}
              </div>
            )}

            <form onSubmit={handleCheckInSubmit} className="modal-form">
              <div className="form-group">
                <label>Progress Note (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Share a short note about what you achieved today..."
                  value={checkInModal.note}
                  onChange={(e) => setCheckInModal((prev) => ({ ...prev, note: e.target.value }))}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setCheckInModal({ open: false, challenge: null, note: '' })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={checkInLoading}>
                  {checkInLoading ? 'Submitting...' : 'Confirm Check-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Streak Freeze Modal */}
      {freezeModal.open && (
        <div 
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setFreezeModal({ open: false, challengeId: '', date: '', loading: false, msg: '' }); }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3>❄️ Use Streak Freeze</h3>
              <button 
                className="btn-close" 
                onClick={() => setFreezeModal({ open: false, challengeId: '', date: '', loading: false, msg: '' })}
              >
                ✕
              </button>
            </div>

            {freezeModal.msg && (
              <div className={`alert ${freezeModal.msg.toLowerCase().includes('success') || freezeModal.msg.toLowerCase().includes('applied') ? 'alert-success' : 'alert-error'}`}>
                {freezeModal.msg}
              </div>
            )}

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Protect one missed day from breaking your streak. You currently have <strong>{availableFreezes}</strong> freeze(s) left.
            </p>

            <form onSubmit={handleApplyFreeze} className="modal-form">
              <div className="form-group">
                <label>Select Challenge</label>
                <select
                  value={freezeModal.challengeId}
                  onChange={(e) => setFreezeModal((prev) => ({ ...prev, challengeId: e.target.value }))}
                  required
                >
                  {challenges.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date to Protect (Missed Day)</label>
                <input
                  type="date"
                  value={freezeModal.date}
                  max={getLocalDateString(0)}
                  onChange={(e) => setFreezeModal((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setFreezeModal({ open: false, challengeId: '', date: '', loading: false, msg: '' })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={freezeModal.loading || availableFreezes <= 0}>
                  {freezeModal.loading ? 'Applying...' : 'Apply Streak Freeze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
