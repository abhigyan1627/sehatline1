const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.get('/admin-demo', requireAuth, requireRoles('admin'), (req, res) => {
  res.json({ message: 'Admin role verified.', user: req.user.toSafeObject() });
});

module.exports = router;
