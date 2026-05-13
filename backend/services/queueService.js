const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Notification = require('../models/Notification');

const AVERAGE_CONSULTATION_TIME = 8;

const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const calculateEstimatedWait = (patientsBeforeUser, emergencyDelay = 0) => (
  patientsBeforeUser * AVERAGE_CONSULTATION_TIME + emergencyDelay
);

const emitIfAvailable = (req, eventName, payload) => {
  const io = req.app.get('io');
  if (io) io.emit(eventName, payload);
};

const createNotification = async ({ req, recipient, title, message, type = 'system', metadata = {} }) => {
  const notification = await Notification.create({ recipient, title, message, type, metadata });
  emitIfAvailable(req, 'notificationCreated', notification);
  return notification;
};

const createQueueForAppointment = async ({ req, appointment, doctorId, patientId }) => {
  const queueDate = startOfDay(appointment.scheduledAt);
  const nextToken = await Queue.countDocuments({ doctor: doctorId, queueDate }) + 1;
  const waitingBefore = await Queue.countDocuments({ doctor: doctorId, queueDate, status: 'waiting' });
  const estimatedWaitMinutes = calculateEstimatedWait(waitingBefore);

  const queue = await Queue.create({
    appointment: appointment._id,
    patient: patientId,
    doctor: doctorId,
    tokenNumber: nextToken,
    currentToken: Math.max(nextToken - waitingBefore, 0),
    estimatedWaitMinutes,
    emergencyDelayMinutes: 0,
    status: 'waiting',
    queueDate
  });

  await createNotification({
    req,
    recipient: patientId,
    title: 'Appointment booked',
    message: `Your appointment is booked. Token ${queue.tokenNumber}, estimated wait ${queue.estimatedWaitMinutes} minutes.`,
    type: 'appointment',
    metadata: { appointmentId: appointment._id, queueId: queue._id, tokenNumber: queue.tokenNumber }
  });

  emitIfAvailable(req, 'queueUpdated', queue);
  return queue;
};

const getDoctorTodayQueue = (doctorId) => Queue.find({
  doctor: doctorId,
  queueDate: { $gte: startOfDay(), $lte: endOfDay() },
  status: { $ne: 'cancelled' }
})
  .sort({ tokenNumber: 1 })
  .populate('patient', 'name email phone role')
  .populate('appointment');

const transitionQueue = async ({ req, queueId, status, eventName }) => {
  const dateFields = {
    called: { calledAt: new Date() },
    in_consultation: { startedAt: new Date() },
    completed: { completedAt: new Date() }
  };

  const queue = await Queue.findByIdAndUpdate(
    queueId,
    { status, ...(dateFields[status] || {}) },
    { new: true }
  ).populate('patient', 'name email phone role').populate('doctor').populate('appointment');

  if (!queue) {
    const error = new Error('Queue item not found.');
    error.statusCode = 404;
    throw error;
  }

  if (status === 'completed' && queue.appointment) {
    await Appointment.findByIdAndUpdate(queue.appointment._id, { status: 'completed' });
  }

  emitIfAvailable(req, eventName, queue);
  emitIfAvailable(req, 'queueUpdated', queue);
  return queue;
};

const applyEmergencyDelay = async ({ req, doctorId, delayMinutes, reason }) => {
  const waitingQueues = await Queue.find({
    doctor: doctorId,
    queueDate: { $gte: startOfDay(), $lte: endOfDay() },
    status: 'waiting'
  }).sort({ tokenNumber: 1 });

  const updatedQueues = [];
  for (let index = 0; index < waitingQueues.length; index += 1) {
    const queue = waitingQueues[index];
    queue.emergencyDelayMinutes += delayMinutes;
    queue.estimatedWaitMinutes = calculateEstimatedWait(index, queue.emergencyDelayMinutes);
    await queue.save();
    updatedQueues.push(queue);

    await createNotification({
      req,
      recipient: queue.patient,
      title: 'Emergency delay update',
      message: `${reason}. Your estimated wait increased by ${delayMinutes} minutes.`,
      type: 'emergency',
      metadata: { queueId: queue._id, delayMinutes, reason }
    });
  }

  const payload = { doctorId, delayMinutes, reason, queues: updatedQueues };
  emitIfAvailable(req, 'queueUpdated', payload);
  emitIfAvailable(req, 'emergencyDelay', payload);
  return payload;
};

module.exports = {
  AVERAGE_CONSULTATION_TIME,
  startOfDay,
  endOfDay,
  calculateEstimatedWait,
  createNotification,
  createQueueForAppointment,
  getDoctorTodayQueue,
  transitionQueue,
  applyEmergencyDelay,
  emitIfAvailable
};
