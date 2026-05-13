const express = require('express');
const { getDoctors, getDoctorById, getDepartments, getDemoLogins, getMe, updateMe } = require('../controllers/doctorController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/departments', getDepartments);
router.get('/demo-logins', getDemoLogins);
router.get('/me', requireAuth, requireRoles('doctor'), getMe);
router.put('/me', requireAuth, requireRoles('doctor'), updateMe);
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

module.exports = router;
