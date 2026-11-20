// backend/src/routes/challengeRoutes.js
// Challenge Management & Nested Challenge Action Routes

const express = require('express');
const router = express.Router();

const {
  createChallenge,
  getPublicChallenges,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
  getUserCreatedChallenges,
} = require('../controllers/challengeController');

const {
  joinChallenge,
  joinPrivateChallenge,
  leaveChallenge,
  getChallengeMembers,
} = require('../controllers/membershipController');

const {
  submitCheckIn,
  getChallengeCheckIns,
  useStreakFreeze,
  getStreakFreezes,
} = require('../controllers/checkinController');

const {
  getChallengeLeaderboard,
} = require('../controllers/leaderboardController');

const { sendMessage, getMessages } = require('../controllers/chatController');

const { requireAuth } = require('../middleware/authMiddleware');
const { validateChallenge, validateChallengeUpdate } = require('../middleware/validationMiddleware');

// --- Public Routes ---
// GET /api/challenges - List public challenges
router.get('/', getPublicChallenges);

// --- Challenge Creation & User Created ---
// POST /api/challenges - Create challenge
router.post('/', requireAuth, validateChallenge, createChallenge);

// GET /api/challenges/user/created - Get challenges created by logged-in user
router.get('/user/created', requireAuth, getUserCreatedChallenges);

// POST /api/challenges/join-private - Join private challenge via invite code
router.post('/join-private', requireAuth, joinPrivateChallenge);

// --- Challenge Details, Update, Delete ---
// GET /api/challenges/:id - Get challenge details
router.get('/:id', requireAuth, getChallengeById);

// PUT /api/challenges/:id - Update challenge (creator only)
router.put('/:id', requireAuth, validateChallengeUpdate, updateChallenge);

// DELETE /api/challenges/:id - Delete challenge (creator only)
router.delete('/:id', requireAuth, deleteChallenge);

// --- Memberships (Join, Leave, List Members) ---
// POST /api/challenges/:id/join - Join public challenge
router.post('/:id/join', requireAuth, joinChallenge);

// POST /api/challenges/:id/leave - Leave challenge
router.post('/:id/leave', requireAuth, leaveChallenge);

// GET /api/challenges/:id/members - Get all participants
router.get('/:id/members', requireAuth, getChallengeMembers);

// --- Check-ins & Streak Freezes ---
// POST /api/challenges/:id/checkins - Submit daily check-in
router.post('/:id/checkins', requireAuth, submitCheckIn);

// GET /api/challenges/:id/checkins - Get all check-ins for this challenge
router.get('/:id/checkins', requireAuth, getChallengeCheckIns);

// POST /api/challenges/:id/streak-freeze - Use a streak freeze to protect a missed day
router.post('/:id/streak-freeze', requireAuth, useStreakFreeze);

// GET /api/challenges/:id/streak-freeze - View streak freezes used for this challenge
router.get('/:id/streak-freeze', requireAuth, getStreakFreezes);

// --- Leaderboard ---
// GET /api/challenges/:id/leaderboard - Cumulative leaderboard with ranks and streaks
router.get('/:id/leaderboard', requireAuth, getChallengeLeaderboard);

// --- Group Chat (MongoDB) ---
// POST /api/challenges/:id/messages - Send message to challenge chat
router.post('/:id/messages', requireAuth, sendMessage);

// GET /api/challenges/:id/messages - Get chat messages for challenge
router.get('/:id/messages', requireAuth, getMessages);

module.exports = router;
