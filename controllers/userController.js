const User = require('../models/userModel');

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

module.exports = { syncUser, getUserById };
