// backend/src/controllers/leaderboardController.js
// Leaderboard Controller: Simple Challenge Leaderboard based on Check-in Count

const prisma = require('../config/prisma');
const { calculateStreaks } = require('../services/streakService');

/**
 * Get cumulative challenge leaderboard
 * Demonstrates PostgreSQL aggregation, GROUP BY, COUNT, and Window Functions (DENSE_RANK)
 * Method: GET /api/challenges/:id/leaderboard
 */
const getChallengeLeaderboard = async (req, res, next) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }

    // 1. Verify challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { id: true, title: true, duration: true, visibility: true, creatorId: true },
    });

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    // Authorization check for PRIVATE challenges
    if (challenge.visibility === 'PRIVATE') {
      const isCreator = challenge.creatorId === req.user.id;
      const membership = await prisma.membership.findUnique({
        where: {
          userId_challengeId: {
            userId: req.user.id,
            challengeId,
          },
        },
      });

      if (!isCreator && !membership) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. This is a private challenge. You must be an active member to view the leaderboard.',
        });
      }
    }

    // 2. Execute SQL query with aggregation and window function (DENSE_RANK)
    const rawLeaderboard = await prisma.$queryRaw`
      SELECT 
        u.id AS "userId",
        u.name AS "userName",
        u.email AS "userEmail",
        COUNT(c.id)::int AS "totalCheckIns",
        DENSE_RANK() OVER (ORDER BY COUNT(c.id) DESC) AS "sqlRank"
      FROM memberships m
      JOIN users u ON m."userId" = u.id
      LEFT JOIN checkins c ON m."challengeId" = c."challengeId" AND m."userId" = c."userId"
      WHERE m."challengeId" = ${challengeId}
      GROUP BY u.id, u.name, u.email
      ORDER BY "totalCheckIns" DESC, u.name ASC;
    `;

    // 3. Enhance with currentStreak, longestStreak, and streak freezes for each participant
    const enhancedLeaderboard = await Promise.all(
      rawLeaderboard.map(async (row) => {
        const [checkIns, freezes] = await Promise.all([
          prisma.checkIn.findMany({
            where: {
              challengeId,
              userId: row.userId,
            },
            select: { date: true },
            orderBy: { date: 'asc' },
          }),
          prisma.streakFreeze.findMany({
            where: {
              challengeId,
              userId: row.userId,
            },
            select: { date: true },
          }),
        ]);

        const streakInfo = calculateStreaks(checkIns, challenge.duration, freezes);

        return {
          rank: Number(row.sqlRank),
          userId: row.userId,
          name: row.userName,
          email: row.userEmail,
          totalCheckIns: row.totalCheckIns,
          currentStreak: streakInfo.currentStreak,
          longestStreak: streakInfo.longestStreak,
          progressPercentage: streakInfo.progressPercentage,
          freezesUsed: streakInfo.freezesUsed,
        };
      })
    );

    res.status(200).json({
      success: true,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        duration: challenge.duration,
      },
      leaderboard: enhancedLeaderboard,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChallengeLeaderboard,
};
