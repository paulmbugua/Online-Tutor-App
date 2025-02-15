// routes/profileActionsRoutes.js
import express from 'express';
import {
  addToFavorites,
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  deleteMessage,
  deleteConversation,
} from '../controllers/profileActionsController.js';
import authUser from '../middleware/authUser.js';

const router = express.Router();

// Route to add a profile to favorites
router.post('/favorites', authUser, addToFavorites);

// Route to send a message
router.post('/conversations/messages', authUser, sendMessage);

// Route to get conversations with pagination
router.get('/conversations', authUser, getConversations);

// Route to get messages within a specific conversation with pagination
router.get('/conversations/:recipientId/messages', authUser, getMessages);

router.post('/conversations/:recipientId/markAsRead', authUser, markAsRead);

// Delete a specific message within a conversation
router.delete("/conversation/:conversationId/message/:messageId", authUser, deleteMessage);

// Delete an entire conversation
router.delete("/conversation/:conversationId", authUser, deleteConversation);


export default router;
