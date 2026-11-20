// backend/src/routes/chatRoutes.js
// Message Management Routes (MongoDB)

const express = require('express');
const router = express.Router();

const { deleteMessage } = require('../controllers/chatController');
const { requireAuth } = require('../middleware/authMiddleware');

// DELETE /api/messages/:messageId - Delete user's own chat message
router.delete('/:messageId', requireAuth, deleteMessage);

module.exports = router;
