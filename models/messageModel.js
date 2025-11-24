const pool = global.db || require('../db/db');

const User = require('./userModel');

class Message {
  static async createMessage({ sender_id, receiver_id, post_id, content, type = 'text' }) {
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, post_id, content, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [sender_id, receiver_id, post_id, content, type]
    );
    return result.rows[0];
  }

  static async getMessages(userId1, userId2, postId) {
    try {
      console.log('🗄️ Database: Fetching messages between users:', userId1, userId2);
      
      let query = 'SELECT * FROM messages WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))';
      const values = [userId1, userId2];

      if (postId) {
        query += ' AND post_id = $3';
        values.push(postId);
      }

      query += ' ORDER BY created_at ASC';

      const result = await pool.query(query, values);
      console.log('✅ Database: Fetched messages:', result.rows);
      return result.rows;
    } catch (error) {
      console.error('❌ Database: Error fetching messages:', error);
      throw error;
    }
  }

  static async getConversations(uid) {
    try {
      console.log('🗄️ Database: Fetching conversations for user:', uid);
      const result = await pool.query(
        'SELECT DISTINCT ON (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)) * FROM messages WHERE sender_id = $1 OR receiver_id = $1 ORDER BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC',
        [uid]
      );
      console.log('✅ Database: Fetched raw conversations:', result.rows);

      const conversations = await Promise.all(
        result.rows.map(async (r) => {
          const otherId = r.sender_id === uid ? r.receiver_id : r.sender_id;
          const otherUser = await User.getUserById(otherId);

          let postContent = null;
          if (r.post_id) {
            const post = await Post.findById(r.post_id);
            if (post) {
              postContent = post.content;
            }
          }

          return {
            id: `${[uid, otherId].sort().join('_')}`,
            otherUser: {
              id: otherId,
              name: otherUser ? otherUser.name : `User ${otherId}`,
              photoUrl: otherUser ? otherUser.photo_url : '',
            },
            lastMessage: {
              content: r.content,
              senderId: r.sender_id,
              timestamp: r.created_at,
              postContent: postContent,
            },
            updatedAt: r.created_at,
          };
        })
      );

      console.log('✅ Database: Processed conversations:', conversations);
      return conversations;
    } catch (error) {
      console.error('❌ Database: Error fetching conversations:', error);
      throw error;
    }
  }

  static async getMessagesBetweenUsers(userId1, userId2, postId) {
    try {
      console.log('🗄️ Database: Fetching messages between users:', userId1, userId2);
      
      let query = 'SELECT * FROM messages WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))';
      const values = [userId1, userId2];

      if (postId) {
        query += ' AND post_id = $3';
        values.push(postId);
      }

      query += ' ORDER BY created_at ASC';

      const result = await pool.query(query, values);
      console.log('✅ Database: Fetched messages:', result.rows);
      return result.rows;
    } catch (error) {
      console.error('❌ Database: Error fetching messages:', error);
      throw error;
    }
  }
}

module.exports = Message;