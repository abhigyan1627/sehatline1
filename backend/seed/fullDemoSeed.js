/**
 * seed:full-demo
 *
 * Creates ALL demo accounts in one script:
 *   - 5 Doctor users  (linked to Doctor profiles)
 *   - 10 Patient users
 *   - 1 Receptionist
 *   - 1 Admin
 *   - 5 Doctor profiles (one per doctor user, onboardingStatus: "demo")
 *   - 10 Queue tokens per doctor (50 total) using demo patients
 *   - Matching Appointments
 *   - Notifications per patient
 *
 * Atlas-compatible. Idempotent — safe to re-run.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Notification = require('../models/Notification');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('❌  MONGO_URI not set in .env'); process.exit(1); }

/* ─────────────────────────────────────────────────────
   DEMO USERS
───────────────────────────────────────────────────── */
const DEMO_DOCTORS = [
  { name: 'Dr. Anjali Mehta',  email: 'doctor.gp@demo.com',      role: 'doctor', phone: '+91 98100 11001', speciality: 'General Physician', clinicName: 'Mehta Family Clinic',   city: 'Patna',     state: 'Bihar',       experienceYears: 12, consultationFee: 300, averageConsultationTime: 8,  rating: 4.7 },
  { name: 'Dr. Priya Sharma',  email: 'doctor.dentist@demo.com',  role: 'doctor', phone: '+91 98100 22001', speciality: 'Dentist',           clinicName: 'Smile Dental Studio',  city: 'Dehradun',  state: 'Uttarakhand', experienceYears: 7,  consultationFee: 400, averageConsultationTime: 20, rating: 4.8 },
  { name: 'Dr. Suresh Patel',  email: 'doctor.ortho@demo.com',    role: 'doctor', phone: '+91 98100 33001', speciality: 'Orthopedic',        clinicName: 'Patel Bone & Joint',   city: 'Ahmedabad', state: 'Gujarat',     experienceYears: 15, consultationFee: 600, averageConsultationTime: 12, rating: 4.9 },
  { name: 'Dr. Arun Kumar',    email: 'doctor.cardio@demo.com',   role: 'doctor', phone: '+91 98100 44001', speciality: 'Cardiologist',      clinicName: 'HeartCare Clinic',     city: 'Patna',     state: 'Bihar',       experienceYears: 18, consultationFee: 800, averageConsultationTime: 15, rating: 4.9 },
  { name: 'Dr. Sunita Yadav',  email: 'doctor.pedia@demo.com',    role: 'doctor', phone: '+91 98100 55001', speciality: 'Pediatrician',      clinicName: 'Little Stars Clinic',  city: 'Patna',     state: 'Bihar',       experienceYears: 9,  consultationFee: 400, averageConsultationTime: 10, rating: 4.7 },
];

const DEMO_PATIENTS = [
  { name: 'Rahul Sharma',   email: 'patient1@demo.com',  phone: '+91 98001 10001' },
  { name: 'Priti Gupta',    email: 'patient2@demo.com',  phone: '+91 98001 10002' },
  { name: 'Mohit Verma',    email: 'patient3@demo.com',  phone: '+91 98001 10003' },
  { name: 'Sneha Yadav',    email: 'patient4@demo.com',  phone: '+91 98001 10004' },
  { name: 'Ajay Pandey',    email: 'patient5@demo.com',  phone: '+91 98001 10005' },
  { name: 'Naina Singh',    email: 'patient6@demo.com',  phone: '+91 98001 10006' },
  { name: 'Vikas Tiwari',   email: 'patient7@demo.com',  phone: '+91 98001 10007' },
  { name: 'Pooja Mishra',   email: 'patient8@demo.com',  phone: '+91 98001 10008' },
  { name: 'Rohit Jain',     email: 'patient9@demo.com',  phone: '+91 98001 10009' },
  { name: 'Anita Rawat',    email: 'patient10@demo.com', phone: '+91 98001 10010' },
];

const DEMO_STAFF = [
  { name: 'Demo Receptionist', email: 'reception@demo.com', role: 'receptionist', phone: '+91 90000 00003' },
  { name: 'Demo Admin',        email: 'admin@demo.com',     role: 'admin',        phone: '+91 90000 00004' },
];

const SYMPTOMS = [
  'Fever and body ache', 'Cough and cold', 'Chest congestion', 'Headache and fatigue',
  'Irregular heartbeat', 'High blood pressure', 'Back pain', 'Knee pain',
  'Dental checkup', 'Skin rash', 'Child vaccination', 'Eye irritation',
  'Sore throat', 'Stomach pain', 'Dizziness', 'Allergy',
  'Follow-up consultation', 'Blood pressure check', 'Diabetes review', 'General checkup'
];

/* ─────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────── */
const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

const upsertUser = async ({ name, email, role, phone }) => {
  let user = await User.findOne({ email }).select('+password');
  if (!user) {
    user = new User({ name, email, password: '123456', role, phone });
    await user.save();
    return { user, created: true };
  }
  user.name = name;
  user.role = role;
  user.phone = phone;
  user.isActive = true;
  /* Only reset password if it needs re-hashing */
  if (!(await user.comparePassword('123456'))) {
    user.password = '123456';
  }
  await user.save();
  return { user, created: false };
};

const upsertDoctorProfile = async (doctorUser, docData) => {
  return Doctor.findOneAndUpdate(
    { email: docData.email },
    {
      user: doctorUser._id,
      displayName: doctorUser.name,
      speciality: docData.speciality,
      clinicName: docData.clinicName,
      address: `Main Road, ${docData.city}`,
      city: docData.city,
      state: docData.state,
      phone: docData.phone,
      email: docData.email,
      experienceYears: docData.experienceYears,
      consultationFee: docData.consultationFee,
      averageConsultationTime: docData.averageConsultationTime,
      rating: docData.rating,
      availableToday: true,
      isAvailable: true,
      qualifications: ['MBBS', `MD ${docData.speciality}`],
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorUser.name)}&background=0f6fff&color=fff&size=128`,
      verified: false,
      onboardingStatus: 'demo'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const upsertAppointmentAndQueue = async ({ patient, doctor, tokenNumber, symptom }) => {
  const queueDate = todayStart();
  const scheduledAt = new Date(queueDate.getTime() + 9 * 60 * 60 * 1000);

  const appointment = await Appointment.findOneAndUpdate(
    { patient: patient._id, doctor: doctor._id, source: 'demo', symptoms: symptom },
    { patient: patient._id, doctor: doctor._id, scheduledAt, symptoms: symptom, status: 'confirmed', source: 'demo' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  /* Status pattern per token: 1-2 completed, 3 in_consultation, 4 called, 5-10 waiting */
  const statusMap = { 1: 'completed', 2: 'completed', 3: 'in_consultation', 4: 'called' };
  const status = statusMap[tokenNumber] || 'waiting';
  const wait = status === 'waiting' ? Math.max(0, (tokenNumber - 4) * 8) : 0;

  const queue = await Queue.findOneAndUpdate(
    { doctor: doctor._id, queueDate, tokenNumber },
    {
      appointment: appointment._id,
      patient: patient._id,
      doctor: doctor._id,
      tokenNumber,
      currentToken: status === 'waiting' ? tokenNumber - 1 : tokenNumber,
      estimatedWaitMinutes: wait,
      emergencyDelayMinutes: 0,
      status,
      queueDate,
      ...(status === 'called'          ? { calledAt: new Date() }    : {}),
      ...(status === 'in_consultation' ? { startedAt: new Date() }   : {}),
      ...(status === 'completed'       ? { completedAt: new Date() } : {})
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Notification.findOneAndUpdate(
    { recipient: patient._id, 'metadata.queueId': queue._id },
    {
      recipient: patient._id,
      title: status === 'waiting' ? 'Appointment Confirmed' : 'Queue Update',
      message: status === 'waiting'
        ? `Token #${tokenNumber} confirmed with ${doctor.displayName}. Est. wait ${wait} min.`
        : status === 'completed'
          ? `Your consultation with ${doctor.displayName} is complete.`
          : `Token #${tokenNumber} — status: ${status}`,
      type: 'appointment',
      channel: 'in_app',
      isRead: false,
      metadata: { queueId: queue._id, tokenNumber, doctorName: doctor.displayName }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { appointment, queue, status };
};

/* ─────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────── */
async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('\n✅  MongoDB Atlas Connected:', mongoose.connection.host);
  console.log('━'.repeat(55));

  /* ── 1. Staff (receptionist + admin) ── */
  console.log('\n📋  Seeding staff accounts…');
  for (const s of DEMO_STAFF) {
    const { user, created } = await upsertUser(s);
    console.log(`  ${created ? '✚' : '↩'} ${s.role.padEnd(14)} ${user.email}`);
  }

  /* ── 2. Doctor users + linked Doctor profiles ── */
  console.log('\n👨‍⚕️  Seeding doctor users + profiles…');
  const doctorProfiles = [];
  for (const d of DEMO_DOCTORS) {
    const { user, created: uCreated } = await upsertUser(d);
    const profile = await upsertDoctorProfile(user, d);
    doctorProfiles.push(profile);
    console.log(`  ${uCreated ? '✚' : '↩'} doctor   ${user.email}  →  profile ${profile._id}`);
  }

  /* ── 3. Patient users ── */
  console.log('\n🧑  Seeding patient users…');
  const patients = [];
  for (const p of DEMO_PATIENTS) {
    const { user, created } = await upsertUser({ ...p, role: 'patient' });
    patients.push(user);
    console.log(`  ${created ? '✚' : '↩'} patient  ${user.email}`);
  }

  /* ── 4. Queue: 10 tokens per doctor using round-robin patients ── */
  console.log('\n🔢  Seeding queue tokens (10 per doctor)…');
  const queueSummary = [];

  for (const doctor of doctorProfiles) {
    let tokenLog = [];
    for (let token = 1; token <= 10; token++) {
      const patient = patients[(token - 1) % patients.length];
      const symptom = SYMPTOMS[((doctorProfiles.indexOf(doctor)) * 10 + token - 1) % SYMPTOMS.length];
      const { queue, status } = await upsertAppointmentAndQueue({ patient, doctor, tokenNumber: token, symptom });
      tokenLog.push(`#${token}(${status.substring(0, 4)})`);
    }
    console.log(`  ${doctor.displayName.padEnd(22)} [${tokenLog.join(' ')}]`);
    queueSummary.push({ doctorId: doctor._id, doctorName: doctor.displayName, tokens: 10 });
  }

  /* ── 5. Summary table ── */
  console.log('\n' + '━'.repeat(55));
  console.log('✅  seed:full-demo complete\n');

  console.log('🔑  DEMO LOGIN CREDENTIALS (password: 123456 for all)\n');

  const credRows = [
    ...DEMO_DOCTORS.map(d => ({ Role: 'doctor', Email: d.email, Name: d.name, Speciality: d.speciality })),
    ...DEMO_PATIENTS.map(p => ({ Role: 'patient', Email: p.email, Name: p.name, Speciality: '—' })),
    ...DEMO_STAFF.map(s => ({ Role: s.role, Email: s.email, Name: s.name, Speciality: '—' }))
  ];
  console.table(credRows);

  console.log('🏥  Doctor Profile IDs:\n');
  const profileRows = doctorProfiles.map(p => ({
    Email: DEMO_DOCTORS.find(d => d.email === p.email)?.email || p.email,
    Speciality: p.speciality,
    ProfileId: String(p._id)
  }));
  console.table(profileRows);

  const totalQueue = await Queue.countDocuments({ queueDate: { $gte: todayStart() } });
  console.log(`\n📊  Queue tokens today: ${totalQueue}`);
  console.log('━'.repeat(55) + '\n');

  await mongoose.disconnect();
  console.log('🔌  Disconnected from MongoDB Atlas');
}

run().catch(async (err) => {
  console.error('\n❌  seed:full-demo failed:', err.message);
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
