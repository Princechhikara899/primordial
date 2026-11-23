// backend/src/app.js
// Express Application Configuration & Middleware Setup

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const sessionConfig = require('./config/session');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Enable proxy trusting so secure session cookies and proxy headers work
app.set('trust proxy', 1);

// -------------------------------------------------------------
// 1. Core App-Level Middlewares
// -------------------------------------------------------------

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// CORS configuration (restrict allowed origins with credentials support)
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [
  clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl, Postman, test suite)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    },
    credentials: true, // Allow session cookies across origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// Session Middleware
app.use(sessionConfig);

// -------------------------------------------------------------
// 2. Health Check Route
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Primordial Backend is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// 3. API Routes Mount Points
// -------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', chatRoutes);

// -------------------------------------------------------------
// 4. Centralized Error Handling Middlewares
// -------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
