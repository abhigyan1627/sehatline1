const express = require('express');
const { getMyToken, getDoctorQueue, callToken, startConsultation, completeConsultation, skipToken, getDemoStatus } = require('../controllers/queueController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/demo-status', getDemoStatus);
router.get('/my-token', requireAuth, requireRoles('patient', 'admin'), getMyToken);
router.get('/doctor/:doctorId', requireAuth, requireRoles('doctor', 'receptionist', 'admin'), getDoctorQueue);
router.post('/:queueId/call', requireAuth, requireRoles('doctor', 'receptionist', 'admin'), callToken);
router.post('/:queueId/start', requireAuth, requireRoles('doctor', 'admin'), startConsultation);
router.post('/:queueId/complete', requireAuth, requireRoles('doctor', 'admin'), completeConsultation);
router.post('/:queueId/skip', requireAuth, requireRoles('doctor', 'receptionist', 'admin'), skipToken);

module.exports = router;
