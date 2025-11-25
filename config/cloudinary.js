const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage engine for multer
const storage = new CloudinaryStorage({
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

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

module.exports = { cloudinary, upload };
