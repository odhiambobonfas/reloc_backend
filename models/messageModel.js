const pool = global.db || require('../db/db');

class Message {
  static async createMessage({ sender_id, receiver_id, post_id, content, type = 'text' }) {
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, post_id, content, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [sender_id, receiver_id, post_id, content, type]
    );
    return result.rows[0];
  }

  static async getMessagesBetweenUsers(uid1, uid2, post_id) {
    let query = 'SELECT * FROM messages WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))';
    const params = [uid1, uid2];
    if (post_id) {
      query += ' AND post_id = $3';
      params.push(post_id);
    }
    query += ' ORDER BY created_at ASC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getConversations(uid) {
    const result = await pool.query(
      `WITH ranked AS (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
                             ORDER BY created_at DESC) AS rn
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
      )
      SELECT * FROM ranked WHERE rn = 1 ORDER BY created_at DESC`,
      [uid]
    );
    // Map to frontend contract
    return result.rows.map(r => {
      const other = r.sender_id === uid ? r.receiver_id : r.sender_id;
      return {
        id: `${[uid, other].sort().join('_')}`,
        otherUser: { id: other, name: `User ${other}`, photoUrl: '' },
        lastMessage: { content: r.content, senderId: r.sender_id, timestamp: r.created_at },
        updatedAt: r.created_at,
      };
    });
  }
}

module.exports = Message;