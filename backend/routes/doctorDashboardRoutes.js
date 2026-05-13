const express = require('express');
const { today, callNext, completeCurrent, emergencyDelay } = require('../controllers/doctorDashboardController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(requireAuth, requireRoles('doctor', 'admin'));
router.get('/today', today);
router.post('/call-next', callNext);
router.post('/complete-current', completeCurrent);
router.post('/emergency-delay', emergencyDelay);

module.exports = router;
