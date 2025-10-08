const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
  } else {
    console.log('✅ Uploads directory already exists');
  }
  
  // Check if directory is writable
  try {
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    console.log('✅ Uploads directory is writable');
  } catch (error) {
    console.error('❌ Uploads directory is not writable:', error.message);
  }
  
} catch (error) {
  console.error('❌ Error creating uploads directory:', error.message);
}
