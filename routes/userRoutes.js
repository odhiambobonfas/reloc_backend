const express = require('express');
const router = express.Router();
const { syncUser, getUserById, updateUser, uploadUserPhoto } = require('../controllers/userController');
const { upload } = require('../config/cloudinary');

router.post('/sync', syncUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.post('/:id/upload-photo', upload.single('photo'), uploadUserPhoto);

module.exports = router;
