const User = require('../models/userModel');
const { isCloudinaryConfigured } = require('../config/cloudinary');

const syncUser = async (req, res) => {
  try {
    const { id, name, email, phone, photo_url, displayName, photoURL, company, role } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('🔄 Syncing user:', { id, name, email, displayName });

    const user = await User.syncUser({
      id,
      name: name || displayName || email?.split('@')[0] || 'User',
      email,
      phone,
      photo_url: photo_url || photoURL,
      displayName: displayName || name,
      photoURL: photoURL || photo_url,
      company,
      role: role || 'user'
    });

    console.log('✅ User synced successfully:', user);
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('❌ Error syncing user:', err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('🔄 Updating user:', id, updateData);
    
    const user = await User.updateUser(id, updateData);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User updated successfully:', user);
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('❌ Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const uploadUserPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'profile' or 'id'
    
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    console.log('📸 Uploading user photo:', {
      userId: id,
      type,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Get photo URL (Cloudinary or local)
    const photoUrl = isCloudinaryConfigured 
      ? req.file.path 
      : `/uploads/${req.file.filename}`;

    // Update user record with photo URL
    const updateData = type === 'id' 
      ? { id_photo_url: photoUrl }
      : { photo_url: photoUrl, photoURL: photoUrl };

    const user = await User.updateUser(id, updateData);

    console.log('✅ User photo uploaded successfully:', photoUrl);
    res.status(200).json({ 
      success: true, 
      photoUrl,
      url: photoUrl,
      user 
    });
  } catch (err) {
    console.error('❌ Error uploading user photo:', err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};

module.exports = { syncUser, getUserById, updateUser, uploadUserPhoto };
