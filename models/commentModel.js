const pool = global.db || require('../db/db');
const User = require('./userModel');

const createComment = async ({ post_id, parent_id, user_id, content }) => {
  try {
    console.log('🗄️ Database: Creating comment with data:', { post_id, parent_id, user_id, content });
    
    const result = await pool.query(
      `INSERT INTO comments (post_id, parent_id, user_id, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [post_id, parent_id || null, user_id, content]
    );
    
    console.log('✅ Database: Comment created successfully:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Database: Error creating comment:', error);
    console.error('❌ Database: Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    throw error;
  }
};

const getCommentsByPost = async (post_id) => {
  try {
    console.log('🗄️ Database: Fetching comments for post:', post_id);
    
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'created_at'
    `;
    
    const columnCheck = await pool.query(checkColumnQuery);
    
    if (columnCheck.rows.length === 0) {
      console.error('❌ Database: created_at column does not exist in comments table');
      throw new Error('Database schema is missing required columns. Please run the migration script.');
    }
    
    const result = await pool.query(
      `SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC`,
      [post_id]
    );
    
    console.log(`✅ Database: Fetched ${result.rows.length} comments for post ${post_id}`);
    
    const comments = result.rows;
    
    const commentMap = new Map();
    const rootComments = [];
    
    for (const comment of comments) {
      const user = await User.getUserById(comment.user_id);
      commentMap.set(comment.id, {
        ...comment,
        user: {
          name: user ? user.name : 'Unknown User',
          photoUrl: user ? user.photo_url : ''
        },
        replies: []
      });
    }
    
    comments.forEach(comment => {
      if (comment.parent_id) {
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          parentComment.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });
    
    return rootComments;
  } catch (error) {
    console.error('❌ Database: Error fetching comments:', error);
    console.error('❌ Database: Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    throw error;
  }
};

const deleteComment = async (id) => {
  try {
    console.log('🗄️ Database: Deleting comment:', id);
    
    await pool.query(`DELETE FROM comments WHERE id = $1`, [id]);
    
    console.log('✅ Database: Comment deleted successfully');
  } catch (error) {
    console.error('❌ Database: Error deleting comment:', error);
    throw error;
  }
};

module.exports = {
  createComment,
  getCommentsByPost,
  deleteComment,
};
