// backend/src/controllers/chatController.js
// Group Chat Controller (MongoDB)

const mongoose = require('mongoose');
const Message = require('../models/messageModel');
const prisma = require('../config/prisma');

/**
 * Send a message in a challenge group chat
 * Method: POST /api/challenges/:id/messages
 */
const sendMessage = async (req, res, next) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }

    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty.',
      });
    }

    // 1. Authorization: Verify user is a member of this challenge in PostgreSQL
    const membership = await prisma.membership.findUnique({
      where: {
        userId_challengeId: {
          userId: req.user.id,
          challengeId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You must be a member of this challenge to send chat messages.',
      });
    }

    // 2. Insert message document into MongoDB 'messages' collection
    const newMessage = await Message.create({
      challengeId,
      senderId: req.user.id,
      senderName: req.user.name,
      message: message.trim(),
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      chatMessage: newMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve messages for a particular challenge group chat
 * Method: GET /api/challenges/:id/messages
 */
const getMessages = async (req, res, next) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }

    // 1. Authorization: Verify user is a member of this challenge in PostgreSQL
    const membership = await prisma.membership.findUnique({
      where: {
        userId_challengeId: {
          userId: req.user.id,
          challengeId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You must be a member of this challenge to access the chat.',
      });
    }

    // 2. Query MongoDB 'messages' collection, sorted chronologically (oldest to newest)
    const messages = await Message.find({ challengeId })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: messages.length,
      messages: messages.map((m) => ({
        id: m._id,
        challengeId: m.challengeId,
        senderId: m.senderId,
        senderName: m.senderName,
        message: m.message,
        createdAt: m.createdAt,
        isOwnMessage: m.senderId === req.user.id,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user's own message
 * Method: DELETE /api/messages/:messageId
 */
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format.',
      });
    }

    // 1. Find message in MongoDB
    const messageDoc = await Message.findById(messageId);

    if (!messageDoc) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      });
    }

    // 2. Verify ownership: user can only delete their own messages
    if (messageDoc.senderId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete your own messages.',
      });
    }

    // 3. Delete from MongoDB
    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getMessages,
  deleteMessage,
};
