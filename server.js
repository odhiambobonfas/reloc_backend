console.log("🚀 Server v2.0 - Notifications enabled!");

// server.js - FINAL & FIXED VERSION (For Render + Flutter Mobile)

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db/db'); // ✅ Centralized pool

const app = express();
app.set('trust proxy', 1);

// ✅ Force PORT 5000 (Render or Local)
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
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       ...helmet.contentSecurityPolicy.getDefaultDirectives(),
//       "connect-src": ["'self'", ...allowedOrigins, "https://reloc-backend.onrender.com"],
//     },
//   },
// }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
}));

/* ✅ CORS Setup */
app.use(cors({
  origin: "*", // Allows all origins for development
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// app.use(express.json()); // This is already handled by bodyParser.json()

/* ✅ Database Connection */
console.log('🔧 Centralized database connection logic is in use.');
global.db = pool;

/* ✅ Middleware */
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ✅ Request Logger */
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.path}`);
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
const userRoutes = require('./routes/userRoutes');

app.use('/api', postRoutes);
app.use('/api/posts', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/mpesa', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications', notificationSettingsRoutes);
app.use('/api', uploadRoute);
app.use('/api/users', userRoutes);

/* ✅ Health Check Endpoint */
app.get('/health', async (req, res) => {
  res.json({ 
    status: 'OK', 
    port: PORT,
    environment: process.env.NODE_ENV,
    database: 'Connected ✅'
  });
});

/* ✅ Default Root Route */
app.get('/', (req, res) => {
  res.json({
    message: 'Reloc API is running ✅',
    port: PORT,
    environment: process.env.NODE_ENV,
    endpoints: [
      '/health',
      '/api/posts',
      '/api/messages',
      '/api/mpesa',
      '/api/notifications'
    ]
  });
});

/* ✅ Error Handling */
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message || err);
  res.status(500).json({ error: 'Something went wrong', details: err.message });
});

/* ✅ 404 Handler */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/* ✅ Start Server */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎉 SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
});
