// frontend/src/components/Footer.jsx
// Application Footer Component

import React from 'react';
import { Database, ShieldCheck, Flame, Award, Snowflake } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-logo">⚡ Primordial</span>
            <p className="footer-desc">
              Full-Stack Goal Accountability & Habit Consistency Platform. Build daily momentum, protect streaks with freezes, and compete on squad leaderboards.
            </p>
          </div>

          <div className="footer-features-col">
            <h4>Core Platform Pillars</h4>
            <div className="footer-pillars-grid">
              <div className="pillar-item">
                <Flame size={16} className="text-orange" />
                <span>Streak Tracking & Daily Consistency</span>
              </div>
              <div className="pillar-item">
                <Snowflake size={16} className="text-blue" />
                <span>Streak Freeze Protection System</span>
              </div>
              <div className="pillar-item">
                <Award size={16} className="text-purple" />
                <span>Squad Leaderboards (PostgreSQL)</span>
              </div>
              <div className="pillar-item">
                <Database size={16} className="text-green" />
                <span>PostgreSQL Relational + MongoDB Document Store</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="tech-badges">
            <span className="badge"><Database size={12} /> PostgreSQL 16+ (Prisma ORM)</span>
            <span className="badge"><Database size={12} /> MongoDB (Group Chat)</span>
            <span className="badge"><ShieldCheck size={12} /> Session-Based Cookies</span>
            <span className="badge"><Flame size={12} /> Express MVC + React 18</span>
          </div>
          <p className="copyright">
            Primordial Goal Platform © {new Date().getFullYear()}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
