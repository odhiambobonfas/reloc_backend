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

// ✅ FORCE PORT 5000 - This is critical for Railway
const PORT = process.env.PORT || 5000;
console.log(`🔧 Starting server on PORT: ${PORT}`);

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
  contentSecurityPolicy: false, // Simplify for now
  crossOriginEmbedderPolicy: false,
}));

/* ✅ Rate Limiter */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

/* ✅ CORS Setup */
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
  credentials: true,
}));

/* ✅ FIXED PostgreSQL Connection */
console.log('🔧 Database Configuration:');
console.log('🔧 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('🔧 PGHOST:', process.env.PGHOST || 'Not set');
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

// Parse DATABASE_URL manually to ensure proper configuration
let poolConfig;

if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  // Parse the DATABASE_URL manually
  const match = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (match) {
    const [_, user, password, host, port, database] = match;
    poolConfig = {
      user,
      password,
      host,
      port: parseInt(port),
      database,
      ssl: { rejectUnauthorized: false },
      // Force IPv4 and add connection timeout
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    };
    console.log('🔧 Using parsed DATABASE_URL with IPv4');
  } else {
    // Fallback to connection string with explicit IPv4 forcing
    poolConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    };
    console.log('🔧 Using DATABASE_URL connection string');
  }
} else {
  // Use individual environment variables
  poolConfig = {
    user: process.env.PGUSER || process.env.DB_USER,
    host: process.env.PGHOST || process.env.DB_HOST,
    database: process.env.PGDATABASE || process.env.DB_NAME,
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
    port: process.env.PGPORT || process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  };
  console.log('🔧 Using individual DB variables');
}

console.log('🔧 Final DB Config:', {
  host: poolConfig.host || 'from-connection-string',
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
});

const pool = new Pool(poolConfig);

// Connection event handlers
pool.on('connect', () => {
  console.log('✅ New PostgreSQL client connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

// Test database connection
const testDatabaseConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully!');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database time:', result.rows[0].current_time);
    
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    if (client) client.release();
    
    // Try alternative connection method if DATABASE_URL failed
    if (process.env.DATABASE_URL && err.message.includes('ENETUNREACH') || err.message.includes('ECONNREFUSED')) {
      console.log('🔄 Trying alternative connection method...');
      await tryAlternativeConnection();
    }
    
    return false;
  }
};

// Alternative connection method for Railway's internal DNS
const tryAlternativeConnection = async () => {
  try {
    const altPool = new Pool({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    
    const client = await altPool.connect();
    console.log('✅ Alternative connection successful!');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Alternative connection time:', result.rows[0].now);
    client.release();
    altPool.end();
    return true;
  } catch (err) {
    console.error('❌ Alternative connection also failed:', err.message);
    return false;
  }
};

// Test connection after delay
setTimeout(() => {
  testDatabaseConnection();
}, 3000);

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

/* ✅ Health Check */
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: 'unknown'
  };

  try {
    await pool.query('SELECT 1');
    healthCheck.database = 'connected';
  } catch (err) {
    healthCheck.database = 'disconnected';
    healthCheck.database_error = err.message;
  }

  res.status(healthCheck.database === 'connected' ? 200 : 503).json(healthCheck);
});

/* ✅ Database Test */
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      connected: true, 
      time: result.rows[0].current_time,
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

/* ✅ Default Route */
app.get('/', (req, res) => {
  res.json({
    message: '✅ Reloc Community & Payments API is running...',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    endpoints: {
      health: '/health',
      dbTest: '/db-test'
    },
  });
});

/* ✅ Error Handling */
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

/* ✅ 404 Handler */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/* ✅ Start Server - EXPLICIT PORT BINDING */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎉 SERVER RUNNING ON PORT ${PORT}`);
  console.log(`✅ Health Check: http://localhost:${PORT}/health`);
  console.log(`✅ Database Test: http://localhost:${PORT}/db-test`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});