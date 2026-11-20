// frontend/src/pages/ExploreChallengesPage.jsx
// Explore Public Challenges and Join Private Challenges via Invite Code

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Compass, 
  Search, 
  Key, 
  Users, 
  Clock, 
  CheckCircle2, 
  PlusCircle 
} from 'lucide-react';

export default function ExploreChallengesPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Invite code modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const res = await api.getPublicChallenges();
      if (res.success) {
        setChallenges(res.challenges || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load public challenges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleJoinPublic = async (challengeId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setError('');
      const res = await api.joinChallenge(challengeId);
      setSuccessMsg(res.message);
      await fetchChallenges();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to join challenge.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleJoinPrivate = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!inviteCodeInput.trim()) {
      setInviteError('Please enter a valid invite code.');
      return;
    }

    try {
      setInviteLoading(true);
      setInviteError('');
      const res = await api.joinPrivateChallenge(inviteCodeInput.trim());
      setSuccessMsg(res.message);
      setInviteModalOpen(false);
      setInviteCodeInput('');
      navigate(`/challenges/${res.challenge.id}`);
    } catch (err) {
      setInviteError(err.message || 'Invalid invite code or already joined.');
    } finally {
      setInviteLoading(false);
    }
  };

  const filteredChallenges = challenges.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  return (
    <div className="page-container">
      <div className="page-header-flex">
        <div>
          <h1>Explore Squad Challenges</h1>
          <p>Discover public accountability challenges or enter an invite code to join a private squad.</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => {
              if (!isAuthenticated) return navigate('/login');
              setInviteModalOpen(true);
              setInviteError('');
            }}
          >
            <Key size={18} />
            <span>Enter Invite Code</span>
          </button>

          <Link to="/create" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Create Challenge</span>
          </Link>
        </div>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Search Bar */}
      <div className="search-bar-wrapper">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search challenges by title or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading available challenges...</p>
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="empty-state-card">
          <Compass size={48} className="empty-icon" />
          <h3>No challenges found</h3>
          <p>Try searching with another keyword or create the first challenge yourself!</p>
          <Link to="/create" className="btn btn-primary">Create New Challenge</Link>
        </div>
      ) : (
        <div className="challenges-grid">
          {filteredChallenges.map((c) => (
            <div key={c.id} className="challenge-card">
              <div className="card-top">
                <span className="challenge-duration">
                  <Clock size={14} />
                  <span>{c.duration} Days</span>
                </span>
                <span className="member-count">
                  <Users size={14} />
                  <span>{c.totalMembers} participants</span>
                </span>
              </div>

              <h3 className="challenge-title">{c.title}</h3>
              <p className="challenge-desc">{c.description}</p>

              <div className="creator-info">
                <span>Organized by: <strong>{c.creator?.name || 'Squad Lead'}</strong></span>
              </div>

              <div className="challenge-card-footer">
                <Link to={`/challenges/${c.id}`} className="btn btn-outline btn-sm">
                  View Details
                </Link>

                {c.isJoined ? (
                  <span className="joined-badge">
                    <CheckCircle2 size={16} /> Joined
                  </span>
                ) : (
                  <button 
                    onClick={() => handleJoinPublic(c.id)} 
                    className="btn btn-primary btn-sm"
                  >
                    Join Challenge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Joining Private Challenge */}
      {inviteModalOpen && (
        <div 
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setInviteModalOpen(false); }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Key size={20} className="text-primary" />
                <h3>Join Private Challenge</h3>
              </div>
              <button 
                className="btn-close" 
                onClick={() => setInviteModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <p className="modal-subtitle">
              Enter the 8-character invite code shared by your friend or squad leader.
            </p>

            {inviteError && <div className="alert alert-error">{inviteError}</div>}

            <form onSubmit={handleJoinPrivate} className="modal-form">
              <div className="form-group">
                <label>Invite Code</label>
                <input
                  type="text"
                  placeholder="e.g. EARLY6AM"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  maxLength={12}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setInviteModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={inviteLoading}
                >
                  {inviteLoading ? 'Verifying Code...' : 'Join Private Squad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
