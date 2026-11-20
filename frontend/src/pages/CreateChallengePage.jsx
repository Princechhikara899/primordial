// frontend/src/pages/CreateChallengePage.jsx
// Create Challenge Page with Public/Private Options & Friendly Presets

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  PlusCircle, 
  Globe, 
  Lock, 
  AlertCircle, 
  Sparkles,
  BookOpen,
  Code,
  Dumbbell,
  Sun
} from 'lucide-react';

export default function CreateChallengePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [visibility, setVisibility] = useState('PUBLIC');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const applyTemplate = (tmplTitle, tmplDesc, tmplDuration) => {
    setTitle(tmplTitle);
    setDescription(tmplDesc);
    setDuration(tmplDuration);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Challenge title is required.');
      return;
    }

    if (!description.trim()) {
      setError('Challenge description is required.');
      return;
    }

    if (duration < 1 || duration > 365) {
      setError('Duration must be between 1 and 365 days.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.createChallenge({
        title: title.trim(),
        description: description.trim(),
        duration: parseInt(duration, 10),
        visibility,
      });

      if (res.success && res.challenge) {
        navigate(`/challenges/${res.challenge.id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to create challenge.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="create-challenge-wrapper">
        <div className="page-header">
          <h1>Create a New Challenge Squad</h1>
          <p>Define a habit or goal, pick a duration, and invite friends to stay accountable together.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Inspiration Presets */}
        <div className="templates-bar">
          <span className="templates-label">
            <Sparkles size={16} /> Quick Ideas:
          </span>
          <div className="templates-pills">
            <button
              type="button"
              className="template-btn"
              onClick={() =>
                applyTemplate(
                  '30 Days of Coding',
                  'Solve algorithmic questions or build web dev features every single day.',
                  30
                )
              }
            >
              <Code size={14} /> 30 Days of Coding
            </button>
            <button
              type="button"
              className="template-btn"
              onClick={() =>
                applyTemplate(
                  '21 Days of Fitness',
                  'Complete at least 30 minutes of running, gym workout, or yoga each morning.',
                  21
                )
              }
            >
              <Dumbbell size={14} /> 21 Days of Fitness
            </button>
            <button
              type="button"
              className="template-btn"
              onClick={() =>
                applyTemplate(
                  '15 Days of Reading',
                  'Read at least 20 pages from an insightful educational or non-fiction book.',
                  15
                )
              }
            >
              <BookOpen size={14} /> 15 Days of Reading
            </button>
            <button
              type="button"
              className="template-btn"
              onClick={() =>
                applyTemplate(
                  '7 Days of Early Waking',
                  'Wake up at 6:00 AM every morning and complete a healthy morning routine.',
                  7
                )
              }
            >
              <Sun size={14} /> 7 Days Early Waking
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="custom-form card-form">
          <div className="form-group">
            <label htmlFor="title">Challenge Title *</label>
            <input
              id="title"
              type="text"
              placeholder="e.g. 30 Days of Coding"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Goal Description &amp; Rules *</label>
            <textarea
              id="description"
              rows="3"
              placeholder="Explain the criteria for a valid daily check-in..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="duration">Duration (Days) *</label>
              <input
                id="duration"
                type="number"
                min="1"
                max="365"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
              <span className="field-hint">Common lengths: 7, 14, 21, 30, 60, or 100 days.</span>
            </div>

            <div className="form-group flex-1">
              <label>Squad Visibility *</label>
              <div className="radio-cards-row">
                <label className={`radio-card ${visibility === 'PUBLIC' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="visibility"
                    value="PUBLIC"
                    checked={visibility === 'PUBLIC'}
                    onChange={() => setVisibility('PUBLIC')}
                  />
                  <Globe size={18} />
                  <div>
                    <strong>Public</strong>
                    <small>Anyone can explore and join</small>
                  </div>
                </label>

                <label className={`radio-card ${visibility === 'PRIVATE' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="visibility"
                    value="PRIVATE"
                    checked={visibility === 'PRIVATE'}
                    onChange={() => setVisibility('PRIVATE')}
                  />
                  <Lock size={18} />
                  <div>
                    <strong>Private</strong>
                    <small>Requires 8-character invite code</small>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <PlusCircle size={18} />
              <span>{loading ? 'Creating...' : 'Create Challenge'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
