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
    console.log('🔔 Fetching notifications for user:', user_id);
    
    if (!user_id) {
      console.log('❌ Missing user_id in query');
      return res.status(400).json({ success: false, error: "Missing user_id" });
    }

    const notifications = await Notification.getNotificationsForUser(user_id);
<<<<<<< HEAD
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
=======
    console.log('✅ Fetched notifications:', notifications.length, 'notifications');
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('❌ Error fetching notifications:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ success: false, error: "Failed to fetch notifications", message: err.message });
>>>>>>> 98ff0d3 (your message)
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