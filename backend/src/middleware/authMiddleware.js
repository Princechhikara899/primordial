// backend/src/middleware/authMiddleware.js
// Verifies user session and populates req.user

const prisma = require('../config/prisma');

/**
 * Authentication Middleware
 * Checks if req.session contains a valid userId.
 * Rejects unauthenticated requests with 401 Unauthorized.
 */
const requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // Verify user still exists in PostgreSQL database
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        streakFreezes: true,
        createdAt: true,
      },
    });

    if (!user) {
      // Session exists but user was deleted from DB
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'User account not found. Please log in again.',
      });
    }

    // Attach user information to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAuth,
};
