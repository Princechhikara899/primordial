// frontend/src/pages/LeaderboardPage.jsx
// Challenge Leaderboard based on verified check-in counts using PostgreSQL window functions

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Trophy,
  Flame,
  ArrowLeft,
  CheckCircle2,
  Code,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';

export default function LeaderboardPage() {
  const { id } = useParams();

  const [challenge, setChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSqlExplain, setShowSqlExplain] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await api.getLeaderboard(id);
        if (res.success) {
          setChallenge(res.challenge);
          setLeaderboard(res.leaderboard || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load challenge leaderboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [id]);

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="rank-badge rank-1">🥇 #1</span>;
    if (rank === 2) return <span className="rank-badge rank-2">🥈 #2</span>;
    if (rank === 3) return <span className="rank-badge rank-3">🥉 #3</span>;
    return <span className="rank-badge rank-other">#{rank}</span>;
  };

  return (
    <div className="page-container">
      <div className="back-link-wrapper">
        <Link to={`/challenges/${id}`} className="back-link">
          <ArrowLeft size={16} /> Back to Challenge Details
        </Link>
      </div>

      <div className="page-header-flex">
        <div>
          <div className="leaderboard-title-group">
            <Trophy className="trophy-header-icon" size={32} />
            <div>
              <h1>{challenge ? `${challenge.title} — Leaderboard` : 'Squad Leaderboard'}</h1>
              <p>Rankings calculated from verified PostgreSQL daily check-ins.</p>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <Link to={`/challenges/${id}/chat`} className="btn btn-secondary">
            <MessageSquare size={16} />
            <span>Squad Chat</span>
          </Link>
          <button
            onClick={() => setShowSqlExplain(!showSqlExplain)}
            className="btn btn-outline"
          >
            <Code size={16} />
            <span>{showSqlExplain ? 'Hide SQL Logic' : 'View SQL Query'}</span>
            {showSqlExplain ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* SQL Explanation Accordion */}
      {showSqlExplain && (
        <div className="sql-card-box">
          <div className="sql-card-header">
            <h4>PostgreSQL Query: Aggregates &amp; Window Functions</h4>
            <span className="badge-sql">DENSE_RANK() · COUNT() · LEFT JOIN</span>
          </div>
          <p>
            The leaderboard rankings below are computed directly in PostgreSQL using relational{' '}
            <code>JOIN</code>s, the <code>COUNT()</code> aggregate, and the{' '}
            <code>DENSE_RANK() OVER (...)</code> window function:
          </p>
          <pre className="code-block">
{`SELECT 
  u.id AS "userId",
  u.name AS "userName",
  u.email AS "userEmail",
  COUNT(c.id)::int AS "totalCheckIns",
  DENSE_RANK() OVER (ORDER BY COUNT(c.id) DESC) AS "sqlRank"
FROM memberships m
JOIN users u ON m."userId" = u.id
LEFT JOIN checkins c 
  ON m."challengeId" = c."challengeId" 
  AND m."userId" = c."userId"
WHERE m."challengeId" = $1
GROUP BY u.id, u.name, u.email
ORDER BY "totalCheckIns" DESC, u.name ASC;`}
          </pre>
          <div className="sql-notes">
            <span>• <strong>LEFT JOIN:</strong> Ensures participants with 0 check-ins are still included.</span>
            <span>• <strong>DENSE_RANK():</strong> Consistently handles tied scores without skipping ranks.</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Computing rankings from PostgreSQL...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-state-card">
          <Trophy size={48} className="empty-icon" />
          <h3>No participants yet</h3>
          <p>Be the first to join this challenge squad and claim the #1 spot!</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Participant</th>
                <th>Check-ins</th>
                <th>Current Streak</th>
                <th>Longest Streak</th>
                <th>Goal Progress</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((u) => (
                <tr key={u.userId} className={u.rank === 1 ? 'top-rank-row' : ''}>
                  <td>{getRankBadge(u.rank)}</td>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-sm">{u.name?.charAt(0).toUpperCase() || 'U'}</div>
                      <div>
                        <strong>{u.name}</strong>
                        <div className="user-email-text">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="checkin-count-badge">
                      <CheckCircle2 size={15} className="text-green" />
                      <strong>{u.totalCheckIns}</strong> days
                    </span>
                  </td>
                  <td>
                    <span className="streak-badge-table">
                      <Flame size={15} className="text-orange" />
                      <strong>{u.currentStreak}</strong> days
                    </span>
                  </td>
                  <td>
                    <span className="text-muted">{u.longestStreak} days</span>
                  </td>
                  <td>
                    <div className="table-progress-wrapper">
                      <div className="table-progress-bg">
                        <div
                          className="table-progress-fill"
                          style={{ width: `${u.progressPercentage}%` }}
                        ></div>
                      </div>
                      <span className="progress-pct-text">{u.progressPercentage}%</span>
                    </div>
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
