const Comment = require("../models/commentModel");

const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id, content, parent_id } = req.body;
    if (!postId || !user_id || !content)
      return res.status(400).json({ error: "Missing fields" });

    const comment = await Comment.createComment({ 
      post_id: postId, 
      user_id, 
      content, 
      parent_id: parent_id 
    });
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.getCommentsByPost(postId);
    res.json({ data: comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

const removeComment = async (req, res) => {
    try {
        const { id } = req.params;
        await Comment.deleteComment(id);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete comment" });
    }
};

module.exports = { addComment, getComments, removeComment };