// config/cloudinary.js

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/* ✅ Configure Cloudinary using your credentials */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ✅ Setup Cloudinary storage for Multer */
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'reloc_uploads', // folder in your Cloudinary dashboard
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }], // optional optimization
    public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, // unique name
  }),
});

/* ✅ Create Multer upload middleware */
const upload = multer({ storage });

/* ✅ Export for use in routes */
export { cloudinary, upload };
