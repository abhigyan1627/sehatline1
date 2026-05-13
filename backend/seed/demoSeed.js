require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Notification = require('../models/Notification');
const { startOfDay, calculateEstimatedWait } = require('../services/queueService');

const demoUsers = [
  { name: 'Demo Patient', email: 'patient@demo.com', password: '123456', role: 'patient', phone: '+91 90000 00001' },
  { name: 'Demo Doctor', email: 'doctor@demo.com', password: '123456', role: 'doctor', phone: '+91 90000 00002' },
  { name: 'Demo Receptionist', email: 'reception@demo.com', password: '123456', role: 'receptionist', phone: '+91 90000 00003' },
  { name: 'Demo Admin', email: 'admin@demo.com', password: '123456', role: 'admin', phone: '+91 90000 00004' }
];

const upsertUser = async (demoUser) => {
  let user = await User.findOne({ email: demoUser.email }).select('+password');

  if (!user) return User.create(demoUser);

  user.name = demoUser.name;
  user.password = demoUser.password;
  user.role = demoUser.role;
  user.phone = demoUser.phone;
  user.isActive = true;
  await user.save();
  return user;
};

const seed = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI / MONGODB_URI is required in .env');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required in .env');

  await mongoose.connect(uri);
  console.log('\n✅  MongoDB Atlas Connected:', mongoose.connection.host);
  console.log('📋  Seeding demo users, doctor profile, appointment, queue…\n');

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

  const scheduledAt = new Date(Date.now() + 60 * 60 * 1000);
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

  const queueDate = startOfDay(scheduledAt);
  const queue = await Queue.findOneAndUpdate(
    { appointment: appointment._id },
    {
      appointment: appointment._id,
      patient: users.patient._id,
      doctor: doctor._id,
      tokenNumber: 1,
      currentToken: 0,
      estimatedWaitMinutes: calculateEstimatedWait(0),
      emergencyDelayMinutes: 0,
      status: 'waiting',
      queueDate
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Notification.findOneAndUpdate(
    { recipient: users.patient._id, type: 'appointment', title: 'Demo appointment confirmed' },
    {
      recipient: users.patient._id,
      title: 'Demo appointment confirmed',
      message: `Your demo appointment is confirmed. Token ${queue.tokenNumber} is waiting.`,
      type: 'appointment',
      channel: 'in_app',
      isRead: false,
      metadata: { appointmentId: appointment._id, queueId: queue._id }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`\n${'─'.repeat(50)}`);
  console.log('✅  seed:demo complete — Demo login credentials:');
  console.table(demoUsers.map(({ email, password, role }) => ({ email, password, role })));
  console.log(`${'─'.repeat(50)}\n`);
  await mongoose.disconnect();
  console.log('🔌  Disconnected from MongoDB Atlas');
};

seed().catch(async (error) => {
  console.error('\n❌  seed:demo failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
