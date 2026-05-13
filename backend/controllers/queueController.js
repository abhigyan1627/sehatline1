const Queue = require('../models/Queue');
const Doctor = require('../models/Doctor');
const { transitionQueue, getDoctorTodayQueue, startOfDay, endOfDay } = require('../services/queueService');

const getMyToken = async (req, res, next) => {
  try {
    const queue = await Queue.findOne({ patient: req.user._id, status: { $in: ['waiting', 'called', 'in_consultation'] } })
      .sort({ queueDate: -1, tokenNumber: -1 })
      .populate('doctor')
      .populate('appointment');

    return res.json({ queue });
  } catch (error) {
    return next(error);
  }
};

const getDoctorQueue = async (req, res, next) => {
  try {
    const queue = await getDoctorTodayQueue(req.params.doctorId);
    return res.json({ queue });
  } catch (error) {
    return next(error);
  }
};

const callToken = async (req, res, next) => {
  try {
    const queue = await transitionQueue({ req, queueId: req.params.queueId, status: 'called', eventName: 'tokenCalled' });
    return res.json({ queue });
  } catch (error) {
    return next(error);
  }
};

const startConsultation = async (req, res, next) => {
  try {
    const queue = await transitionQueue({ req, queueId: req.params.queueId, status: 'in_consultation', eventName: 'consultationStarted' });
    return res.json({ queue });
  } catch (error) {
    return next(error);
  }
};

const completeConsultation = async (req, res, next) => {
  try {
    const queue = await transitionQueue({ req, queueId: req.params.queueId, status: 'completed', eventName: 'consultationCompleted' });
    return res.json({ queue });
  } catch (error) {
    return next(error);
  }
};

const skipToken = async (req, res, next) => {
  try {
    const queue = await transitionQueue({ req, queueId: req.params.queueId, status: 'skipped', eventName: 'queueUpdated' });
    return res.json({ queue });
  } catch (error) {
    return next(error);
  }
};

/* GET /api/queue/demo-status — public overview of today's demo queue */
const getDemoStatus = async (req, res, next) => {
  try {
    const today = startOfDay();
    const todayEnd = endOfDay();

    const queues = await Queue.find({ queueDate: { $gte: today, $lte: todayEnd } })
      .populate('patient', 'name email role')
      .populate('doctor', 'displayName speciality city clinicName')
      .populate('appointment', 'symptoms scheduledAt')
      .sort({ 'doctor': 1, tokenNumber: 1 })
      .lean();

    const byDoctor = {};
    queues.forEach((q) => {
      const key = q.doctor ? String(q.doctor._id) : 'unknown';
      if (!byDoctor[key]) {
        byDoctor[key] = {
          doctor: q.doctor,
          tokens: []
        };
      }
      byDoctor[key].tokens.push({
        _id: q._id,
        tokenNumber: q.tokenNumber,
        status: q.status,
        estimatedWaitMinutes: q.estimatedWaitMinutes,
        patient: q.patient ? { name: q.patient.name, email: q.patient.email } : null,
        symptoms: q.appointment?.symptoms || '',
        scheduledAt: q.appointment?.scheduledAt || null
      });
    });

    const summary = Object.values(byDoctor);
    const counts = {
      total: queues.length,
      waiting: queues.filter((q) => q.status === 'waiting').length,
      inConsultation: queues.filter((q) => q.status === 'in_consultation').length,
      completed: queues.filter((q) => q.status === 'completed').length,
      called: queues.filter((q) => q.status === 'called').length
    };

    return res.json({ date: today, counts, doctors: summary });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getMyToken, getDoctorQueue, callToken, startConsultation, completeConsultation, skipToken, getDemoStatus };
