// backend/src/middleware/validationMiddleware.js
// Request payload validators for incoming API requests

/**
 * Validates registration payload
 */
const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'A valid email address is required' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password is required and must be at least 6 characters long',
    });
  }

  next();
};

/**
 * Validates login payload
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  next();
};

/**
 * Validates challenge creation payload
 */
const validateChallenge = (req, res, next) => {
  const { title, description, duration, visibility } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Challenge title is required' });
  }

  if (!description || !description.trim()) {
    return res.status(400).json({ success: false, message: 'Challenge description is required' });
  }

  const parsedDuration = parseInt(duration, 10);
  if (isNaN(parsedDuration) || parsedDuration <= 0 || parsedDuration > 365) {
    return res.status(400).json({
      success: false,
      message: 'Duration must be a positive number between 1 and 365 days',
    });
  }

  if (visibility && !['PUBLIC', 'PRIVATE'].includes(visibility.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: "Visibility must be either 'PUBLIC' or 'PRIVATE'",
    });
  }

  next();
};

/**
 * Validates challenge update payload
 */
const validateChallengeUpdate = (req, res, next) => {
  const { title, description, duration, visibility } = req.body;

  if (title !== undefined && (!title || !title.trim())) {
    return res.status(400).json({ success: false, message: 'Title cannot be empty' });
  }

  if (description !== undefined && (!description || !description.trim())) {
    return res.status(400).json({ success: false, message: 'Description cannot be empty' });
  }

  if (duration !== undefined) {
    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0 || parsedDuration > 365) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be a positive number between 1 and 365 days',
      });
    }
  }

  if (visibility !== undefined && !['PUBLIC', 'PRIVATE'].includes(visibility.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: "Visibility must be either 'PUBLIC' or 'PRIVATE'",
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateChallenge,
  validateChallengeUpdate,
};
