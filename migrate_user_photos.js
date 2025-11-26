const pool = require('./db/db');

async function migrateUserPhotos() {
  try {
    console.log('🔄 Starting migration: Adding id_photo_url column to users table...');
    
    // Add id_photo_url column
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS id_photo_url TEXT;
    `);
    console.log('✅ Column id_photo_url added');

    // Add index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_id_photo_url ON users(id_photo_url);
    `);
    console.log('✅ Index idx_users_id_photo_url created');

    // Add comment
    await pool.query(`
      COMMENT ON COLUMN users.id_photo_url IS 'User ID/passport photo URL (stored in Cloudinary)';
    `);
    console.log('✅ Column comment added');

    // Verify the changes
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('photo_url', 'id_photo_url', 'photoURL')
      ORDER BY column_name;
    `);
    
    console.log('\n📋 Current user photo columns:');
    console.table(result.rows);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrateUserPhotos();
