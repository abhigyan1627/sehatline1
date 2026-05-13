const { processMessage } = require('../services/chatbotService');

/* POST /api/chatbot/message */
const handleMessage = async (req, res, next) => {
  try {
    const message = String(req.body.message || '').trim();
    const city    = String(req.body.city    || '').trim();

    if (!message) {
      return res.status(400).json({ message: 'message is required.' });
    }

    const result = await processMessage({ message, city });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = { handleMessage };
