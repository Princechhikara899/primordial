// backend/src/server.js
// Server Entry Point: Initializes DB connections and starts HTTP listener with robust port handling

require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const prisma = require('./config/prisma');
const connectMongoDB = require('./config/mongodb');

const PORT = parseInt(process.env.PORT, 10) || 5001;

async function startServer() {
  try {
    // 1. Verify PostgreSQL connection via Prisma
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL Database via Prisma');

    // 2. Connect to MongoDB for group chat
    await connectMongoDB();

    // 3. Create HTTP server instance
    const server = http.createServer(app);

    // 4. Attach error handler before calling listen to prevent unhandled EADDRINUSE crash
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
        if (PORT === 5000) {
          console.error(`💡 Note: On macOS, the system AirPlay Receiver binds to port 5000 by default.`);
          console.error(`💡 Recommendation: Change PORT=5001 in backend/.env, or disable AirPlay Receiver in macOS Settings.`);
        } else {
          console.error(`💡 Tip: Check if another instance of Primordial is already running.`);
          console.error(`💡 You can configure a different port by setting PORT=<port_number> in backend/.env.`);
        }
        process.exit(1);
      } else {
        console.error('❌ Server startup error:', error);
        process.exit(1);
      }
    });

    // 5. Start listening on configured port
    server.listen(PORT, () => {
      console.log(`🚀 Primordial Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('🔌 PostgreSQL Prisma disconnected.');
        try {
          if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('🔌 MongoDB connection closed.');
          }
        } catch {
          // ignore disconnect error on exit
        }
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start Primordial server:', error);
    process.exit(1);
  }
}

startServer();
