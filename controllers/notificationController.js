const Notification = require("../models/notificationModel");

const addNotification = async (req, res) => {
  try {
    const { user_id, type, title, message, post_id } = req.body;
    if (!user_id || !type || !title || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const notification = await Notification.createNotification({
      user_id,
      type,
      title,
      message,
      post_id,
    });

    res.status(201).json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

const fetchNotifications = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "Missing user_id" });

    const notifications = await Notification.getNotificationsForUser(user_id);
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

const readNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.markAsRead(id);
    res.json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

module.exports = { addNotification, fetchNotifications, readNotification };