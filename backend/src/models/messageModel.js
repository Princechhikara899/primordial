// backend/src/models/messageModel.js
// MongoDB Message Schema for Primordial Challenge Group Chat
// Note: challengeId and senderId reference primary keys in PostgreSQL

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    challengeId: {
      type: Number,
      required: [true, 'Challenge ID is required'],
      index: true,
    },
    senderId: {
      type: Number,
      required: [true, 'Sender ID is required'],
    },
    senderName: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message text cannot be empty'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: 'messages', // Explicitly naming collection 'messages' as required
    versionKey: false,
  }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
