const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const { createQueueForAppointment, getDoctorTodayQueue, emitIfAvailable } = require('../services/queueService');

const walkinToken = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.body.doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });

    const email = String(req.body.email || `walkin-${Date.now()}@demo.local`).toLowerCase();
    const patientName = String(req.body.patientName || req.body.name || 'Walk-in Patient');
    const patient = await User.findOneAndUpdate(
      { email },
      {
        name: patientName,
        email,
        password: '123456',
        role: 'patient',
        phone: String(req.body.phone || '')
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      scheduledAt: new Date(),
      symptoms: String(req.body.symptoms || 'Walk-in consultation'),
      status: 'confirmed',
      source: 'demo'
    });

    const queue = await createQueueForAppointment({ req, appointment, doctorId: doctor._id, patientId: patient._id });
    return res.status(201).json({ patient: patient.toSafeObject(), appointment, queue });
  } catch (error) {
    return next(error);
  }
};

const liveQueue = async (req, res, next) => {
  try {
    const doctorId = req.query.doctorId;
    const doctor = doctorId ? await Doctor.findById(doctorId) : await Doctor.findOne();
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });

    const queue = await getDoctorTodayQueue(doctor._id);
    return res.json({ doctor, queue });
  } catch (error) {
    return next(error);
  }
};

const cancelQueue = async (req, res, next) => {
  try {
    const queue = await Queue.findByIdAndUpdate(req.params.queueId, { status: 'cancelled' }, { new: true });
    if (!queue) return res.status(404).json({ message: 'Queue item not found.' });

    await Appointment.findByIdAndUpdate(queue.appointment, { status: 'cancelled' });
    emitIfAvailable(req, 'queueUpdated', queue);
    return res.json({ queue });
  } catch (error) {
    return next(error);
  }
};

const rescheduleQueue = async (req, res, next) => {
  try {
    const scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null;
    if (!scheduledAt) return res.status(400).json({ message: 'scheduledAt is required.' });

    const queue = await Queue.findById(req.params.queueId);
    if (!queue) return res.status(404).json({ message: 'Queue item not found.' });

    const appointment = await Appointment.findByIdAndUpdate(queue.appointment, { scheduledAt }, { new: true });
    queue.queueDate = scheduledAt;
    await queue.save();

    emitIfAvailable(req, 'queueUpdated', queue);
    return res.json({ appointment, queue });
  } catch (error) {
    return next(error);
  }
};

module.exports = { walkinToken, liveQueue, cancelQueue, rescheduleQueue };
