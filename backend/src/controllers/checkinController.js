// backend/src/controllers/checkinController.js
// Daily Check-ins & Streak Freeze Controller

const prisma = require('../config/prisma');
const { calculateStreaks, toDateString, toMidnightUTCDate, daysBetween } = require('../services/streakService');

/**
 * Submit a daily check-in for a challenge
 * Method: POST /api/challenges/:id/checkins
 */
const submitCheckIn = async (req, res, next) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }

    const { note } = req.body;

    // 1. Verify that challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    // 2. Verify that the user is an active participant/member of this challenge
    const membership = await prisma.membership.findUnique({
      where: {
        userId_challengeId: {
          userId: req.user.id,
          challengeId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You must join this challenge before submitting check-ins.',
      });
    }

    // 3. Compute today's normalized midnight UTC date
    const todayMidnight = toMidnightUTCDate(new Date());

    // 4. Check for duplicate daily check-in
    const existingCheckIn = await prisma.checkIn.findUnique({
      where: {
        userId_challengeId_date: {
          userId: req.user.id,
          challengeId,
          date: todayMidnight,
        },
      },
    });

    if (existingCheckIn) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in for this challenge today! Come back tomorrow.',
      });
    }

    // 5. Create the check-in record in PostgreSQL
    const checkIn = await prisma.checkIn.create({
      data: {
        userId: req.user.id,
        challengeId,
        date: todayMidnight,
        metricValue: 1,
        note: note ? note.trim() : null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 6. Fetch user's entire check-in history and streak freezes for this challenge in parallel
    const [allUserCheckIns, allUserFreezes] = await Promise.all([
      prisma.checkIn.findMany({
        where: { userId: req.user.id, challengeId },
        orderBy: { date: 'asc' },
      }),
      prisma.streakFreeze.findMany({
        where: { userId: req.user.id, challengeId },
        orderBy: { date: 'asc' },
      }),
    ]);

    const streakStats = calculateStreaks(allUserCheckIns, challenge.duration, allUserFreezes);

    res.status(201).json({
      success: true,
      message: 'Daily check-in submitted successfully! Keep the streak going!',
      checkIn: {
        id: checkIn.id,
        challengeId: checkIn.challengeId,
        date: toDateString(checkIn.date),
        note: checkIn.note,
        createdAt: checkIn.createdAt,
      },
      updatedStreaks: streakStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Use a Streak Freeze to protect a missed day
 * Method: POST /api/challenges/:id/streak-freeze
 */
const useStreakFreeze = async (req, res, next) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }

    const { date } = req.body; // e.g. "YYYY-MM-DD"

    // 1. Verify membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_challengeId: {
          userId: req.user.id,
          challengeId,
        },
      },
      include: { challenge: true },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You must be a member of this challenge to use a streak freeze.',
      });
    }

    // 2. Verify user has available streak freezes
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { streakFreezes: true },
    });

    if (!user || user.streakFreezes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No streak freezes available. You have consumed all your freezes.',
      });
    }

    // Determine target date to freeze: default to yesterday
    let targetDateStr;
    const todayStr = toDateString(new Date());

    if (date) {
      targetDateStr = toDateString(date);
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      targetDateStr = toDateString(yesterday);
    }

    // Cannot freeze today (today is still in progress) or future days
    if (targetDateStr >= todayStr) {
      return res.status(400).json({
        success: false,
        message: 'You can only use a streak freeze on a past missed day, not today or future days.',
      });
    }

    // Cannot freeze days before the challenge was joined
    const joinedDateStr = toDateString(membership.joinedAt);
    if (targetDateStr < joinedDateStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot freeze a date prior to joining this challenge.',
      });
    }

    // Cannot freeze more than 7 days ago
    if (daysBetween(targetDateStr, todayStr) > 7) {
      return res.status(400).json({
        success: false,
        message: 'Streak freeze can only be applied to a missed day within the last 7 days.',
      });
    }

    const targetDateMidnight = toMidnightUTCDate(targetDateStr);

    // 3. Check if user already checked in on this date
    const existingCheckIn = await prisma.checkIn.findUnique({
      where: {
        userId_challengeId_date: {
          userId: req.user.id,
          challengeId,
          date: targetDateMidnight,
        },
      },
    });

    if (existingCheckIn) {
      return res.status(400).json({
        success: false,
        message: `You already have a verified check-in on ${targetDateStr}. A freeze is not needed.`,
      });
    }

    // 4. Check if a freeze is already applied for this date
    const existingFreeze = await prisma.streakFreeze.findUnique({
      where: {
        userId_challengeId_date: {
          userId: req.user.id,
          challengeId,
          date: targetDateMidnight,
        },
      },
    });

    if (existingFreeze) {
      return res.status(400).json({
        success: false,
        message: `A streak freeze has already been applied for ${targetDateStr}.`,
      });
    }

    // Atomic transaction: create streak freeze record AND decrement user inventory
    const result = await prisma.$transaction(async (tx) => {
      const freeze = await tx.streakFreeze.create({
        data: {
          userId: req.user.id,
          challengeId,
          date: targetDateMidnight,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: req.user.id },
        data: { streakFreezes: { decrement: 1 } },
        select: { streakFreezes: true },
      });

      return { freeze, remainingFreezes: updatedUser.streakFreezes };
    });

    // 5. Recalculate streak with the newly applied freeze
    const [allCheckIns, allFreezes] = await Promise.all([
      prisma.checkIn.findMany({
        where: { userId: req.user.id, challengeId },
        orderBy: { date: 'asc' },
      }),
      prisma.streakFreeze.findMany({
        where: { userId: req.user.id, challengeId },
        orderBy: { date: 'asc' },
      }),
    ]);

    const updatedStreaks = calculateStreaks(allCheckIns, membership.challenge.duration, allFreezes);

    res.status(201).json({
      success: true,
      message: `❄️ Streak Freeze successfully applied for ${targetDateStr}! Your streak has been saved.`,
      freezeDate: targetDateStr,
      remainingFreezes: result.remainingFreezes,
      updatedStreaks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get streak freezes used for a challenge and user's remaining balance
 * Method: GET /api/challenges/:id/streak-freeze
 */
const getStreakFreezes = async (req, res, next) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }

    const [freezes, user] = await Promise.all([
      prisma.streakFreeze.findMany({
        where: { userId: req.user.id, challengeId },
        orderBy: { date: 'desc' },
      }),
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: { streakFreezes: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      availableFreezes: user ? user.streakFreezes : 0,
      usedCount: freezes.length,
      freezes: freezes.map((f) => ({
        id: f.id,
        date: toDateString(f.date),
        usedAt: f.usedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all check-ins for a challenge in chronological/descending order
 * Method: GET /api/challenges/:id/checkins
 */
const getChallengeCheckIns = async (req, res, next) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { challengeId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const formatted = checkIns.map((c) => ({
      id: c.id,
      challengeId: c.challengeId,
      userId: c.userId,
      userName: c.user.name,
      userEmail: c.user.email,
      date: toDateString(c.date),
      note: c.note,
      createdAt: c.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      checkIns: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get personal check-in history for the logged-in user
 * Method: GET /api/users/me/checkins
 */
const getUserCheckIns = async (req, res, next) => {
  try {
    const challengeIdQuery = req.query.challengeId;
    const whereClause = { userId: req.user.id };

    if (challengeIdQuery) {
      const challengeId = parseInt(challengeIdQuery, 10);
      if (!isNaN(challengeId)) {
        whereClause.challengeId = challengeId;
      }
    }

    const [checkIns, freezes] = await Promise.all([
      prisma.checkIn.findMany({
        where: whereClause,
        include: {
          challenge: {
            select: { id: true, title: true, duration: true },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.streakFreeze.findMany({
        where: whereClause,
        select: { challengeId: true, date: true },
      }),
    ]);

    const frozenDateKeySet = new Set(
      freezes.map((f) => `${f.challengeId}_${toDateString(f.date)}`)
    );

    const formatted = checkIns.map((c) => ({
      id: c.id,
      challengeId: c.challengeId,
      challengeTitle: c.challenge.title,
      challengeDuration: c.challenge.duration,
      date: toDateString(c.date),
      note: c.note,
      hasFreeze: frozenDateKeySet.has(`${c.challengeId}_${toDateString(c.date)}`),
      createdAt: c.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      checkIns: formatted,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitCheckIn,
  useStreakFreeze,
  getStreakFreezes,
  getChallengeCheckIns,
  getUserCheckIns,
};
