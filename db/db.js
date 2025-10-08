const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

// Use Railway's environment variables
const pool = new Pool({
  // Use DATABASE_URL if available (Railway provides this)
  connectionString: process.env.DATABASE_URL,
  
  // Fallback to individual variables
  user: process.env.PGUSER || process.env.DB_USER || "postgres",
  host: process.env.PGHOST || process.env.DB_HOST || "ballast.proxy.rlwy.net",
  database: process.env.PGDATABASE || process.env.DB_NAME || "railway",
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
  port: process.env.PGPORT || process.env.DB_PORT || 30559,
  
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout for Railway
  
  // SSL configuration for Railway
  ssl: isProduction ? { 
    rejectUnauthorized: false 
  } : false
});

// Alternative configuration if DATABASE_URL is not working:
// const pool = new Pool({
//   user: process.env.PGUSER || "postgres",
//   host: process.env.PGHOST || "ballast.proxy.rlwy.net",
//   database: process.env.PGDATABASE || "railway",
//   password: process.env.PGPASSWORD,
//   port: process.env.PGPORT || 30559,
//   max: 20,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 10000,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

// Log connection status
pool.on("connect", () => {
  console.log("✅ New client connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle PostgreSQL client", err);
  process.exit(-1);
});

// Test database connection
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log("✅ PostgreSQL connected successfully!");

    // Run a simple test query
    const result = await client.query("SELECT NOW()");
    console.log("✅ Database query test successful:", result.rows[0]);

    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", err.message);
    console.error("❌ Connection details:", {
      host: process.env.PGHOST || process.env.DB_HOST,
      port: process.env.PGPORT || process.env.DB_PORT,
      database: process.env.PGDATABASE || process.env.DB_NAME,
      user: process.env.PGUSER || process.env.DB_USER,
      usingSSL: isProduction
    });

    if (client) {
      client.release();
    }
    
    if (isProduction) {
      // Don't exit immediately in production, retry might work
      console.log("⚠️  Continuing without database connection...");
    }
  }
};

// Test connection on startup
testConnection();

module.exports = pool;