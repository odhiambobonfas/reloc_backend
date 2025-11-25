const express = require('express');
const router = express.Router();
const { createPost, getPosts } = require('../controllers/postController');
const { likePost, savePost, getSavedPosts } = require('../controllers/postExtrasController');
const { upload } = require('../config/cloudinary');

// Routes - using Cloudinary upload
router.post('/posts', upload.single('media'), createPost);
router.get('/posts', getPosts);
router.post('/posts/:id/like', likePost);
router.post('/posts/:id/save', savePost);
router.get('/posts/saved', getSavedPosts);

module.exports = router;