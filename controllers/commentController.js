const Comment = require("../models/commentModel");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const Post = require("../models/Post.model");

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

    // Notify post author about the comment
    try {
      const post = await Post.findById(postId);
      if (post && post.uid !== user_id) {
        const commenter = await User.getUserById(user_id);
        const commenterName = commenter ? commenter.name : 'Someone';
        
        await Notification.createNotification({
          user_id: post.uid,
          type: 'comment',
          title: 'New Comment',
          message: `${commenterName} commented on your post`,
          post_id: postId,
          comment_id: comment.id,
          sender_id: user_id
        });
        console.log('\ud83d\udd14 Comment notification sent to post author');
      }
    } catch (notifError) {
      console.error('\u26a0\ufe0f Failed to send comment notification:', notifError);
    }

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