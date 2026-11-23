// backend/src/controllers/authController.js
// User Authentication Controller

const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

/**
 * Register a new user
 * Method: POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash the password with bcrypt (10 salt rounds)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in PostgreSQL database (default 2 streak freezes)
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        streakFreezes: 2,
      },
      select: {
        id: true,
        name: true,
        email: true,
        streakFreezes: true,
        createdAt: true,
      },
    });

    // Automatically establish a session for the registered user
    req.session.userId = user.id;

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Primordial.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user
 * Method: POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Retrieve user by email from PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password hash using bcrypt.compare
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Store user ID in session
    req.session.userId = user.id;

    // Return safe user object (excluding password hash)
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      streakFreezes: user.streakFreezes,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out the current user
 * Method: POST /api/auth/logout
 */
const logout = (req, res, next) => {
  try {
    const clearOptions = {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    };

    // Destroy the server-side session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }

        // Clear the session cookie from the browser
        res.clearCookie('primordial.sid', clearOptions);

        return res.status(200).json({
          success: true,
          message: 'Logged out successfully.',
        });
      });
    } else {
      res.clearCookie('primordial.sid', clearOptions);
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get current logged in user details
 * Method: GET /api/auth/me
 */
const getMe = (req, res) => {
  // req.user was populated by requireAuth middleware
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
