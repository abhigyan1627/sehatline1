/**
 * seed:demo-queue
 *
 * Creates a realistic demo queue for today with:
 *  - 6 patients booked across 2 demo doctors
 *  - Mixed statuses: waiting, called, in_consultation, completed
 *  - Notifications for each patient
 *
 * Safe to re-run: uses upsert / findOneAndUpdate throughout.
 * Atlas-compatible: reads MONGO_URI (or MONGODB_URI) from .env
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

/* ── helpers ── */
const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};


const upsertPatient = async ({ name, email, phone }) => {
  let user = await User.findOne({ email }).select('+password');
  if (!user) {
    user = await User.create({ name, email, password: 'Demo@1234', role: 'patient', phone });
    console.log(`  👤  Created patient: ${email}`);
  } else {
    console.log(`  👤  Patient exists: ${email}`);
  }
  return user;
};

const upsertAppointment = async ({ patient, doctor, symptoms }) => {
  /* Use a fixed scheduled time (start of today + 9h) so re-runs match the same doc */
  const scheduledAt = new Date(todayStart().getTime() + 9 * 60 * 60 * 1000);
  return Appointment.findOneAndUpdate(
    { patient: patient._id, doctor: doctor._id, source: 'demo' },
    { patient: patient._id, doctor: doctor._id, scheduledAt, symptoms, status: 'confirmed', source: 'demo' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const upsertQueue = async ({ appointment, patient, doctor, tokenNumber, status, estimatedWaitMinutes }) => {
  const queueDate = todayStart();
  /* Use the unique compound index fields as the filter to avoid E11000 on re-run */
  return Queue.findOneAndUpdate(
    { doctor: doctor._id, queueDate, tokenNumber },
    {
      appointment: appointment._id,
      patient: patient._id,
      doctor: doctor._id,
      tokenNumber,
      currentToken: status === 'waiting' ? tokenNumber - 1 : tokenNumber,
      estimatedWaitMinutes,
      emergencyDelayMinutes: 0,
      status,
      queueDate,
      ...(status === 'called'          ? { calledAt: new Date() }    : {}),
      ...(status === 'in_consultation' ? { startedAt: new Date() }   : {}),
      ...(status === 'completed'       ? { completedAt: new Date() } : {})
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const upsertNotification = async ({ patient, queue, title, message }) => {
  return Notification.findOneAndUpdate(
    { recipient: patient._id, 'metadata.queueId': queue._id },
    {
      recipient: patient._id,
      title,
      message,
      type: 'appointment',
      channel: 'in_app',
      isRead: false,
      metadata: { queueId: queue._id, tokenNumber: queue.tokenNumber }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/* ── demo data ── */
const DEMO_PATIENTS = [
  { name: 'Rahul Sharma',    email: 'rahul.sharma@demo.sehatline.in',  phone: '+91 98001 10001' },
  { name: 'Priti Gupta',     email: 'priti.gupta@demo.sehatline.in',   phone: '+91 98001 10002' },
  { name: 'Mohit Verma',     email: 'mohit.verma@demo.sehatline.in',   phone: '+91 98001 10003' },
  { name: 'Sneha Yadav',     email: 'sneha.yadav@demo.sehatline.in',   phone: '+91 98001 10004' },
  { name: 'Ajay Pandey',     email: 'ajay.pandey@demo.sehatline.in',   phone: '+91 98001 10005' },
  { name: 'Naina Singh',     email: 'naina.singh@demo.sehatline.in',   phone: '+91 98001 10006' },
];

/*
  Token plan (per doctor):
  Doctor A (General Physician, Patna) — tokens 1-4
    #1 completed, #2 completed, #3 in_consultation, #4 waiting

  Doctor B (Cardiologist, Patna) — tokens 1-2
    #1 called, #2 waiting
*/
const QUEUE_PLAN = [
  { patientIdx: 0, doctorFilter: { speciality: 'General Physician', city: 'Patna' }, token: 1, status: 'completed',       wait: 0,  symptom: 'Fever and body ache' },
  { patientIdx: 1, doctorFilter: { speciality: 'General Physician', city: 'Patna' }, token: 2, status: 'completed',       wait: 0,  symptom: 'Cough and cold' },
  { patientIdx: 2, doctorFilter: { speciality: 'General Physician', city: 'Patna' }, token: 3, status: 'in_consultation', wait: 0,  symptom: 'Chest congestion' },
  { patientIdx: 3, doctorFilter: { speciality: 'General Physician', city: 'Patna' }, token: 4, status: 'waiting',         wait: 8,  symptom: 'Headache and fatigue' },
  { patientIdx: 4, doctorFilter: { speciality: 'Cardiologist',      city: 'Patna' }, token: 1, status: 'called',          wait: 0,  symptom: 'Irregular heartbeat' },
  { patientIdx: 5, doctorFilter: { speciality: 'Cardiologist',      city: 'Patna' }, token: 2, status: 'waiting',         wait: 15, symptom: 'High blood pressure' },
];

/* ── main ── */
async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('\n✅  MongoDB Atlas Connected:', mongoose.connection.host);
  console.log('📋  Seeding demo queue (6 patients, 2 doctors, today\'s queue)…\n');

  /* 1 — upsert patients */
  console.log('── Patients ──────────────────────────────');
  const patients = [];
  for (const p of DEMO_PATIENTS) {
    patients.push(await upsertPatient(p));
  }

  /* 2 — upsert appointments + queue tokens */
  console.log('\n── Queue tokens ──────────────────────────');
  const STATUS_ICON = { waiting: '⏳', called: '📢', in_consultation: '🩺', completed: '✅', cancelled: '❌' };

  for (const plan of QUEUE_PLAN) {
    const patient = patients[plan.patientIdx];

    const doctor = await Doctor.findOne({ ...plan.doctorFilter, onboardingStatus: 'demo' });
    if (!doctor) {
      console.warn(`  ⚠️  Doctor not found for filter: ${JSON.stringify(plan.doctorFilter)} — skipping`);
      continue;
    }

    const appointment = await upsertAppointment({
      patient, doctor, symptoms: plan.symptom
    });

    const queue = await upsertQueue({
      appointment, patient, doctor,
      tokenNumber: plan.token,
      status: plan.status,
      estimatedWaitMinutes: plan.wait
    });

    const icon = STATUS_ICON[plan.status] || '•';
    console.log(`  ${icon}  Token #${plan.token} | ${patient.name} → ${doctor.displayName} [${plan.status}]`);

    /* notification */
    const notifMsg = plan.status === 'completed'
      ? `Your consultation is complete. Token #${plan.token}`
      : plan.status === 'in_consultation'
        ? `Dr. ${doctor.displayName} is seeing you now. Token #${plan.token}`
        : plan.status === 'called'
          ? `Token #${plan.token} called! Please proceed to the doctor.`
          : `Appointment confirmed. Token #${plan.token} — est. wait ${plan.wait} min`;

    await upsertNotification({
      patient, queue,
      title: plan.status === 'waiting' ? 'Appointment Confirmed' : 'Queue Update',
      message: notifMsg
    });
  }

  /* 3 — summary */
  const queueCount = await Queue.countDocuments({ queueDate: { $gte: todayStart() } });
  const apptCount  = await Appointment.countDocuments({ source: 'demo' });

  console.log(`\n${'─'.repeat(50)}`);
  console.log('✅  seed:demo-queue complete');
  console.log(`   Queue tokens today : ${queueCount}`);
  console.log(`   Total demo appts   : ${apptCount}`);
  console.log(`   Patients seeded    : ${DEMO_PATIENTS.length}`);
  console.log('');
  console.log('   Queue state:');
  console.log('     General Physician (Patna) : #1 ✅ #2 ✅ #3 🩺 #4 ⏳');
  console.log('     Cardiologist (Patna)       : #1 📢 #2 ⏳');
  console.log(`${'─'.repeat(50)}\n`);

  await mongoose.disconnect();
  console.log('🔌  Disconnected from MongoDB Atlas');
}

run().catch(async (err) => {
  console.error('\n❌  seed:demo-queue failed:', err.message);
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
