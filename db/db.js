const { Pool } = require("pg");
require("dotenv").config();

// console.log('🔧 Database Configuration:', {
//   user: process.env.DB_USER || "postgres",
//   host: process.env.DB_HOST || "192.168.20.207",
//   database: process.env.DB_NAME || "reloc",
//   port: process.env.DB_PORT || 5432,
//   // Don't log password for security
// });

// const mysql = require("mysql2");

// const db = mysql.createConnection({
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD || "",
//   host: process.env.DB_HOST || "192.168.20.207",
//   database: process.env.DB_NAME || "reloc",
// });

// db.connect((err) => {
//   if (err) {
//     console.error("Error connecting to the database:", err);
//     return;
//   }
//   console.log("Connected to the database.");
// });

// module.exports = db;

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "192.168.20.207",
  database: process.env.DB_NAME || "reloc",
  password: process.env.DB_PASSWORD || "Othina78",
  port: process.env.DB_PORT || 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});


// Enhanced connection handling
pool.on('connect', (client) => {
  console.log('✅ New client connected to PostgreSQL');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database query test successful:', result.rows[0]);
    
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    console.error('❌ Connection details:', {
      host: process.env.DB_HOST || "192.168.20.207",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "reloc",
      user: process.env.DB_USER || "postgres"
    });
    
    // Don't exit in development, just log the error
    if (process.env.NODE_ENV === 'production') {
      process.exit(-1);
    }
  }
};

// Test connection on startup
testConnection();

module.exports = pool;