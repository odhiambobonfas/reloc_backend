const pool = require("../db/db"); // Use centralized pool

const createNotification = async ({ user_id, type, title, message, post_id }) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, post_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [user_id, type, title, message, post_id]
  );
  return result.rows[0];
};

const getNotificationsForUser = async (user_id) => {
  try {
    console.log('📊 Database query for notifications, user_id:', user_id);
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id=$1
       ORDER BY created_at DESC`,
      [user_id]
    );
    console.log('✅ Database returned:', result.rows.length, 'rows');
    return result.rows;
  } catch (error) {
    console.error('❌ Database error in getNotificationsForUser:', error.message);
    throw error;
  }
};

const markAsRead = async (notification_id) => {
  const result = await pool.query(
    `UPDATE notifications SET read = TRUE WHERE id=$1 RETURNING *`,
    [notification_id]
  );
  return result.rows[0];
};

module.exports = { createNotification, getNotificationsForUser, markAsRead };