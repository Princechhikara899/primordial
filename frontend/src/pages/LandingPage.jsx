// frontend/src/pages/LandingPage.jsx
// Landing Page for Primordial

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, 
  Users, 
  Trophy, 
  CalendarCheck, 
  MessageSquare, 
  Database, 
  ArrowRight, 
  CheckCircle 
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  const exampleChallenges = [
    { title: '30 Days of Coding', duration: '30 Days', desc: 'Build daily algorithmic thinking and web dev mastery.', tag: 'Coding' },
    { title: '21 Days of Fitness', duration: '21 Days', desc: '30+ minutes of running, gym, or yoga every day.', tag: 'Health' },
    { title: '15 Days of Reading', duration: '15 Days', desc: 'Read at least 20 pages from insightful non-fiction books.', tag: 'Habits' },
    { title: '30 Days of Daily Study', duration: '30 Days', desc: 'Maintain focus sessions for upcoming exams.', tag: 'Academics' },
    { title: '7 Days of Early Waking', duration: '7 Days', desc: 'Wake up at 6:00 AM and establish a morning routine.', tag: 'Lifestyle' },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-pill">
            <Flame className="hero-flame" size={16} />
            <span>StreakSquad • Goal Accountability Platform</span>
          </div>
          <h1 className="hero-title">
            Build Unstoppable Habits With Your Squad
          </h1>
          <p className="hero-subtitle">
            Primordial is a collaborative goal accountability platform. Create challenges with friends, submit daily check-ins, maintain live streaks, and climb the leaderboard.
          </p>
          <div className="hero-cta-group">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start Your Challenge <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Sign In (Demo Accounts)
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Goal Tracking Works on Primordial</h2>
          <p>Overcoming inconsistency through peer accountability, transparent progress, and game mechanics.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper bg-orange">
              <Flame size={24} />
            </div>
            <h3>Consecutive Streak Engine</h3>
            <p>Our custom calendar-day algorithm tracks active and longest streaks without relying on blackbox external APIs.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper bg-blue">
              <Users size={24} />
            </div>
            <h3>Public & Private Challenges</h3>
            <p>Host open public challenges or private invite-only squads secured with 8-character unique invite codes.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper bg-green">
              <CalendarCheck size={24} />
            </div>
            <h3>Daily Verified Check-ins</h3>
            <p>Log your daily wins with progress notes. Relational unique constraints prevent duplicate submissions on the same day.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper bg-purple">
              <Trophy size={24} />
            </div>
            <h3>SQL-Powered Leaderboard</h3>
            <p>Real-time participant rankings computed using PostgreSQL aggregates, <code>GROUP BY</code>, and <code>DENSE_RANK()</code> window functions.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper bg-teal">
              <MessageSquare size={24} />
            </div>
            <h3>MongoDB Squad Chat</h3>
            <p>Challenge-specific group discussions backed by a dedicated MongoDB document store separate from the relational schema.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper bg-red">
              <Database size={24} />
            </div>
            <h3>Dual-Database Architecture</h3>
            <p>Clean division of responsibilities: PostgreSQL (Prisma ORM) for core relational data; MongoDB for flexible messaging.</p>
          </div>
        </div>
      </section>

      {/* Example Challenges Section */}
      <section className="challenges-preview-section">
        <div className="section-header">
          <h2>Featured Squad Challenges</h2>
          <p>Join popular goals or create your own custom challenge in seconds.</p>
        </div>

        <div className="challenges-grid">
          {exampleChallenges.map((item, index) => (
            <div key={index} className="challenge-card">
              <div className="card-top">
                <span className="challenge-tag">{item.tag}</span>
                <span className="challenge-duration">{item.duration}</span>
              </div>
              <h3 className="challenge-title">{item.title}</h3>
              <p className="challenge-desc">{item.desc}</p>
              <div className="card-footer">
                <Link to="/explore" className="btn btn-secondary btn-sm">
                  Explore Challenge
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Architecture Highlights */}
      <section className="viva-banner-section">
        <div className="viva-banner-card">
          <div className="viva-header">
            <span className="viva-pill">Architecture Highlights</span>
            <h3>Clean Full-Stack Implementation</h3>
            <p>Engineered with modular Express MVC architecture, relational database constraints, session-based cookies, and dual databases.</p>
          </div>
          <div className="viva-points-grid">
            <div className="viva-point">
              <CheckCircle size={18} className="text-success" />
              <span>Session Cookies (HTTP-Only)</span>
            </div>
            <div className="viva-point">
              <CheckCircle size={18} className="text-success" />
              <span>PostgreSQL Schema Constraints</span>
            </div>
            <div className="viva-point">
              <CheckCircle size={18} className="text-success" />
              <span>Window Functions & Aggregates</span>
            </div>
            <div className="viva-point">
              <CheckCircle size={18} className="text-success" />
              <span>MongoDB Document Referencing</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
