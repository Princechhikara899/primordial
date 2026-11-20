// frontend/src/pages/ChallengeDetailsPage.jsx
// Full Challenge Details, Member Roster, Join/Leave & Quick Actions

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Clock, 
  Lock, 
  Globe, 
  CheckCircle2, 
  MessageSquare, 
  Trophy, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  ArrowLeft 
} from 'lucide-react';

export default function ChallengeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Check-in modal
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [note, setNote] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const [editLoading, setEditLoading] = useState(false);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const res = await api.getChallengeById(id);
      if (res.success) {
        setChallenge(res.challenge);
        setEditTitle(res.challenge.title);
        setEditDesc(res.challenge.description);
        setEditDuration(res.challenge.duration);
      }
    } catch (err) {
      setError(err.message || 'Failed to load challenge details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, [id]);

  const handleCopyInviteCode = () => {
    if (challenge?.inviteCode) {
      navigator.clipboard.writeText(challenge.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleJoin = async () => {
    try {
      const res = await api.joinChallenge(id);
      setActionSuccess(res.message);
      await fetchChallenge();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Could not join challenge.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this challenge squad?')) return;
    try {
      const res = await api.leaveChallenge(id);
      setActionSuccess(res.message);
      await fetchChallenge();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Could not leave challenge.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this challenge? This will remove all associated check-ins and memberships.')) return;
    try {
      await api.deleteChallenge(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to delete challenge.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      await api.updateChallenge(id, {
        title: editTitle,
        description: editDesc,
        duration: parseInt(editDuration, 10),
      });
      setEditOpen(false);
      setActionSuccess('Challenge updated successfully.');
      await fetchChallenge();
    } catch (err) {
      setError(err.message || 'Failed to update challenge.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSubmitCheckIn = async (e) => {
    e.preventDefault();
    try {
      setCheckInLoading(true);
      const res = await api.submitCheckIn(id, note);
      setActionSuccess(res.message);
      setCheckInOpen(false);
      setNote('');
      await fetchChallenge();
    } catch (err) {
      setError(err.message || 'Failed to submit check-in.');
    } finally {
      setCheckInLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading challenge details...</p>
        </div>
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error}</div>
        <Link to="/explore" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="back-link-wrapper">
        <Link to="/explore" className="back-link">
          <ArrowLeft size={16} /> Back to Challenges
        </Link>
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Challenge Header Card */}
      <div className="details-header-card">
        <div className="details-top">
          <div className="meta-pills">
            <span className={`visibility-pill ${challenge.visibility.toLowerCase()}`}>
              {challenge.visibility === 'PUBLIC' ? <Globe size={14} /> : <Lock size={14} />}
              <span>{challenge.visibility}</span>
            </span>

            <span className="duration-pill">
              <Clock size={14} />
              <span>{challenge.duration} Days</span>
            </span>

            <span className="members-pill">
              <Users size={14} />
              <span>{challenge.totalMembers} Members</span>
            </span>
          </div>

          {challenge.isCreator && (
            <div className="creator-actions">
              <button onClick={() => setEditOpen(true)} className="btn btn-outline btn-sm">
                <Edit3 size={15} /> Edit
              </button>
              <button onClick={handleDelete} className="btn btn-danger btn-sm">
                <Trash2 size={15} /> Delete
              </button>
            </div>
          )}
        </div>

        <h1 className="details-title">{challenge.title}</h1>
        <p className="details-desc">{challenge.description}</p>

        {/* Creator and Date */}
        <div className="details-creator-bar">
          <span>Created by: <strong>{challenge.creator?.name}</strong></span>
          <span>Started on: {new Date(challenge.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Private Invite Code Banner */}
        {challenge.inviteCode && (
          <div className="invite-code-box">
            <div className="invite-code-info">
              <Lock size={18} />
              <div>
                <strong>Squad Invite Code:</strong>
                <p>Share this code with friends so they can join this private challenge.</p>
              </div>
            </div>
            <div className="invite-code-display">
              <code>{challenge.inviteCode}</code>
              <button onClick={handleCopyInviteCode} className="btn-copy">
                {copiedCode ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Challenge Action Toolbar */}
        <div className="details-actions-bar">
          {challenge.isMember ? (
            <>
              <button onClick={() => setCheckInOpen(true)} className="btn btn-primary">
                <CheckCircle2 size={18} />
                <span>Submit Daily Check-in</span>
              </button>

              <Link to={`/challenges/${id}/leaderboard`} className="btn btn-secondary">
                <Trophy size={18} />
                <span>Leaderboard</span>
              </Link>

              <Link to={`/challenges/${id}/chat`} className="btn btn-secondary">
                <MessageSquare size={18} />
                <span>Squad Chat</span>
              </Link>

              <button onClick={handleLeave} className="btn btn-outline-danger">
                Leave Challenge
              </button>
            </>
          ) : (
            <button onClick={handleJoin} className="btn btn-primary btn-lg">
              <CheckCircle2 size={20} />
              <span>Join This Challenge Squad</span>
            </button>
          )}
        </div>
      </div>

      {/* Challenge Members List */}
      <div className="dashboard-section mt-6">
        <div className="section-header-flex">
          <div>
            <h2>Squad Members ({challenge.members?.length || 0})</h2>
            <p>Participants committed to this challenge.</p>
          </div>
        </div>

        <div className="members-grid">
          {challenge.members?.map((m) => (
            <div key={m.userId} className="member-card">
              <div className="member-avatar">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="member-details">
                <strong>{m.name}</strong>
                <span>Joined {new Date(m.joinedAt).toLocaleDateString()}</span>
              </div>
              {m.userId === challenge.creator?.id && (
                <span className="creator-pill">Creator</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Check In Modal */}
      {checkInOpen && (
        <div 
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setCheckInOpen(false); }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3>Submit Daily Check-in</h3>
              <button className="btn-close" onClick={() => setCheckInOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitCheckIn} className="modal-form">
              <div className="form-group">
                <label>Progress Note for Today (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Describe your progress today..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setCheckInOpen(false)}>
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

      {/* Edit Challenge Modal */}
      {editOpen && (
        <div 
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setEditOpen(false); }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Challenge</h3>
              <button className="btn-close" onClick={() => setEditOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label>Duration (Days)</label>
                <input
                  type="number"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  min="1"
                  max="365"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
