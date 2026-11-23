// backend/src/controllers/challengeController.js
// Challenge Management Controller

const crypto = require('crypto');
const prisma = require('../config/prisma');
const Message = require('../models/messageModel');

/**
 * Helper to generate a friendly 8-character unique alphanumeric invite code
 */
function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new challenge
 * Method: POST /api/challenges
 */
const createChallenge = async (req, res, next) => {
  try {
    const { title, description, duration, visibility } = req.body;
    const isPrivate = visibility && visibility.toUpperCase() === 'PRIVATE';
    const inviteCode = isPrivate ? generateInviteCode() : null;

    // Use a transaction: Create challenge AND automatically enroll creator as first member
    const result = await prisma.$transaction(async (tx) => {
      const challenge = await tx.challenge.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          duration: parseInt(duration, 10),
          visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
          metricType: 'DAILY_CHECKIN',
          inviteCode,
          creatorId: req.user.id,
        },
      });

      // Automatically add creator to memberships
      await tx.membership.create({
        data: {
          userId: req.user.id,
          challengeId: challenge.id,
        },
      });

      return challenge;
    });

    res.status(201).json({
      success: true,
      message: 'Challenge created successfully!',
      challenge: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all public challenges
 * Method: GET /api/challenges
 */
const getPublicChallenges = async (req, res, next) => {
  try {
    const currentUserId = req.session && req.session.userId ? req.session.userId : null;

    const [challenges, userMemberships] = await Promise.all([
      prisma.challenge.findMany({
        where: { visibility: 'PUBLIC' },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { memberships: true, checkIns: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      currentUserId
        ? prisma.membership.findMany({
            where: { userId: currentUserId },
            select: { challengeId: true },
          })
        : Promise.resolve([]),
    ]);

    const joinedChallengeIds = new Set(userMemberships.map((m) => m.challengeId));

    const formatted = challenges.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      duration: c.duration,
      visibility: c.visibility,
      creator: c.creator,
      createdAt: c.createdAt,
      totalMembers: c._count.memberships,
      totalCheckIns: c._count.checkIns,
      isJoined: joinedChallengeIds.has(c.id),
      isCreator: currentUserId === c.creatorId,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      challenges: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single challenge details by ID
 * Method: GET /api/challenges/:id
 */
const getChallengeById = async (req, res, next) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        memberships: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: { checkIns: true, memberships: true },
        },
      },
    });

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    const currentUserId = req.user ? req.user.id : null;
    const isMember = challenge.memberships.some((m) => m.userId === currentUserId);
    const isCreator = challenge.creatorId === currentUserId;

    // Private challenges can only be viewed by members or the creator
    if (challenge.visibility === 'PRIVATE' && !isMember && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'This challenge is private. You must join via invite code to view details.',
      });
    }

    res.status(200).json({
      success: true,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        duration: challenge.duration,
        visibility: challenge.visibility,
        inviteCode: isCreator || isMember ? challenge.inviteCode : null,
        createdAt: challenge.createdAt,
        creator: challenge.creator,
        totalMembers: challenge._count.memberships,
        totalCheckIns: challenge._count.checkIns,
        members: challenge.memberships.map((m) => ({
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
          joinedAt: m.joinedAt,
        })),
        isMember,
        isCreator,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a challenge created by the user
 * Method: PUT /api/challenges/:id
 */
const updateChallenge = async (req, res, next) => {
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

    // Authorization check: Only creator can update
    if (challenge.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not the creator of this challenge.',
      });
    }

    const { title, description, duration, visibility } = req.body;
    let inviteCode = challenge.inviteCode;

    // If changing to private and no invite code exists yet, generate one
    if (visibility === 'PRIVATE' && !inviteCode) {
      inviteCode = generateInviteCode();
    }

    const updated = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        title: title ? title.trim() : challenge.title,
        description: description ? description.trim() : challenge.description,
        duration: duration ? parseInt(duration, 10) : challenge.duration,
        visibility: visibility ? visibility.toUpperCase() : challenge.visibility,
        inviteCode,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Challenge updated successfully.',
      challenge: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a challenge created by the user
 * Method: DELETE /api/challenges/:id
 */
const deleteChallenge = async (req, res, next) => {
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

    // Authorization check: Only creator can delete
    if (challenge.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not the creator of this challenge.',
      });
    }

    // Cascade delete challenge in PostgreSQL
    await prisma.challenge.delete({
      where: { id: challengeId },
    });

    // Clean up associated group chat messages in MongoDB (safely handles any connection delay)
    try {
      await Message.deleteMany({ challengeId });
    } catch (mongoErr) {
      console.warn(`⚠️ Note: Could not clean MongoDB messages for deleted challenge ${challengeId}:`, mongoErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Challenge and all related records deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all challenges created by the logged-in user
 * Method: GET /api/challenges/user/created
 */
const getUserCreatedChallenges = async (req, res, next) => {
  try {
    const challenges = await prisma.challenge.findMany({
      where: { creatorId: req.user.id },
      include: {
        _count: {
          select: { memberships: true, checkIns: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: challenges.length,
      challenges: challenges.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        duration: c.duration,
        visibility: c.visibility,
        inviteCode: c.inviteCode,
        createdAt: c.createdAt,
        totalMembers: c._count.memberships,
        totalCheckIns: c._count.checkIns,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChallenge,
  getPublicChallenges,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
  getUserCreatedChallenges,
};
