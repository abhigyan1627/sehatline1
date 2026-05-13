require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Notification = require('../models/Notification');

const demoUsers = [
  { name: 'Demo Patient', email: 'patient@demo.com', password: '123456', role: 'patient', phone: '+91 90000 00001' },
  { name: 'Demo Doctor', email: 'doctor@demo.com', password: '123456', role: 'doctor', phone: '+91 90000 00002' },
  { name: 'Demo Receptionist', email: 'reception@demo.com', password: '123456', role: 'receptionist', phone: '+91 90000 00003' },
  { name: 'Demo Admin', email: 'admin@demo.com', password: '123456', role: 'admin', phone: '+91 90000 00004' }
];

const upsertUser = async (demoUser) => {
  let user = await User.findOne({ email: demoUser.email }).select('+password');

  if (!user) {
    user = await User.create(demoUser);
    return user;
  }

  user.name = demoUser.name;
  user.password = demoUser.password;
  user.role = demoUser.role;
  user.phone = demoUser.phone;
  user.isActive = true;
  await user.save();
  return user;
};

const seed = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');

  await mongoose.connect(process.env.MONGODB_URI);

  const users = {};
  for (const demoUser of demoUsers) {
    users[demoUser.role] = await upsertUser(demoUser);
  }

  const doctor = await Doctor.findOneAndUpdate(
    { user: users.doctor._id },
    {
      user: users.doctor._id,
      displayName: 'Dr. Demo Sharma',
      speciality: 'General Physician',
      qualifications: ['MBBS', 'MD Medicine'],
      experienceYears: 12,
      consultationFee: 499,
      clinicName: 'SehatLine Demo Clinic',
      city: 'Patna',
      availability: [
        { day: 'Monday', startTime: '10:00', endTime: '14:00' },
        { day: 'Wednesday', startTime: '10:00', endTime: '14:00' },
        { day: 'Friday', startTime: '16:00', endTime: '20:00' }
      ],
      rating: 4.9,
      isAvailable: true
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const appointment = await Appointment.findOneAndUpdate(
    { patient: users.patient._id, doctor: doctor._id, source: 'demo' },
    {
      patient: users.patient._id,
      doctor: doctor._id,
      scheduledAt,
      symptoms: 'Demo fever and fatigue consultation',
      status: 'confirmed',
      source: 'demo'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Queue.findOneAndUpdate(
    { appointment: appointment._id },
    {
      appointment: appointment._id,
      patient: users.patient._id,
      doctor: doctor._id,
      tokenNumber: 7,
      currentToken: 3,
      estimatedWaitMinutes: 20,
      status: 'waiting',
      queueDate: scheduledAt
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Notification.findOneAndUpdate(
    { recipient: users.patient._id, type: 'appointment', title: 'Demo appointment confirmed' },
    {
      recipient: users.patient._id,
      title: 'Demo appointment confirmed',
      message: 'Your SehatLine demo appointment is confirmed. Token tracking is enabled.',
      type: 'appointment',
      channel: 'in_app',
      isRead: false
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('Demo users seeded successfully.');
  console.table(demoUsers.map(({ email, password, role }) => ({ email, password, role })));
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error('Demo seed failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
