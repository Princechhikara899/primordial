// backend/src/middleware/errorMiddleware.js
// Centralized error handling and 404 route handling

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('🔥 Server Error:', err);

  // Prisma unique constraint violation (code P2002)
  if (err.code === 'P2002') {
    const target = err.meta && err.meta.target ? err.meta.target.join(', ') : 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${target} already exists.`,
    });
  }

  // Prisma foreign key constraint violation (code P2003)
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Referenced related record does not exist.',
    });
  }

  // Prisma record not found for update/delete (code P2025)
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found.',
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
