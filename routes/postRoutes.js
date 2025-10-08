const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createPost, getPosts } = require('../controllers/postController');
const { likePost, savePost, getSavedPosts } = require('../controllers/postExtrasController')

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Routes
router.post('/posts', upload.single('media'), createPost);
router.get('/posts', getPosts);
router.post('/posts/:id/like', likePost);
router.post('/posts/:id/save', savePost);
router.get('/posts/saved', getSavedPosts);

module.exports = router;