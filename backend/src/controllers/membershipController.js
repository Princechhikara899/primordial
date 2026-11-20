// backend/src/controllers/membershipController.js
// Join and Leave Challenges Controller

const prisma = require('../config/prisma');
const { calculateStreaks } = require('../services/streakService');

/**
 * Join a public challenge
 * Method: POST /api/challenges/:id/join
 */
const joinChallenge = async (req, res, next) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    // If private, advise user to use the invite code endpoint
    if (challenge.visibility === 'PRIVATE') {
      return res.status(400).json({
        success: false,
        message: 'This challenge is private. Please join using an invite code.',
      });
    }

    // Check for duplicate membership
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_challengeId: {
          userId: req.user.id,
          challengeId,
        },
      },
    });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message: 'You are already a member of this challenge.',
      });
    }

    const membership = await prisma.membership.create({
      data: {
        userId: req.user.id,
        challengeId,
      },
      include: {
        challenge: {
          select: { id: true, title: true, duration: true, metricType: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `Successfully joined "${challenge.title}"!`,
      membership,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join a private challenge using an invite code
 * Method: POST /api/challenges/join-private
 */
const joinPrivateChallenge = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode || typeof inviteCode !== 'string' || !inviteCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid invite code is required.',
      });
    }

    const normalizedCode = inviteCode.trim().toUpperCase();

    // Look up challenge by unique invite code
    const challenge = await prisma.challenge.findUnique({
      where: { inviteCode: normalizedCode },
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code. No challenge found matching this code.',
      });
    }

    // Check for duplicate membership
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_challengeId: {
          userId: req.user.id,
          challengeId: challenge.id,
        },
      },
    });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message: `You are already a member of "${challenge.title}".`,
      });
    }

    const membership = await prisma.membership.create({
      data: {
        userId: req.user.id,
        challengeId: challenge.id,
      },
      include: {
        challenge: true,
      },
    });

    res.status(201).json({
      success: true,
      message: `Successfully joined private challenge: "${challenge.title}"!`,
      challenge,
      membership,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Leave a joined challenge
 * Method: POST /api/challenges/:id/leave
 */
const leaveChallenge = async (req, res, next) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }

    // Verify membership exists
    const membership = await prisma.membership.findUnique({
      where: {
        userId_challengeId: {
          userId: req.user.id,
          challengeId,
        },
      },
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'You are not a member of this challenge.',
      });
    }

    // Delete membership record
    await prisma.membership.delete({
      where: {
        userId_challengeId: {
          userId: req.user.id,
          challengeId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'You have left the challenge.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all members/participants of a challenge
 * Method: GET /api/challenges/:id/members
 */
const getChallengeMembers = async (req, res, next) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }

    const members = await prisma.membership.findMany({
      where: { challengeId },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    res.status(200).json({
      success: true,
      count: members.length,
      members: members.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all challenges joined by the logged-in user with streak progress & freeze protections
 * Method: GET /api/users/me/challenges
 */
const getUserJoinedChallenges = async (req, res, next) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user.id },
      include: {
        challenge: {
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { memberships: true, checkIns: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const joined = await Promise.all(
      memberships.map(async (m) => {
        const [checkIns, freezes] = await Promise.all([
          prisma.checkIn.findMany({
            where: {
              userId: req.user.id,
              challengeId: m.challengeId,
            },
            orderBy: { date: 'asc' },
          }),
          prisma.streakFreeze.findMany({
            where: {
              userId: req.user.id,
              challengeId: m.challengeId,
            },
            orderBy: { date: 'asc' },
          }),
        ]);

        const streakStats = calculateStreaks(checkIns, m.challenge.duration, freezes);

        return {
          membershipId: m.id,
          joinedAt: m.joinedAt,
          challenge: {
            id: m.challenge.id,
            title: m.challenge.title,
            description: m.challenge.description,
            duration: m.challenge.duration,
            visibility: m.challenge.visibility,
            metricType: m.challenge.metricType || 'STEPS',
            inviteCode: m.challenge.inviteCode,
            creator: m.challenge.creator,
            createdAt: m.challenge.createdAt,
            totalMembers: m.challenge._count.memberships,
          },
          userProgress: streakStats,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: joined.length,
      challenges: joined,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  joinChallenge,
  joinPrivateChallenge,
  leaveChallenge,
  getChallengeMembers,
  getUserJoinedChallenges,
};
