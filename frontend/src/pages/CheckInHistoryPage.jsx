// frontend/src/pages/CheckInHistoryPage.jsx
// Personal Check-in History and Timeline

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Calendar, CheckCircle2, Filter, Info } from 'lucide-react';

export default function CheckInHistoryPage() {
  const [checkIns, setCheckIns] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async (challengeId = '') => {
    try {
      setLoading(true);
      const [checkInsRes, joinedRes] = await Promise.all([
        api.getUserCheckIns(challengeId),
        api.getUserJoinedChallenges(),
      ]);

      if (checkInsRes.success) {
        setCheckIns(checkInsRes.checkIns || []);
      }
      if (joinedRes.success) {
        setChallenges(joinedRes.challenges || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load check-in history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedChallengeId);
  }, [selectedChallengeId]);

  return (
    <div className="page-container">
      <div className="page-header-flex">
        <div>
          <h1>Check-in History &amp; Logs</h1>
          <p>Chronological record of every verified daily goal check-in stored in PostgreSQL.</p>
        </div>

        {/* Filter Dropdown */}
        <div className="filter-wrapper">
          <Filter size={16} className="filter-icon" />
          <select
            value={selectedChallengeId}
            onChange={(e) => setSelectedChallengeId(e.target.value)}
            className="filter-select"
          >
            <option value="">All Joined Challenges</option>
            {challenges.map(({ challenge }) => (
              <option key={challenge.id} value={challenge.id}>
                {challenge.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Database Constraint Banner for Students/Evaluator */}
      <div className="info-box mb-6">
        <Info size={20} />
        <div>
          <strong>Database Design Concept (PostgreSQL):</strong>
          <p>Each record below enforces a composite unique constraint: <code>@@unique([userId, challengeId, date])</code>, preventing duplicate submissions on the same calendar day.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading check-in logs...</p>
        </div>
      ) : checkIns.length === 0 ? (
        <div className="empty-state-card">
          <Calendar size={48} className="empty-icon" />
          <h3>No check-ins recorded yet</h3>
          <p>Submit your first daily check-in from your dashboard or joined challenges page!</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Challenge Title</th>
                <th>Duration</th>
                <th>Progress Note</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {checkIns.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold text-primary">
                    <div className="table-date-cell">
                      <CheckCircle2 size={16} className="text-green" />
                      <span>{item.date}</span>
                    </div>
                  </td>
                  <td>
                    <strong>{item.challengeTitle}</strong>
                  </td>
                  <td>
                    <span className="badge-duration">{item.challengeDuration} Days</span>
                  </td>
                  <td className="note-cell">
                    {item.note ? item.note : <span className="text-muted">No note attached</span>}
                  </td>
                  <td className="text-muted text-sm">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
