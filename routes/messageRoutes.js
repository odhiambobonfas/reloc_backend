const express = require("express");
const router = express.Router();
const {
  sendMessage,
  fetchMessages,
  sendMessageByChatId,
  fetchMessagesByChatId,
  fetchConversations,
} = require("../controllers/messageController");

// Legacy endpoints (by query)
router.post("/", sendMessage);
router.get("/", fetchMessages);

// New endpoints expected by mobile app
router.get("/conversations", fetchConversations);
router.post("/:chatId/send", sendMessageByChatId);
router.get("/:chatId", fetchMessagesByChatId);

module.exports = router;
