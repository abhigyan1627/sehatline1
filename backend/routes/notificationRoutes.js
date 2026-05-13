const express = require('express');
const { getNotifications, markRead } = require('../controllers/notificationController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getNotifications);
router.put('/:id/read', requireAuth, markRead);

module.exports = router;
