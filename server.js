// server.js - SIMPLIFIED WORKING VERSION

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ✅ CRITICAL: Force PORT 5000
const PORT = 5000;
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
app.use(cors());

/* ✅ SIMPLE Database Connection */
console.log('🔧 Database URL available:', !!process.env.DATABASE_URL);

// Use the simplest possible connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Simple connection test
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database connected successfully!');
    release();
  }
});

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
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      database: 'connected',
      port: PORT,
      environment: process.env.NODE_ENV 
    });
  } catch (err) {
    res.json({ 
      status: 'OK', 
      database: 'disconnected',
      port: PORT,
      environment: process.env.NODE_ENV,
      error: err.message 
    });
  }
});

/* ✅ Database Test */
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      connected: true, 
      time: result.rows[0].now,
      port: PORT 
    });
  } catch (err) {
    res.json({ 
      connected: false, 
      error: err.message,
      port: PORT 
    });
  }
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