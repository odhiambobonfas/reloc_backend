// server.js

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

// ✅ Force PORT to 5000 for Railway
const PORT = process.env.PORT || 5000;

/* ✅ Ensure uploads directory exists */
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
} else {
  console.log('✅ Uploads directory already exists');
}

/* ✅ Security Headers */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

/* ✅ Rate Limiter (prevents abuse) */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // limit per IP
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

/* ✅ CORS Setup */
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

/* ✅ Enhanced PostgreSQL Connection with IPv4 fix */
console.log('🔧 Database Configuration:');
console.log('🔧 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('🔧 PGHOST:', process.env.PGHOST || 'Not set');
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

let poolConfig;

if (process.env.DATABASE_URL) {
  // Parse DATABASE_URL and force IPv4
  const dbUrl = new URL(process.env.DATABASE_URL);
  poolConfig = {
    user: dbUrl.username,
    password: dbUrl.password,
    host: dbUrl.hostname,
    port: dbUrl.port,
    database: dbUrl.pathname.slice(1), // Remove leading slash
    ssl: { rejectUnauthorized: false }
  };
  console.log('🔧 Using parsed DATABASE_URL for connection');
} else if (process.env.PGHOST) {
  // Fallback to individual Railway PostgreSQL variables
  poolConfig = {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: { rejectUnauthorized: false }
  };
  console.log('🔧 Using individual DB variables for connection');
} else {
  // Final fallback for development
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
  console.log('🔧 Using development DB variables for connection');
}

// Force IPv4 and add connection settings
Object.assign(poolConfig, {
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  maxUses: 7500,
  // Force IPv4 to avoid IPv6 issues
  family: 4
});

console.log('🔧 Final PostgreSQL config:', {
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  usingIPv4: true
});

const pool = new Pool(poolConfig);

// Enhanced connection event handling
pool.on('connect', () => {
  console.log('✅ New PostgreSQL client connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

// Test database connection on startup
const testDatabaseConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully!');
    
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Database time:', result.rows[0].current_time);
    console.log('✅ PostgreSQL version:', result.rows[0].version.split(',')[0]);
    
    client.release();
  } catch (err) {
    console.error('❌ Database connection test failed:', err.message);
    if (client) client.release();
    
    console.log('⚠️  Continuing without database connection...');
  }
};

// Test connection after a short delay
setTimeout(() => {
  testDatabaseConnection();
}, 2000);

global.db = pool;

/* ✅ Middleware Setup */
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ✅ Logger */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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

/* ✅ Enhanced Database Test Endpoint */
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    res.json({ 
      connected: true, 
      time: result.rows[0].current_time,
      version: result.rows[0].version.split(',')[0],
      environment: process.env.NODE_ENV 
    });
  } catch (err) {
    res.status(500).json({ 
      connected: false, 
      error: err.message,
      environment: process.env.NODE_ENV 
    });
  }
});

/* ✅ Health Check with DB status */
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'unknown',
    port: PORT
  };

  try {
    await pool.query('SELECT 1');
    healthCheck.database = 'connected';
  } catch (err) {
    healthCheck.database = 'disconnected';
    healthCheck.database_error = err.message;
  }

  const statusCode = healthCheck.database === 'connected' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

/* ✅ Default Home */
app.get('/', (req, res) => {
  res.json({
    message: '✅ Reloc Community & Payments API is running...',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    endpoints: {
      posts: '/api/posts',
      messages: '/api/messages',
      payments: '/api/mpesa',
      notifications: '/api/notifications',
      health: '/health',
      dbTest: '/db-test'
    },
  });
});

/* ✅ Error Handling */
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

/* ✅ 404 Fallback */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/* ✅ Graceful Shutdown */
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

/* ✅ Start Server - FORCE PORT 5000 */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Health Check → http://localhost:${PORT}/health`);
  console.log(`✅ Database Test → http://localhost:${PORT}/db-test`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});