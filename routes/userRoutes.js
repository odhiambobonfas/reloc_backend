const express = require('express');
const router = express.Router();
const { syncUser, getUserById } = require('../controllers/userController');

router.post('/sync', syncUser);
router.get('/:id', getUserById);

module.exports = router;
