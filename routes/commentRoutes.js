const express = require("express");
const router = express.Router();
const { addComment, getComments, removeComment } = require("../controllers/commentController");

// Nested under /api/posts
router.post("/:postId/comments", addComment);          // Add comment/reply
router.get("/:postId/comments", getComments);          // Get nested comments
router.delete("/comments/:id", removeComment);         // Delete comment

module.exports = router;