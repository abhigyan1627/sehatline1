const express = require('express');
const { walkinToken, liveQueue, cancelQueue, rescheduleQueue } = require('../controllers/receptionistController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(requireAuth, requireRoles('receptionist', 'admin'));
router.post('/walkin-token', walkinToken);
router.get('/live-queue', liveQueue);
router.put('/queue/:queueId/cancel', cancelQueue);
router.put('/queue/:queueId/reschedule', rescheduleQueue);

module.exports = router;
