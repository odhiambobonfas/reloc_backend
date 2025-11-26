-- Add ID photo URL column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_photo_url TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_photo_url ON users(photo_url);
CREATE INDEX IF NOT EXISTS idx_users_id_photo_url ON users(id_photo_url);

-- Update comments
COMMENT ON COLUMN users.photo_url IS 'User profile photo URL (stored in Cloudinary)';
COMMENT ON COLUMN users.id_photo_url IS 'User ID/passport photo URL (stored in Cloudinary)';
