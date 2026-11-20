// backend/src/config/session.js
// Session configuration for Express session-based authentication

const session = require('express-session');

const sessionConfig = session({
  name: 'primordial.sid', // Session cookie name
  secret: process.env.SESSION_SECRET || 'primordial_fallback_session_secret_key',
  resave: false,           // Do not save session if unmodified
  saveUninitialized: false,// Do not create empty session until something is stored
  cookie: {
    httpOnly: true,        // Mitigate XSS attacks by preventing client JS from reading cookie
    secure: process.env.NODE_ENV === 'production', // true only over HTTPS in production
    sameSite: 'lax',       // Allow cross-site get navigation while protecting from CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  },
});

module.exports = sessionConfig;
