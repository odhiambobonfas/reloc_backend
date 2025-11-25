const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Check if Cloudinary is configured
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

let storage;

if (isCloudinaryConfigured) {
  console.log('✅ Cloudinary configured - using cloud storage');
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  // Create Cloudinary storage engine for multer
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      // Determine folder based on file type
      const isVideo = file.mimetype.startsWith('video/');
      
      return {
        folder: isVideo ? 'reloc/videos' : 'reloc/images',
        resource_type: isVideo ? 'video' : 'image',
        allowed_formats: isVideo 
          ? ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm']
          : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: isVideo 
          ? [{ quality: 'auto', fetch_format: 'auto' }]
          : [{ quality: 'auto', fetch_format: 'auto', width: 1000, crop: 'limit' }]
      };
    }
  });
} else {
  console.log('⚠️  Cloudinary not configured - using local storage (files will be lost on Render restart)');
  
  // Fallback to local disk storage
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
}

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('📎 File upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Accept images and videos, or if mimetype is not set
    if (!file.mimetype || 
        file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') ||
        file.mimetype === 'application/octet-stream') {
      console.log('✅ File accepted');
      cb(null, true);
    } else {
      console.log('❌ File rejected - invalid type');
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

module.exports = { cloudinary, upload, isCloudinaryConfigured };
