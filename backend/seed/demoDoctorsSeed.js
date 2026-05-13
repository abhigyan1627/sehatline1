require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('❌  MONGO_URI not set in .env'); process.exit(1); }

/* ─────────────────────────────────────────────────────────────────
   20 demo doctors — 2 per department, spread across 5 cities
   onboardingStatus: "demo"  |  verified: false
   profileImage: placeholder SVG avatar URL (no external dependency)
───────────────────────────────────────────────────────────────── */
const demoDoctors = [

  /* ── General Physician ── */
  {
    displayName: 'Dr. Anjali Mehta',
    speciality: 'General Physician',
    clinicName: 'Mehta Family Clinic',
    address: 'Station Road, Patna',
    city: 'Patna', state: 'Bihar',
    phone: '+91 98100 11001', email: 'anjali.mehta@demo.sehatline.in',
    experienceYears: 12, consultationFee: 300, averageConsultationTime: 8,
    rating: 4.7, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'MD General Medicine'],
    profileImage: 'https://ui-avatars.com/api/?name=Anjali+Mehta&background=0f6fff&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },
  {
    displayName: 'Dr. Rajiv Sinha',
    speciality: 'General Physician',
    clinicName: 'Sinha Health Centre',
    address: 'Gandhi Nagar, Siwan',
    city: 'Siwan', state: 'Bihar',
    phone: '+91 98100 11002', email: 'rajiv.sinha@demo.sehatline.in',
    experienceYears: 8, consultationFee: 250, averageConsultationTime: 7,
    rating: 4.5, availableToday: true, isAvailable: true,
    qualifications: ['MBBS'],
    profileImage: 'https://ui-avatars.com/api/?name=Rajiv+Sinha&background=0f6fff&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },

  /* ── Dentist ── */
  {
    displayName: 'Dr. Priya Sharma',
    speciality: 'Dentist',
    clinicName: 'Smile Dental Studio',
    address: 'Rajpur Road, Dehradun',
    city: 'Dehradun', state: 'Uttarakhand',
    phone: '+91 98100 22001', email: 'priya.sharma@demo.sehatline.in',
    experienceYears: 7, consultationFee: 400, averageConsultationTime: 20,
    rating: 4.8, availableToday: true, isAvailable: true,
    qualifications: ['BDS', 'MDS Orthodontics'],
    profileImage: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=35c99f&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },
  {
    displayName: 'Dr. Vikas Rawat',
    speciality: 'Dentist',
    clinicName: 'Rawat Dental Care',
    address: 'Haldwani Road, Haldwani',
    city: 'Haldwani', state: 'Uttarakhand',
    phone: '+91 98100 22002', email: 'vikas.rawat@demo.sehatline.in',
    experienceYears: 5, consultationFee: 350, averageConsultationTime: 18,
    rating: 4.4, availableToday: true, isAvailable: true,
    qualifications: ['BDS'],
    profileImage: 'https://ui-avatars.com/api/?name=Vikas+Rawat&background=35c99f&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },

  /* ── Orthopedic ── */
  {
    displayName: 'Dr. Suresh Patel',
    speciality: 'Orthopedic',
    clinicName: 'Patel Bone & Joint Clinic',
    address: 'Navrangpura, Ahmedabad',
    city: 'Ahmedabad', state: 'Gujarat',
    phone: '+91 98100 33001', email: 'suresh.patel@demo.sehatline.in',
    experienceYears: 15, consultationFee: 600, averageConsultationTime: 12,
    rating: 4.9, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'MS Orthopaedics'],
    profileImage: 'https://ui-avatars.com/api/?name=Suresh+Patel&background=f59e0b&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },
  {
    displayName: 'Dr. Meena Joshi',
    speciality: 'Orthopedic',
    clinicName: 'Joshi Ortho Centre',
    address: 'Paltan Bazaar, Dehradun',
    city: 'Dehradun', state: 'Uttarakhand',
    phone: '+91 98100 33002', email: 'meena.joshi@demo.sehatline.in',
    experienceYears: 10, consultationFee: 500, averageConsultationTime: 10,
    rating: 4.6, availableToday: false, isAvailable: true,
    qualifications: ['MBBS', 'DNB Orthopaedics'],
    profileImage: 'https://ui-avatars.com/api/?name=Meena+Joshi&background=f59e0b&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },

  /* ── Cardiologist ── */
  {
    displayName: 'Dr. Arun Kumar',
    speciality: 'Cardiologist',
    clinicName: 'HeartCare Clinic',
    address: 'Boring Road, Patna',
    city: 'Patna', state: 'Bihar',
    phone: '+91 98100 44001', email: 'arun.kumar@demo.sehatline.in',
    experienceYears: 18, consultationFee: 800, averageConsultationTime: 15,
    rating: 4.9, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'MD Cardiology', 'DM'],
    profileImage: 'https://ui-avatars.com/api/?name=Arun+Kumar&background=dc2626&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },
  {
    displayName: 'Dr. Nisha Shah',
    speciality: 'Cardiologist',
    clinicName: 'Shah Heart Institute',
    address: 'Vastrapur, Ahmedabad',
    city: 'Ahmedabad', state: 'Gujarat',
    phone: '+91 98100 44002', email: 'nisha.shah@demo.sehatline.in',
    experienceYears: 14, consultationFee: 750, averageConsultationTime: 15,
    rating: 4.8, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'MD Cardiology'],
    profileImage: 'https://ui-avatars.com/api/?name=Nisha+Shah&background=dc2626&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },

  /* ── Pediatrician ── */
  {
    displayName: 'Dr. Sunita Yadav',
    speciality: 'Pediatrician',
    clinicName: 'Little Stars Child Clinic',
    address: 'Ashok Rajpath, Patna',
    city: 'Patna', state: 'Bihar',
    phone: '+91 98100 55001', email: 'sunita.yadav@demo.sehatline.in',
    experienceYears: 9, consultationFee: 400, averageConsultationTime: 10,
    rating: 4.7, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'MD Pediatrics'],
    profileImage: 'https://ui-avatars.com/api/?name=Sunita+Yadav&background=8b5cf6&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },
  {
    displayName: 'Dr. Manoj Bisht',
    speciality: 'Pediatrician',
    clinicName: 'Bisht Child Care',
    address: 'Mall Road, Haldwani',
    city: 'Haldwani', state: 'Uttarakhand',
    phone: '+91 98100 55002', email: 'manoj.bisht@demo.sehatline.in',
    experienceYears: 6, consultationFee: 350, averageConsultationTime: 8,
    rating: 4.5, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'DCH'],
    profileImage: 'https://ui-avatars.com/api/?name=Manoj+Bisht&background=8b5cf6&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },

  /* ── Gynecologist ── */
  {
    displayName: 'Dr. Kavita Singh',
    speciality: 'Gynecologist',
    clinicName: 'Kavita Women\'s Clinic',
    address: 'Frazer Road, Patna',
    city: 'Patna', state: 'Bihar',
    phone: '+91 98100 66001', email: 'kavita.singh@demo.sehatline.in',
    experienceYears: 13, consultationFee: 500, averageConsultationTime: 12,
    rating: 4.8, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'MS Gynecology'],
    profileImage: 'https://ui-avatars.com/api/?name=Kavita+Singh&background=ec4899&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },
  {
    displayName: 'Dr. Ritu Agarwal',
    speciality: 'Gynecologist',
    clinicName: 'Agarwal Women\'s Health',
    address: 'CG Road, Ahmedabad',
    city: 'Ahmedabad', state: 'Gujarat',
    phone: '+91 98100 66002', email: 'ritu.agarwal@demo.sehatline.in',
    experienceYears: 11, consultationFee: 550, averageConsultationTime: 12,
    rating: 4.7, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'DGO'],
    profileImage: 'https://ui-avatars.com/api/?name=Ritu+Agarwal&background=ec4899&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },

  /* ── Dermatologist ── */
  {
    displayName: 'Dr. Pooja Nair',
    speciality: 'Dermatologist',
    clinicName: 'Glow Skin Clinic',
    address: 'Rajaji Road, Dehradun',
    city: 'Dehradun', state: 'Uttarakhand',
    phone: '+91 98100 77001', email: 'pooja.nair@demo.sehatline.in',
    experienceYears: 7, consultationFee: 450, averageConsultationTime: 10,
    rating: 4.6, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'MD Dermatology'],
    profileImage: 'https://ui-avatars.com/api/?name=Pooja+Nair&background=0891b2&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },
  {
    displayName: 'Dr. Amit Desai',
    speciality: 'Dermatologist',
    clinicName: 'ClearSkin Studio',
    address: 'Satellite, Ahmedabad',
    city: 'Ahmedabad', state: 'Gujarat',
    phone: '+91 98100 77002', email: 'amit.desai@demo.sehatline.in',
    experienceYears: 9, consultationFee: 500, averageConsultationTime: 10,
    rating: 4.7, availableToday: false, isAvailable: true,
    qualifications: ['MBBS', 'DVD'],
    profileImage: 'https://ui-avatars.com/api/?name=Amit+Desai&background=0891b2&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },

  /* ── ENT ── */
  {
    displayName: 'Dr. Rakesh Tiwari',
    speciality: 'ENT',
    clinicName: 'Tiwari ENT Clinic',
    address: 'Exhibition Road, Patna',
    city: 'Patna', state: 'Bihar',
    phone: '+91 98100 88001', email: 'rakesh.tiwari@demo.sehatline.in',
    experienceYears: 11, consultationFee: 400, averageConsultationTime: 10,
    rating: 4.5, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'MS ENT'],
    profileImage: 'https://ui-avatars.com/api/?name=Rakesh+Tiwari&background=059669&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },
  {
    displayName: 'Dr. Seema Dobhal',
    speciality: 'ENT',
    clinicName: 'Dobhal ENT & Hearing',
    address: 'Indira Nagar, Dehradun',
    city: 'Dehradun', state: 'Uttarakhand',
    phone: '+91 98100 88002', email: 'seema.dobhal@demo.sehatline.in',
    experienceYears: 8, consultationFee: 380, averageConsultationTime: 10,
    rating: 4.4, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'DLO'],
    profileImage: 'https://ui-avatars.com/api/?name=Seema+Dobhal&background=059669&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },

  /* ── Eye Specialist ── */
  {
    displayName: 'Dr. Deepak Gupta',
    speciality: 'Eye Specialist',
    clinicName: 'Gupta Vision Centre',
    address: 'Patliputra Colony, Patna',
    city: 'Patna', state: 'Bihar',
    phone: '+91 98100 99001', email: 'deepak.gupta@demo.sehatline.in',
    experienceYears: 14, consultationFee: 500, averageConsultationTime: 8,
    rating: 4.8, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'MS Ophthalmology'],
    profileImage: 'https://ui-avatars.com/api/?name=Deepak+Gupta&background=7c3aed&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },
  {
    displayName: 'Dr. Harsha Modi',
    speciality: 'Eye Specialist',
    clinicName: 'Modi Eye Hospital',
    address: 'Maninagar, Ahmedabad',
    city: 'Ahmedabad', state: 'Gujarat',
    phone: '+91 98100 99002', email: 'harsha.modi@demo.sehatline.in',
    experienceYears: 10, consultationFee: 450, averageConsultationTime: 8,
    rating: 4.6, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'DO Ophthalmology'],
    profileImage: 'https://ui-avatars.com/api/?name=Harsha+Modi&background=7c3aed&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },

  /* ── Neurologist ── */
  {
    displayName: 'Dr. Sanjay Kapoor',
    speciality: 'Neurologist',
    clinicName: 'Kapoor Neuro Centre',
    address: 'Siwan Main Market, Siwan',
    city: 'Siwan', state: 'Bihar',
    phone: '+91 98100 10001', email: 'sanjay.kapoor@demo.sehatline.in',
    experienceYears: 20, consultationFee: 900, averageConsultationTime: 20,
    rating: 4.9, availableToday: true, isAvailable: true,
    qualifications: ['MBBS', 'MD Neurology', 'DM'],
    profileImage: 'https://ui-avatars.com/api/?name=Sanjay+Kapoor&background=1e40af&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  },
  {
    displayName: 'Dr. Alka Verma',
    speciality: 'Neurologist',
    clinicName: 'Verma Brain & Spine',
    address: 'Clock Tower, Dehradun',
    city: 'Dehradun', state: 'Uttarakhand',
    phone: '+91 98100 10002', email: 'alka.verma@demo.sehatline.in',
    experienceYears: 16, consultationFee: 850, averageConsultationTime: 18,
    rating: 4.8, availableToday: false, isAvailable: true,
    qualifications: ['MBBS', 'MD Neurology'],
    profileImage: 'https://ui-avatars.com/api/?name=Alka+Verma&background=1e40af&color=fff&size=128',
    verified: false, onboardingStatus: 'demo'
  }
];

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('\n✅  MongoDB Atlas Connected:', mongoose.connection.host);
  console.log('📋  Seeding demo doctors (20 doctors, 10 departments, 5 cities)…\n');

  let created = 0;
  let skipped = 0;

  for (const doc of demoDoctors) {
    const exists = await Doctor.findOne({
      displayName: doc.displayName,
      onboardingStatus: 'demo'
    });
    if (exists) {
      console.log(`  skip  ${doc.displayName} (already exists)`);
      skipped += 1;
    } else {
      await Doctor.create(doc);
      console.log(`  added ${doc.displayName} — ${doc.speciality} — ${doc.city}`);
      created += 1;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅  seed:demo-doctors complete`);
  console.log(`   Created : ${created}`);
  console.log(`   Skipped : ${skipped} (already exist)`);
  console.log(`   Total   : ${demoDoctors.length}`);
  console.log(`${'─'.repeat(50)}\n`);
  await mongoose.disconnect();
  console.log('🔌  Disconnected from MongoDB Atlas');
}

run().catch(async (err) => {
  console.error('\n❌  seed:demo-doctors failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
