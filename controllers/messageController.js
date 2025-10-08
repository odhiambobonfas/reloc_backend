const Message = require("../models/messageModel");

const sendMessage = async (req, res) => {
  try {
    const { senderId: sender_id, receiverId: receiver_id, post_id, content } = req.body;
    if (!sender_id || !receiver_id || !content)
      return res.status(400).json({ error: "Missing fields" });

    const message = await Message.createMessage({ sender_id, receiver_id, post_id, content });
    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

const fetchMessages = async (req, res) => {
  try {
    const { userId: uid1, receiverId: uid2, post_id } = req.query;
    if (!uid1 || !uid2) return res.status(400).json({ error: "Missing uids" });

    const messages = await Message.getMessagesBetweenUsers(uid1, uid2, post_id);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

module.exports = { sendMessage, fetchMessages };
// New endpoints for mobile app contract

const fetchConversations = async (req, res) => {
  try {
    // Simple conversation aggregation: last message per peer
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "Missing uid" });
    const conversations = await Message.getConversations(uid);
    return res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

const sendMessageByChatId = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text', receiverId, senderId } = req.body;
    if (!chatId || !content) return res.status(400).json({ error: 'Missing fields' });
    const { uid1, uid2 } = parseChatId(chatId);
    const message = await Message.createMessage({
      sender_id: senderId || uid1,
      receiver_id: receiverId || uid2,
      post_id: null,
      content,
      type,
    });
    return res.status(201).json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

const fetchMessagesByChatId = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ error: 'Missing chatId' });
    const { uid1, uid2 } = parseChatId(chatId);
    const messages = await Message.getMessagesBetweenUsers(uid1, uid2, null);
    return res.json(messages.map(m => ({
      content: m.content,
      type: m.type || 'text',
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      timestamp: m.created_at,
      isSeen: m.is_seen || false,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

function parseChatId(chatId) {
  const parts = chatId.split('_');
  if (parts.length !== 2) return { uid1: null, uid2: null };
  return { uid1: parts[0], uid2: parts[1] };
}

module.exports = { sendMessage, fetchMessages, fetchConversations, sendMessageByChatId, fetchMessagesByChatId };
