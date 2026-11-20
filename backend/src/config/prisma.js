// backend/src/config/prisma.js
// PostgreSQL connection client using Prisma ORM

const { PrismaClient } = require('@prisma/client');

// Initialize a single PrismaClient instance for connection pooling
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
