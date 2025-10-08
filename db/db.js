const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "192.168.20.207",
  database: process.env.DB_NAME || "reloc",
  password: process.env.DB_PASSWORD || "Othina78",
  port: process.env.DB_PORT || 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl: isProduction
    ? {
        require: true,
        rejectUnauthorized: false, // ✅ required for Railway
      }
    : false,
});

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
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL connected successfully!");

    // Run a simple test query
    const result = await client.query("SELECT NOW()");
    console.log("✅ Database query test successful:", result.rows[0]);

    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", err.message);
    console.error("❌ Connection details:", {
      host: process.env.DB_HOST || "192.168.20.207",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "reloc",
      user: process.env.DB_USER || "postgres",
    });

    if (isProduction) {
      process.exit(-1);
    }
  }
};

// Test connection on startup
testConnection();

module.exports = pool;
