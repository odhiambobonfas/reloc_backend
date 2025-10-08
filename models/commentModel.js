const pool = global.db || require('../db/db');

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
    
    // First, check if the created_at column exists
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
    
    // Get all comments for the post
    const result = await pool.query(
      `SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC`,
      [post_id]
    );
    
    console.log(`✅ Database: Fetched ${result.rows.length} comments for post ${post_id}`);
    
    const comments = result.rows;
    
    // Build tree structure
    const commentMap = new Map();
    const rootComments = [];
    
    // First pass: create a map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, {
        ...comment,
        replies: []
      });
    });
    
    // Second pass: build the tree structure
    comments.forEach(comment => {
      if (comment.parent_id) {
        // This is a reply
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          parentComment.replies.push(commentMap.get(comment.id));
        }
      } else {
        // This is a root comment
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
