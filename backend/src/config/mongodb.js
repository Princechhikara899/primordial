// backend/src/config/mongodb.js
// Secondary Database Configuration: MongoDB for Group Chat

const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/primordial_chat';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB (Group Chat Database)');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Do not crash entire server if MongoDB is temporarily down; log clear error
  }
};

module.exports = connectMongoDB;
