const express = require("express");
const router = express.Router();
const { addNotification, fetchNotifications, readNotification } = require("../controllers/notificationController");

// Add a new notification
router.post("/", addNotification);

// Get all notifications for a user
router.get("/", fetchNotifications);

// Mark a notification as read
router.put("/:id/read", readNotification);

module.exports = router;