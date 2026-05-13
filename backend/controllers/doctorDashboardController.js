const Doctor = require('../models/Doctor');
const Queue = require('../models/Queue');
const { getDoctorTodayQueue, transitionQueue, applyEmergencyDelay } = require('../services/queueService');

const getDoctorProfile = async (userId) => Doctor.findOne({ user: userId });

const today = async (req, res, next) => {
  try {
    const doctor = await getDoctorProfile(req.user._id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found.' });

    const queue = await getDoctorTodayQueue(doctor._id);
    return res.json({ doctor, queue });
  } catch (error) {
    return next(error);
  }
};

const callNext = async (req, res, next) => {
  try {
    const doctor = await getDoctorProfile(req.user._id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found.' });

    const nextQueue = await Queue.findOne({ doctor: doctor._id, status: 'waiting' }).sort({ tokenNumber: 1 });
    if (!nextQueue) return res.status(404).json({ message: 'No waiting patients.' });

    const queue = await transitionQueue({ req, queueId: nextQueue._id, status: 'called', eventName: 'tokenCalled' });
    return res.json({ queue });
  } catch (error) {
    return next(error);
  }
};

const completeCurrent = async (req, res, next) => {
  try {
    const doctor = await getDoctorProfile(req.user._id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found.' });

    const currentQueue = await Queue.findOne({ doctor: doctor._id, status: 'in_consultation' }).sort({ startedAt: -1 });
    if (!currentQueue) return res.status(404).json({ message: 'No active consultation.' });

    const queue = await transitionQueue({ req, queueId: currentQueue._id, status: 'completed', eventName: 'consultationCompleted' });
    return res.json({ queue });
  } catch (error) {
    return next(error);
  }
};

const emergencyDelay = async (req, res, next) => {
  try {
    const doctor = await getDoctorProfile(req.user._id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found.' });

    const delayMinutes = Number(req.body.delayMinutes || 0);
    const reason = String(req.body.reason || 'Emergency case').trim();

    if (delayMinutes <= 0) return res.status(400).json({ message: 'delayMinutes must be greater than 0.' });

    const result = await applyEmergencyDelay({ req, doctorId: doctor._id, delayMinutes, reason });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = { today, callNext, completeCurrent, emergencyDelay };
