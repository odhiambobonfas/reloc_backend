// models/Post.js
const pool = require('../db/db');

class Post {
  static async create(data) {
    try {
      console.log('🗄️ Database: Creating post with data:', data);
      
      const { rows } = await pool.query(
        'INSERT INTO posts (user_id, content, type, media_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [data.uid, data.content, data.type, data.media_url]
      );
      
      console.log('✅ Database: Post created successfully:', rows[0]);
      return rows[0];
    } catch (error) {
      console.error('❌ Database: Error creating post:', error);
      console.error('❌ Database: Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      throw error;
    }
  }

  static async findAll(limit = 20, offset = 0, type) {
    try {
      console.log('🗄️ Database: Fetching posts with params:', { limit, offset, type });
      
      let baseQ = `
        SELECT 
          p.*,
          COALESCE(u.name, u.displayName, u.email, 'Anonymous') as author,
          u.photo_url as author_photo
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.firebase_uid
      `;
      const params = [];
      let placeholderCount = 1;

      if (type) {
        params.push(type);
        baseQ += ` WHERE p.type = $${placeholderCount++}`;
      }

      baseQ += ' ORDER BY p.created_at DESC';

      if (limit !== undefined) {
        params.push(limit);
        baseQ += ` LIMIT $${placeholderCount++}`;
      }

      if (offset !== undefined) {
        params.push(offset);
        baseQ += ` OFFSET $${placeholderCount++}`;
      }

      console.log('🗄️ Database: Executing query:', baseQ, 'with params:', params);

      const result = await pool.query(baseQ, params);
      console.log(`✅ Database: Fetched ${result.rows.length} posts`);
      return result.rows;
    } catch (error) {
      console.error('❌ Database: Error fetching posts:', error);
      console.error('❌ Database: Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      throw error;
    }
  }

  static async toggleLike(postId, userId) {
    try {
      console.log('🗄️ Database: Toggling like for post:', postId, 'by user:', userId);

      // Check if like exists
      const checkQuery = 'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2';
      const checkResult = await pool.query(checkQuery, [postId, userId]);

      let isLiked = checkResult.rows.length > 0;

      if (isLiked) {
        // Unlike: delete the like
        const deleteQuery = 'DELETE FROM likes WHERE post_id = $1 AND user_id = $2';
        await pool.query(deleteQuery, [postId, userId]);
        console.log('✅ Database: Unliked post');
      } else {
        // Like: insert the like
        const insertQuery = 'INSERT INTO likes (post_id, user_id) VALUES ($1, $2)';
        await pool.query(insertQuery, [postId, userId]);
        console.log('✅ Database: Liked post');
      }

      // Get new likes count
      const countQuery = 'SELECT COUNT(*) as likes FROM likes WHERE post_id = $1';
      const countResult = await pool.query(countQuery, [postId]);
      const newLikes = parseInt(countResult.rows[0].likes);

      // Update posts table
      const updateQuery = 'UPDATE posts SET likes = $1 WHERE id = $2 RETURNING *';
      const updateResult = await pool.query(updateQuery, [newLikes, postId]);

      console.log('✅ Database: Like toggled successfully, new likes:', newLikes);
      return updateResult.rows[0];
    } catch (error) {
      console.error('❌ Database: Error toggling like:', error);
      throw error;
    }
  }
}

module.exports = Post;
