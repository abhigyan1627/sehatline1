const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Queue = require('../models/Queue');
const { createQueueForAppointment, emitIfAvailable } = require('../services/queueService');

const bookAppointment = async (req, res, next) => {
  try {
    const doctorId = req.body.doctorId;
    const scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : new Date(Date.now() + 60 * 60 * 1000);
    const symptoms = String(req.body.symptoms || '').trim();

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctor._id,
      scheduledAt,
      symptoms,
      status: 'confirmed',
      source: 'demo'
    });

    const queue = await createQueueForAppointment({ req, appointment, doctorId: doctor._id, patientId: req.user._id });

    return res.status(201).json({ appointment, queue });
  } catch (error) {
    return next(error);
  }
};

const myAppointments = async (req, res, next) => {
  try {
    const filter = req.user.role === 'patient' ? { patient: req.user._id } : {};
    const appointments = await Appointment.find(filter)
      .sort({ scheduledAt: -1 })
      .populate('doctor')
      .populate('patient', 'name email phone role');

    return res.json({ appointments });
  } catch (error) {
    return next(error);
  }
};

const getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor')
      .populate('patient', 'name email phone role');

    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

    const queue = await Queue.findOne({ appointment: appointment._id });
    return res.json({ appointment, queue });
  } catch (error) {
    return next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

    const queue = await Queue.findOneAndUpdate(
      { appointment: appointment._id },
      { status: 'cancelled' },
      { new: true }
    );

    emitIfAvailable(req, 'queueUpdated', queue || appointment);
    return res.json({ appointment, queue });
  } catch (error) {
    return next(error);
  }
};

module.exports = { bookAppointment, myAppointments, getAppointment, cancelAppointment };
