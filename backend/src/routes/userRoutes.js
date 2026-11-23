// backend/src/routes/userRoutes.js
// User Scoped Endpoints: Dashboard, History, Joined Challenges, Personal Check-ins

const express = require('express');
const router = express.Router();

const { getUserJoinedChallenges } = require('../controllers/membershipController');
const { getUserCheckIns } = require('../controllers/checkinController');
const {
  getDashboardStats,
  getUserHistory,
  getUserBadges,
} = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authMiddleware');

// All /api/users/me/* routes require authentication
router.use('/me', requireAuth);

// GET /api/users/me/dashboard - User overview statistics & active challenges
router.get('/me/dashboard', getDashboardStats);

// GET /api/users/me/history - Detailed challenge participation history
router.get('/me/history', getUserHistory);

// GET /api/users/me/challenges - Challenges joined by current user
router.get('/me/challenges', getUserJoinedChallenges);

// GET /api/users/me/checkins - Check-in history for current user
router.get('/me/checkins', getUserCheckIns);

// GET /api/users/me/badges - Earned milestone achievement badges
router.get('/me/badges', getUserBadges);

module.exports = router;
