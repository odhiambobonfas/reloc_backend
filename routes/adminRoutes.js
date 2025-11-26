const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Migration endpoint - run migrations via API
router.post('/migrate/user-photos', async (req, res) => {
  try {
    console.log('🔄 Running user photos migration...');
    
    // Add id_photo_url column
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS id_photo_url TEXT;
    `);
    
    // Add index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_id_photo_url ON users(id_photo_url);
    `);
    
    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('photo_url', 'id_photo_url', 'photoURL')
      ORDER BY column_name;
    `);
    
    console.log('✅ Migration completed');
    res.status(200).json({ 
      success: true, 
      message: 'Migration completed successfully',
      columns: result.rows
    });
  } catch (err) {
    console.error('❌ Migration failed:', err);
    res.status(500).json({ error: 'Migration failed', details: err.message });
  }
});

module.exports = router;
