const express = require('express');
const router = express.Router();
const { getNotificationSettings, updateNotificationSettings } = require('../controllers/notificationSettingsController');

router.get('/settings/:userId', getNotificationSettings);
router.put('/settings/:userId', updateNotificationSettings);

module.exports = router;
