// frontend/src/pages/JoinedChallengesPage.jsx
// User's Enrolled Challenges with Streak Metrics & Check-in Triggers

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Flame, 
  Award, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Trophy, 
  ArrowRight,
  PlusCircle,
  TrendingUp
} from 'lucide-react';

export default function JoinedChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Check-in modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchJoined = async () => {
    try {
      setLoading(true);
      const res = await api.getUserJoinedChallenges();
      if (res.success) {
        setChallenges(res.challenges || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch joined challenges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoined();
  }, []);

  const handleOpenCheckIn = (challenge) => {
    setSelectedChallenge(challenge);
    setNote('');
    setModalOpen(true);
  };

  const handleSubmitCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedChallenge) return;

    try {
      setSubmitting(true);
      const res = await api.submitCheckIn(selectedChallenge.id, note);
      setActionSuccess(res.message);
      setModalOpen(false);
      await fetchJoined();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Check-in submission failed.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-flex">
        <div>
          <h1>My Enrolled Challenges</h1>
          <p>Maintain your daily check-ins, protect your streaks, and keep your squad motivated.</p>
        </div>
        <Link to="/explore" className="btn btn-secondary">
          <PlusCircle size={18} />
          <span>Join Another Squad</span>
        </Link>
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your enrolled challenges...</p>
        </div>
      ) : challenges.length === 0 ? (
        <div className="empty-state-card">
          <TrendingUp size={48} className="empty-icon" />
          <h3>You haven't joined any challenges yet</h3>
          <p>Explore public challenges or enter a private invite code to begin your consistency journey.</p>
          <Link to="/explore" className="btn btn-primary">Explore Challenges</Link>
        </div>
      ) : (
        <div className="challenges-grid">
          {challenges.map(({ challenge, userProgress }) => {
            const currentStreak = userProgress?.currentStreak || 0;
            const longestStreak = userProgress?.longestStreak || 0;
            const totalCheckIns = userProgress?.totalCheckIns || 0;
            const progressPct = userProgress?.progressPercentage || 0;

            return (
              <div key={challenge.id} className="challenge-card joined-card">
                <div className="card-top">
                  <span className="challenge-duration">
                    <Clock size={14} />
                    <span>{challenge.duration} Days</span>
                  </span>
                  <div className="streak-tag">
                    <Flame size={15} />
                    <span>{currentStreak} Day Streak</span>
                  </div>
                </div>

                <h3 className="challenge-title">{challenge.title}</h3>
                <p className="challenge-desc">{challenge.description}</p>

                {/* Streak and Completion Metrics */}
                <div className="card-metrics-row">
                  <div className="metric-pill">
                    <CheckCircle2 size={14} className="text-green" />
                    <span>{totalCheckIns} Done</span>
                  </div>
                  <div className="metric-pill">
                    <Award size={14} className="text-purple" />
                    <span>Best: {longestStreak}d</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-section">
                  <div className="progress-labels">
                    <span>Goal: {totalCheckIns} / {challenge.duration} days</span>
                    <span className="progress-pct">{progressPct}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="joined-actions-footer">
                  <button 
                    onClick={() => handleOpenCheckIn(challenge)}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    <CheckCircle2 size={16} />
                    <span>Check In</span>
                  </button>

                  <Link 
                    to={`/challenges/${challenge.id}/leaderboard`} 
                    className="btn-icon-link" 
                    title="View Leaderboard"
                  >
                    <Trophy size={18} />
                  </Link>

                  <Link 
                    to={`/challenges/${challenge.id}/chat`} 
                    className="btn-icon-link" 
                    title="Squad Chat"
                  >
                    <MessageSquare size={18} />
                  </Link>

                  <Link 
                    to={`/challenges/${challenge.id}`} 
                    className="btn-icon-link" 
                    title="Challenge Details"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Check In Modal */}
      {modalOpen && (
        <div 
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3>Check In: {selectedChallenge?.title}</h3>
              <button className="btn-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitCheckIn} className="modal-form">
              <div className="form-group">
                <label>Daily Progress Note (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Share a short note about your achievement today..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Recording...' : 'Submit Today’s Check-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
