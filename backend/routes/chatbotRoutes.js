const express = require('express');
const { handleMessage } = require('../controllers/chatbotController');

const router = express.Router();

/* Public — no auth required for chatbot */
router.post('/message', handleMessage);

module.exports = router;
