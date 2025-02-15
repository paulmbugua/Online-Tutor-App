// Import Mongoose and necessary models
import mongoose from 'mongoose';
import { Profile, Conversation} from '../models/Profile.js';

// Add to Favorites
export const addToFavorites = async (req, res) => {
  try {
    const { profileId } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      return res.status(400).json({ message: 'Invalid profile ID format' });
    }

    const profile = await Profile.findById(profileId);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    if (!profile.favorites.includes(userId)) {
      profile.favorites.push(userId);
      await profile.save();
    }

    res.status(200).json({ message: 'Profile added to favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add to favorites', error });
  }
};

// Send Message with real-time Socket.io emission
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    if (!senderId || !recipientId || !content) {
      return res.status(400).json({ message: 'Sender ID, recipient ID, and content are required' });
    }

    let conversation = await Conversation.findOne({
      $or: [
        { senderId: senderId, recipientId: recipientId },
        { senderId: recipientId, recipientId: senderId }
      ]
    });

    // If no conversation exists, create a new one
    if (!conversation) {
      conversation = new Conversation({
        senderId,
        recipientId,
        messages: [],
      });
    }

    // Add the new message to the conversation
    const message = {
      sender: senderId,
      content,
      timestamp: new Date(),
    };
    conversation.messages.push(message);

    // Save the updated conversation
    await conversation.save();

    // Emit the message to the recipient's room
    req.io.to(recipientId).emit('messageReceived', {
      userId: senderId,
      content,
      senderId,
      senderName: req.user.name, // Include sender's name if available
    });

    // Respond with the new message
    res.status(201).json({ message: 'Message sent successfully', data: message });
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({ message: 'Failed to send message', error });
  }
};

// Get Conversations with Pagination
export const getConversations = async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = parseInt(req.query.offset, 10) || 0;

  try {
    // Fetch conversations with sender and recipient populated
    const conversations = await Conversation.find({
      $or: [{ senderId: userId }, { recipientId: userId }]
    })
      .populate('senderId', 'name')
      .populate('recipientId', 'name')
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit);

    console.log("Fetched conversations from DB:", conversations);

    // Extract unique user IDs to fetch their profiles
    const userIds = new Set(
      conversations.flatMap((conversation) => [
        conversation.senderId._id.toString(),
        conversation.recipientId._id.toString(),
      ])
    );

    console.log("User IDs for profile fetching:", [...userIds]);

    // Fetch profiles for participants using user IDs
    const profiles = await Profile.find({ user: { $in: [...userIds] } });

    console.log("Fetched profiles for participants:", profiles);

    // Map profiles by user ID for quick lookup
    const profileMap = profiles.reduce((acc, profile) => {
      acc[profile.user.toString()] = profile.gallery?.[0] || 'default-avatar.png'; // Use gallery[0] or default avatar
      return acc;
    }, {});

    console.log("Profile Map:", profileMap);

    // Construct conversation summaries
    const conversationSummaries = conversations.map((conversation) => {
      const otherParticipant =
        String(conversation.senderId._id) === String(userId)
          ? conversation.recipientId
          : conversation.senderId;

      const avatar = profileMap[otherParticipant._id.toString()] || 'default-avatar.png';

      console.log(`Other participant's avatar for ${otherParticipant._id}:`, avatar);

      return {
        recipientId: otherParticipant._id,
        user: otherParticipant.name || 'Unknown',
        avatar,
        lastMessage: conversation.messages[conversation.messages.length - 1] || null,
        unreadCount: conversation.messages.filter(
          (msg) => msg.unread && String(msg.sender) !== String(userId)
        ).length,
      };
    });

    console.log("Final conversation summaries:", conversationSummaries);

    res.status(200).json({
      conversations: conversationSummaries,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to load conversations." });
  }
};


// Get messages within a specific conversation
export const getMessages = async (req, res) => {
  const { recipientId } = req.params;
  const userId = req.user.id;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = parseInt(req.query.offset, 10) || 0;

  try {
    const conversation = await Conversation.findOne({
      $or: [
        { senderId: userId, recipientId },
        { senderId: recipientId, recipientId: userId }
      ]
    }).populate('messages.sender', 'name avatar');

    if (!conversation) {
      console.log("No conversation found between the users.");
      return res.status(404).json({ message: "Conversation not found." });
    }

    console.log("Fetched messages for conversation:", conversation.messages);

    const totalMessages = conversation.messages.length;
    const paginatedMessages = conversation.messages
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(offset, offset + limit);

    res.status(200).json({
      messages: paginatedMessages,
      total: totalMessages
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to retrieve messages." });
  }
};


// Mark messages as read in a conversation
export const markAsRead = async (req, res) => {
  const { recipientId } = req.params;
  const userId = req.user.id;

  try {
    const conversation = await Conversation.findOne({
      $or: [
        { senderId: userId, recipientId },
        { senderId: recipientId, recipientId: userId }
      ]
    });

    if (!conversation) {
      console.log("No conversation found to mark as read.");
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    console.log("Marking messages as read for conversation:", conversation);

    let unreadCount = 0;
    conversation.messages.forEach(message => {
      if (message.unread && String(message.sender) !== String(userId)) {
        message.unread = false;
        unreadCount++;
      }
    });

    // Reset unreadCount for this conversation to reflect updates
    conversation.unreadCount = conversation.messages.filter(
      (msg) => msg.unread && String(msg.sender) !== String(userId)
    ).length;

    await conversation.save();
    console.log(`Marked ${unreadCount} messages as read for conversation with ${recipientId}`);
    res.status(200).json({ message: 'Messages marked as read.' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read.' });
  }
};


// Delete a specific message within a conversation
export const deleteMessage = async (req, res) => {
  const { conversationId, messageId } = req.params;
  const userId = req.user.id;

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const messageIndex = conversation.messages.findIndex(
      (msg) => String(msg._id) === messageId
    );

    if (messageIndex === -1) {
      return res.status(404).json({ message: "Message not found." });
    }

    const message = conversation.messages[messageIndex];

    // Check if the user is the sender of the message
    if (String(message.sender) !== String(userId)) {
      return res.status(403).json({ message: "You can only delete your own messages." });
    }

    // Remove the message
    conversation.messages.splice(messageIndex, 1);
    await conversation.save();

    res.status(200).json({ message: "Message deleted successfully." });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Failed to delete message." });
  }
};

// Delete an entire conversation
export const deleteConversation = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    // Check if the user is a participant in the conversation
    if (
      String(conversation.senderId) !== String(userId) &&
      String(conversation.recipientId) !== String(userId)
    ) {
      return res.status(403).json({ message: "You can only delete conversations you are part of." });
    }

    // Delete the conversation
    await conversation.deleteOne();

    res.status(200).json({ message: "Conversation deleted successfully." });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ message: "Failed to delete conversation." });
  }
};

