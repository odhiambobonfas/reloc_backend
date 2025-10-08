const pool = global.db || require('../db/db');

const getNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.params; // Assuming userId is passed in the URL
    const result = await pool.query('SELECT * FROM notification_settings WHERE user_id = $1', [userId]);
    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows[0] });
    } else {
      // Return default settings if not found
      res.json({ success: true, data: { user_id: userId, push: true, email: true, sms: true } });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.params; // Assuming userId is passed in the URL
    const { push, email, sms } = req.body;

    const query = `
      INSERT INTO notification_settings (user_id, push, email, sms)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE
      SET push = EXCLUDED.push, email = EXCLUDED.email, sms = EXCLUDED.sms
      RETURNING *;
    `;
    const values = [userId, push, email, sms];
    const result = await pool.query(query, values);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
};

module.exports = { getNotificationSettings, updateNotificationSettings };
