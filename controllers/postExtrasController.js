const Post = require('../models/Post.model');
const pool = require('../db/db');

const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!id || !userId) return res.status(400).json({ error: 'Missing post id or user id' });

    const updatedPost = await Post.toggleLike(id, userId);
    return res.json({ success: true, likes: updatedPost.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to like post' });
  }
};

const savePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!id || !userId) return res.status(400).json({ error: 'Missing post id or user id' });

    // Check if already saved
    const existing = await pool.query('SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2', [userId, id]);
    if (existing.rows.length > 0) {
      // Unsave
      await pool.query('DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2', [userId, id]);
      return res.json({ success: true, saved: false });
    } else {
      // Save
      await pool.query('INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2)', [userId, id]);
      return res.json({ success: true, saved: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save/unsave post' });
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing user id' });

    const result = await pool.query(`
      SELECT p.* FROM posts p
      JOIN saved_posts sp ON p.id = sp.post_id
      WHERE sp.user_id = $1
      ORDER BY sp.created_at DESC
    `, [userId]);
    const posts = result.rows.map(post => ({
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      type: post.type,
      media_url: post.media_url,
      likes: post.likes || 0,
      created_at: post.created_at,
    }));
    res.json({ success: true, data: posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch saved posts' });
  }
};

module.exports = { likePost, savePost, getSavedPosts };
