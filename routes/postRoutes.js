const express = require('express');
const router = express.Router();
const { createPost, getPosts } = require('../controllers/postController');
const { likePost, savePost, getSavedPosts } = require('../controllers/postExtrasController');
const { upload } = require('../config/cloudinary');

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('❌ Multer error:', err.message);
    return res.status(400).json({ 
      success: false,
      error: err.message || 'File upload error',
      details: err.toString()
    });
  }
  next();
};

// Routes - using Cloudinary upload with error handling
router.post('/posts', 
  (req, res, next) => {
    upload.single('media')(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  createPost
);
router.get('/posts', getPosts);
router.post('/posts/:id/like', likePost);
router.post('/posts/:id/save', savePost);
router.get('/posts/saved', getSavedPosts);

module.exports = router;