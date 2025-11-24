const Message = require("../models/messageModel");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");

// A helper function to get the current user's ID from the request.
// This is a placeholder and should be replaced with a proper authentication middleware.
const getCurrentUserId = (req) => {
  // For now, we'll get the user ID from the query parameters.
  // In a real application, this would come from a decoded JWT token.
  return req.query.uid;
};

const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, post_id, content } = req.body;
    if (!senderId || !receiverId || !content)
      return res.status(400).json({ error: "Missing fields" });

    const message = await Message.createMessage({ sender_id: senderId, receiver_id: receiverId, post_id, content });
    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

const fetchMessages = async (req, res) => {
  try {
    const { userId, receiverId, post_id } = req.query;
    if (!userId || !receiverId) return res.status(400).json({ error: "Missing uids" });

    const messages = await Message.getMessages(userId, receiverId, post_id);
    res.json({ success: true, data: messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

const fetchConversations = async (req, res) => {
  try {
    const uid = getCurrentUserId(req);
    if (!uid) return res.status(400).json({ error: "Missing uid" });
    const conversations = await Message.getConversations(uid);
    return res.json({ success: true, data: conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
};

const sendMessageByChatId = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text', receiverId } = req.body;
    if (!chatId || !content) return res.status(400).json({ error: 'Missing fields' });

    const { uid1, uid2 } = parseChatId(chatId);
    if (!uid1 || !uid2) return res.status(400).json({ error: 'Invalid chatId' });

    // Get current user from query or determine from chatId
    const currentUid = getCurrentUserId(req) || uid1;
    const otherUid = receiverId || (currentUid === uid1 ? uid2 : uid1);

    const message = await Message.createMessage({
      sender_id: currentUid,
      receiver_id: otherUid,
      post_id: null,
      content,
      type,
    });

    // Send notification to receiver about new message
    try {
      const sender = await User.getUserById(currentUid);
      const senderName = sender ? sender.name : 'Someone';
      
      await Notification.createNotification({
        user_id: otherUid,
        type: 'message',
        title: 'New Message',
        message: `${senderName} sent you a message`,
        sender_id: currentUid
      });
      console.log('\ud83d\udd14 Message notification sent to receiver');
    } catch (notifError) {
      console.error('\u26a0\ufe0f Failed to send message notification:', notifError);
    }

    return res.status(201).json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

const fetchMessagesByChatId = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ error: 'Missing chatId' });

    const { uid1, uid2 } = parseChatId(chatId);
    if (!uid1 || !uid2) return res.status(400).json({ error: 'Invalid chatId' });

    const messages = await Message.getMessagesBetweenUsers(uid1, uid2, null);
    return res.json({ success: true, data: messages.map(m => ({
      content: m.content,
      type: m.type || 'text',
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      timestamp: m.created_at,
      isSeen: m.is_seen || false,
    }))});
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

function parseChatId(chatId) {
  if (typeof chatId !== 'string') return { uid1: null, uid2: null };
  const parts = chatId.split('_');
  if (parts.length !== 2) return { uid1: null, uid2: null };
  return { uid1: parts[0], uid2: parts[1] };
}

module.exports = { sendMessage, fetchMessages, fetchConversations, sendMessageByChatId, fetchMessagesByChatId };
