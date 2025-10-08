/**
 * routes/uploadRoute.js
 * Handles image uploads — automatically uses Cloudinary if credentials are provided,
 * otherwise falls back to local uploads.
 */

const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { v2: cloudinary } = require('cloudinary');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const router = express.Router();

// Ensure uploads directory exists (for local fallback)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory for local storage');
}

// --- Determine whether Cloudinary credentials exist ---
const hasCloudinaryCredentials =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let upload; // this will be the Multer instance

if (hasCloudinaryCredentials) {
  // ✅ Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log('✅ Cloudinary detected: Using Cloudinary storage');

  // ✅ Configure Multer to use Cloudinary
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'reloc_dev', // change folder name if needed
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: (req, file) => Date.now() + '-' + file.originalname,
    },
  });

  upload = multer({ storage: storage });
} else {
  // ⚙️ Fallback to local storage
  console.log('⚙️ No Cloudinary credentials found: Using local uploads');

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });

  upload = multer({ storage: storage });
}

// ✅ Upload route (works for both local & Cloudinary)
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    let imageUrl = req.file.path;

    // If it's a local upload, build full URL path
    if (!imageUrl.startsWith('http')) {
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(req.file.path)}`;
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Image upload failed',
      message: error.message,
    });
  }
});

module.exports = router;
