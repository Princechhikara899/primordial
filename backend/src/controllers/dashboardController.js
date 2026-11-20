// backend/src/controllers/dashboardController.js
// Dashboard Statistics & User History Controller

const prisma = require('../config/prisma');
const { calculateStreaks, toDateString, daysBetween } = require('../services/streakService');

/**
 * Get user dashboard statistics
 * Method: GET /api/users/me/dashboard
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user profile, created count, check-ins, freezes, and memberships in parallel
    const [user, totalCreated, allUserCheckIns, allUserFreezes, memberships] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { streakFreezes: true },
      }),
      prisma.challenge.count({
        where: { creatorId: userId },
      }),
      prisma.checkIn.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: 'asc' },
      }),
      prisma.streakFreeze.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: 'asc' },
      }),
      prisma.membership.findMany({
        where: { userId },
        include: {
          challenge: {
            include: {
              creator: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      }),
    ]);

    const totalJoined = memberships.length;
    const totalCheckIns = allUserCheckIns.length;
    const globalStreaks = calculateStreaks(allUserCheckIns, 30, allUserFreezes);

    let activeCount = 0;
    let completedCount = 0;

    const challengesWithProgress = await Promise.all(
      memberships.map(async (m) => {
        const [challengeCheckIns, challengeFreezes] = await Promise.all([
          prisma.checkIn.findMany({
            where: {
              userId,
              challengeId: m.challengeId,
            },
            orderBy: { date: 'asc' },
          }),
          prisma.streakFreeze.findMany({
            where: {
              userId,
              challengeId: m.challengeId,
            },
            orderBy: { date: 'asc' },
          }),
        ]);

        const progress = calculateStreaks(challengeCheckIns, m.challenge.duration, challengeFreezes);

        const daysSinceJoined = daysBetween(toDateString(m.joinedAt), toDateString(new Date()));
        const isCompleted = progress.totalCheckIns >= m.challenge.duration || daysSinceJoined >= m.challenge.duration;

        if (isCompleted) {
          completedCount++;
        } else {
          activeCount++;
        }

        return {
          id: m.challenge.id,
          title: m.challenge.title,
          description: m.challenge.description,
          duration: m.challenge.duration,
          visibility: m.challenge.visibility,
          creator: m.challenge.creator,
          joinedAt: m.joinedAt,
          daysSinceJoined,
          status: isCompleted ? 'COMPLETED' : 'ACTIVE',
          progress,
        };
      })
    );

    res.status(200).json({
      success: true,
      stats: {
        totalCreated,
        totalJoined,
        activeChallenges: activeCount,
        completedChallenges: completedCount,
        totalCheckIns,
        availableFreezes: user ? user.streakFreezes : 0,
        currentStreak: globalStreaks.currentStreak,
        longestStreak: globalStreaks.longestStreak,
      },
      challenges: challengesWithProgress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed challenge participation history for the logged-in user
 * Method: GET /api/users/me/history
 */
const getUserHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        challenge: {
          include: {
            creator: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const history = await Promise.all(
      memberships.map(async (m) => {
        const [checkIns, freezes] = await Promise.all([
          prisma.checkIn.findMany({
            where: {
              userId,
              challengeId: m.challengeId,
            },
            orderBy: { date: 'desc' },
          }),
          prisma.streakFreeze.findMany({
            where: {
              userId,
              challengeId: m.challengeId,
            },
            orderBy: { date: 'desc' },
          }),
        ]);

        const streakStats = calculateStreaks(checkIns, m.challenge.duration, freezes);

        const startDate = new Date(m.joinedAt);
        const endDate = new Date(startDate.getTime() + m.challenge.duration * 24 * 60 * 60 * 1000);

        const isCompleted =
          streakStats.totalCheckIns >= m.challenge.duration ||
          new Date() >= endDate;

        return {
          challengeId: m.challenge.id,
          challengeTitle: m.challenge.title,
          duration: m.challenge.duration,
          startDate: toDateString(startDate),
          endDate: toDateString(endDate),
          status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          totalCheckIns: streakStats.totalCheckIns,
          currentStreak: streakStats.currentStreak,
          longestStreak: streakStats.longestStreak,
          progressPercentage: streakStats.progressPercentage,
          freezesUsed: streakStats.freezesUsed,
          checkInHistory: checkIns.map((c) => ({
            id: c.id,
            date: toDateString(c.date),
            note: c.note,
            createdAt: c.createdAt,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUserHistory,
};
