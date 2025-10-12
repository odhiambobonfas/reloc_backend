// server.js - SIMPLIFIED WORKING VERSION

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db/db'); // ✅ Import the centralized pool

const app = express();
app.set('trust proxy', 1);

// ✅ CRITICAL: Force PORT 5000
const PORT = process.env.PORT || 5000;
console.log(`🚀 Starting server on PORT: ${PORT}`);

/* ✅ Ensure uploads directory exists */
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
} else {
  console.log('✅ Uploads directory already exists');
}

/* ✅ Security Headers */
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
}));

/* ✅ CORS */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');

app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

/* ✅ Database Connection */
// The connection is now handled in db/db.js
console.log('🔧 Centralized database connection logic is in use.');

global.db = pool;

/* ✅ Middleware */
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ✅ Logger */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/* ✅ Routes */
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const notificationSettingsRoutes = require('./routes/notificationSettingsRoutes');
const uploadRoute = require('./routes/uploadRoute');

app.use('/api', postRoutes);
app.use('/api/posts', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/mpesa', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications', notificationSettingsRoutes);
app.use('/api', uploadRoute);

/* ✅ Health Check */
app.get('/health', async (req, res) => {
  // The database connection is now managed and tested in db/db.js
  // This endpoint just confirms the server is running.
  res.json({ 
    status: 'OK', 
    port: PORT,
    environment: process.env.NODE_ENV 
  });
});

/* ✅ Default Route */
app.get('/', (req, res) => {
  res.json({
    message: 'Reloc API is running',
    port: PORT,
    environment: process.env.NODE_ENV,
    endpoints: ['/health', '/db-test', '/api/posts', '/api/messages']
  });
});

/* ✅ Error Handling */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong' });
});

/* ✅ 404 Handler */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/* ✅ Start Server - SIMPLE */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎉 SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
});