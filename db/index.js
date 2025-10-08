const { Pool } = require('pg');
require('dotenv').config();

let config = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

// ✅ Only add password if it exists
if (process.env.DB_PASS && process.env.DB_PASS.trim() !== "") {
  config.password = process.env.DB_PASS;
}

const pool = new Pool(config);

pool.connect()
  .then(() => console.log("✅ PostgreSQL connected successfully"))
  .catch(err => console.error("❌ PostgreSQL connection error:", err));

module.exports = pool;
