const express = require('express');
const { bookAppointment, myAppointments, getAppointment, cancelAppointment } = require('../controllers/appointmentController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.post('/book', requireAuth, requireRoles('patient', 'receptionist', 'admin'), bookAppointment);
router.get('/my', requireAuth, myAppointments);
router.get('/:id', requireAuth, getAppointment);
router.put('/:id/cancel', requireAuth, cancelAppointment);

module.exports = router;
