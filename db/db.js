const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

// Debug: Log environment variables (remove in production if sensitive)
console.log("🔧 Database Configuration Debug:");
console.log("🔧 DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
console.log("🔧 PGHOST:", process.env.PGHOST || "Not set");
console.log("🔧 PGPORT:", process.env.PGPORT || "Not set");
console.log("🔧 PGDATABASE:", process.env.PGDATABASE || "Not set");
console.log("🔧 PGUSER:", process.env.PGUSER || "Not set");
console.log("🔧 NODE_ENV:", process.env.NODE_ENV);

// Primary configuration - use DATABASE_URL if available
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL with SSL
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
  console.log("🔧 Using DATABASE_URL for connection");
} else {
  // Fallback to individual environment variables
  poolConfig = {
    user: process.env.PGUSER || process.env.DB_USER || "postgres",
    host: process.env.PGHOST || process.env.DB_HOST || "ballast.proxy.rlwy.net",
    database: process.env.PGDATABASE || process.env.DB_NAME || "railway",
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
    port: process.env.PGPORT || process.env.DB_PORT || 30559,
    ssl: isProduction ? { 
      rejectUnauthorized: false 
    } : false
  };
  console.log("🔧 Using individual DB variables for connection");
}

// Add connection pool settings
Object.assign(poolConfig, {
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 20000, // Increased timeout for Railway
  maxUses: 7500, // Close connection after 7500 queries
  family: 4, // Force IPv4
});

console.log("🔧 Final connection config:", {
  host: poolConfig.host || poolConfig.connectionString?.split('@')[1]?.split(':')[0] || 'from DATABASE_URL',
  port: poolConfig.port || poolConfig.connectionString?.split(':').pop()?.split('/')[0] || 'from DATABASE_URL',
  database: poolConfig.database || 'from DATABASE_URL',
  user: poolConfig.user || 'from DATABASE_URL',
  ssl: poolConfig.ssl
});

const pool = new Pool(poolConfig);

// Log connection events
pool.on("connect", (client) => {
  console.log("✅ New client connected to PostgreSQL");
});

pool.on("acquire", (client) => {
  console.log("🔗 Client acquired from pool");
});

pool.on("remove", (client) => {
  console.log("🔌 Client removed from pool");
});

pool.on("error", (err, client) => {
  console.error("❌ Unexpected error on idle PostgreSQL client", err);
  // Don't exit process in production, let it recover
  if (!isProduction) {
    process.exit(-1);
  }
});

// Enhanced connection test with retry logic
const testConnection = async (retries = 3, delay = 5000) => {
  let client;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔧 Database connection attempt ${attempt}/${retries}...`);
      
      client = await pool.connect();
      console.log("✅ PostgreSQL connected successfully!");

      // Run a simple test query
      const result = await client.query("SELECT NOW() as current_time, version() as version");
      console.log("✅ Database query test successful");
      console.log("✅ Current time:", result.rows[0].current_time);
      console.log("✅ PostgreSQL version:", result.rows[0].version.split(',')[0]); // Just first line

      client.release();
      return true; // Success
      
    } catch (err) {
      console.error(`❌ PostgreSQL connection attempt ${attempt} failed:`, err.message);
      
      if (client) {
        client.release();
      }
      
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error("❌ All connection attempts failed");
        console.error("❌ Final connection details:", {
          host: poolConfig.host || 'from DATABASE_URL',
          port: poolConfig.port || 'from DATABASE_URL',
          database: poolConfig.database || 'from DATABASE_URL',
          user: poolConfig.user || 'from DATABASE_URL',
          hasPassword: !!poolConfig.password,
          ssl: poolConfig.ssl,
          usingDatabaseUrl: !!process.env.DATABASE_URL
        });
        
        if (!isProduction) {
          console.log("⚠️  Continuing without database connection...");
        }
        return false;
      }
    }
  }
};

// Test connection on startup with retry
setTimeout(() => {
  testConnection();
}, 1000); // Small delay to let environment settle

module.exports = pool;