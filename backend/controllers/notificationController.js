const Notification = require('../models/Notification');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50);
    return res.json({ notifications });
  } catch (error) {
    return next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    return res.json({ notification });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getNotifications, markRead };
