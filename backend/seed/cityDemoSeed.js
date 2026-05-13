/**
 * seed:city-demo
 * Ensures every city has at least: GP, Dentist, Orthopedic, Cardiologist, Pediatrician
 * 14 cities × 5 specialities = 70 demo doctor profiles (idempotent)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

const URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!URI) { console.error('❌  MONGO_URI not set'); process.exit(1); }

/* ─── City matrix ─────────────────────────────────── */
const CITIES = {
  Bihar:        ['Patna', 'Gaya', 'Muzaffarpur', 'Siwan', 'Chhapra', 'Gopalganj'],
  Uttarakhand:  ['Dehradun', 'Haridwar', 'Haldwani', 'Rishikesh'],
  Gujarat:      ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot']
};

/* ─── Doctor templates per speciality ────────────── */
const TEMPLATES = [
  {
    speciality: 'General Physician',
    qualification: 'MBBS, MD (General Medicine)',
    fee: 200, time: 8,
    names: ['Sharma', 'Verma', 'Singh', 'Gupta', 'Pandey', 'Tiwari',
            'Mishra', 'Yadav', 'Dubey', 'Srivastava', 'Jha', 'Kumar', 'Rai', 'Prasad'],
    firstM: ['Rajiv', 'Anil', 'Suresh', 'Mohan', 'Ravi', 'Sanjay',
             'Deepak', 'Vikram', 'Ajay', 'Hemant', 'Dinesh', 'Pankaj', 'Vivek', 'Umesh'],
    firstF: ['Anjali', 'Priya', 'Sunita', 'Kavita', 'Rekha', 'Suman',
             'Geeta', 'Manju', 'Anita', 'Savita', 'Usha', 'Nisha', 'Pooja', 'Seema'],
    clinicSuffix: ['Family Clinic', 'Health Centre', 'Medical Centre', 'Polyclinic',
                   'General Clinic', 'Health Clinic', 'Nursing Home', 'Care Centre',
                   'Medicare', 'Health Point', 'Medical Hall', 'Super Clinic', 'OPD Centre', 'City Clinic'],
    about: 'Experienced general physician providing comprehensive outpatient care for fever, infections, chronic diseases, and preventive health.'
  },
  {
    speciality: 'Dentist',
    qualification: 'BDS, MDS (Oral Surgery)',
    fee: 350, time: 20,
    names: ['Shah', 'Patel', 'Joshi', 'Mehta', 'Dave', 'Trivedi',
            'Parikh', 'Kapoor', 'Nair', 'Iyer', 'Pillai', 'Rawat', 'Bisht', 'Chauhan'],
    firstM: ['Nikhil', 'Rohan', 'Kiran', 'Harsh', 'Varun', 'Arjun',
             'Tarun', 'Gaurav', 'Manish', 'Sachin', 'Abhishek', 'Vikas', 'Mohit', 'Rohit'],
    firstF: ['Priyanka', 'Sneha', 'Divya', 'Ritu', 'Neha', 'Shweta',
             'Pallavi', 'Ankita', 'Swati', 'Richa', 'Nidhi', 'Preeti', 'Sakshi', 'Meghna'],
    clinicSuffix: ['Dental Studio', 'Smile Clinic', 'Dental Care', 'Orthodontic Centre',
                   'Dental Hub', 'Oral Care', 'Perfect Smile', 'Tooth Care', 'Dental Planet',
                   'Smile Zone', 'Dental World', 'Tooth Fairy', 'White Smile', 'Bright Dental'],
    about: 'Specialist in general dentistry, orthodontics, root canal treatment, and cosmetic dental procedures.'
  },
  {
    speciality: 'Orthopedic',
    qualification: 'MBBS, MS (Orthopaedics)',
    fee: 500, time: 12,
    names: ['Agarwal', 'Bansal', 'Goyal', 'Mittal', 'Jindal', 'Garg',
            'Jain', 'Malhotra', 'Khanna', 'Bhatia', 'Sethi', 'Chopra', 'Arora', 'Anand'],
    firstM: ['Sandeep', 'Rajesh', 'Amit', 'Vinod', 'Sunil', 'Pramod',
             'Girish', 'Naresh', 'Ramesh', 'Yogesh', 'Mahesh', 'Rakesh', 'Dinesh', 'Kamlesh'],
    firstF: ['Vandana', 'Sharda', 'Meena', 'Archana', 'Sarika', 'Mamta',
             'Sudha', 'Kamla', 'Pushpa', 'Lata', 'Kalpana', 'Sangeeta', 'Radha', 'Vimla'],
    clinicSuffix: ['Bone & Joint', 'Ortho Clinic', 'Joint Care', 'Spine Centre',
                   'Fracture Clinic', 'Orthopedic Hospital', 'Bone Hospital', 'Joint Solutions',
                   'Spine & Ortho', 'Mobility Clinic', 'Bone Care', 'Ortho Centre', 'Sports Injury', 'Joint Clinic'],
    about: 'Expert in joint replacement, fracture management, sports injuries, spine disorders, and arthritis treatment.'
  },
  {
    speciality: 'Cardiologist',
    qualification: 'MBBS, MD, DM (Cardiology)',
    fee: 700, time: 15,
    names: ['Sinha', 'Saxena', 'Shukla', 'Tripathi', 'Chaturvedi', 'Upadhyay',
            'Pathak', 'Bajpai', 'Awasthi', 'Dixit', 'Kesarwani', 'Bhaskar', 'Nigam', 'Kapil'],
    firstM: ['Arun', 'Sushil', 'Pravin', 'Harish', 'Virender', 'Ashok',
             'Satish', 'Devendra', 'Narendra', 'Surendra', 'Mahendra', 'Jitendra', 'Virendra', 'Bijendra'],
    firstF: ['Sadhana', 'Madhuri', 'Roshni', 'Varsha', 'Namrata', 'Deepa',
             'Sonal', 'Jyoti', 'Bharti', 'Poonam', 'Bindu', 'Saroj', 'Pratibha', 'Mala'],
    clinicSuffix: ['Heart Care', 'Cardiac Centre', 'Heart Clinic', 'Cardiology OPD',
                   'Heart Hospital', 'Cardiac Hospital', 'HeartLine', 'Pulse Clinic',
                   'Heart Point', 'Cardiac Care', 'ECG Centre', 'Artery Clinic', 'Cardio Hub', 'Heart Zone'],
    about: 'Cardiologist specializing in hypertension, coronary artery disease, heart failure, arrhythmia, and preventive cardiology.'
  },
  {
    speciality: 'Pediatrician',
    qualification: 'MBBS, MD (Pediatrics)',
    fee: 300, time: 10,
    names: ['Chandra', 'Bose', 'Roy', 'Das', 'Dey', 'Mukherjee',
            'Chatterjee', 'Ganguly', 'Sen', 'Ghosh', 'Banerjee', 'Majumdar', 'Datta', 'Mitra'],
    firstM: ['Tapan', 'Suman', 'Bikash', 'Soumen', 'Pritam', 'Arnab',
             'Debashis', 'Subhash', 'Partha', 'Santosh', 'Bimal', 'Pradip', 'Ratan', 'Samir'],
    firstF: ['Tanushree', 'Moumita', 'Debjani', 'Sutapa', 'Arpita', 'Sangita',
             'Rimpa', 'Soma', 'Tumpa', 'Mimi', 'Jhuma', 'Bula', 'Champa', 'Rupa'],
    clinicSuffix: ['Child Care', 'Pediatric Clinic', 'Kids Clinic', 'Little Stars',
                   'Child Health Centre', "Children's Hospital", 'Baby Care', 'Tots Clinic',
                   'Junior Health', 'Kiddo Clinic', 'Child Wellness', 'Pedia Hub', 'SmallTown Kids', 'Neonatal Centre'],
    about: 'Pediatrician providing complete child healthcare — newborn care, vaccinations, growth monitoring, and treatment of childhood illnesses.'
  }
];

/* ─── Helpers ──────────────────────────────────────── */
const isFemale = (idx) => idx % 3 === 2;

const buildDoctor = (state, city, tpl, cityIdx, specIdx) => {
  const nameIdx   = cityIdx % tpl.names.length;
  const firstList = isFemale(cityIdx + specIdx) ? tpl.firstF : tpl.firstM;
  const firstName = firstList[(cityIdx + specIdx * 3) % firstList.length];
  const lastName  = tpl.names[nameIdx];
  const fullName  = `Dr. ${firstName} ${lastName}`;
  const gender    = isFemale(cityIdx + specIdx) ? 'F' : 'M';
  const slug      = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  const bgColors  = ['0f6fff', '8b5cf6', '059669', 'dc2626', 'ea580c'];
  const bg        = bgColors[specIdx % bgColors.length];
  const suffix    = tpl.clinicSuffix[cityIdx % tpl.clinicSuffix.length];
  const rating    = parseFloat((4.3 + ((cityIdx + specIdx) % 7) * 0.1).toFixed(1));
  const exp       = 4 + ((cityIdx * 3 + specIdx * 7) % 15);

  return {
    displayName:             fullName,
    email:                   `${slug}.${city.toLowerCase().replace(/\s/g, '')}@demo.sehatline.in`,
    phone:                   `+91 9${String(8000 + cityIdx * 10 + specIdx).padStart(4, '0')} ${String(10001 + cityIdx + specIdx * 100).padStart(5, '0')}`,
    speciality:              tpl.speciality,
    qualification:           tpl.qualification,
    qualifications:          [tpl.qualification],
    experienceYears:         exp,
    consultationFee:         tpl.fee,
    averageConsultationTime: tpl.time,
    clinicName:              `${lastName} ${suffix}`,
    address:                 `Main Road, ${city}`,
    city,
    state,
    aboutDoctor:             tpl.about,
    profileImage:            `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=${bg}&color=fff&size=128`,
    availableDays:           ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableTimeStart:      '09:00',
    availableTimeEnd:        '18:00',
    availableToday:          true,
    isAvailable:             true,
    isVisible:               true,
    rating,
    totalReviews:            20 + (cityIdx * 7 + specIdx * 13) % 80,
    verified:                false,
    verificationStatus:      'pending',
    onboardingStatus:        'demo'
  };
};

/* ─── Main ─────────────────────────────────────────── */
async function run() {
  await mongoose.connect(URI);
  console.log('\n✅  Connected:', mongoose.connection.host);
  console.log('━'.repeat(55));

  let created = 0, skipped = 0;

  for (const [state, cities] of Object.entries(CITIES)) {
    for (let ci = 0; ci < cities.length; ci++) {
      const city = cities[ci];
      for (let si = 0; si < TEMPLATES.length; si++) {
        const tpl = TEMPLATES[si];
        const doc = buildDoctor(state, city, tpl, ci, si);

        const existing = await Doctor.findOne({
          speciality: doc.speciality,
          city:       doc.city,
          onboardingStatus: 'demo'
        });

        if (existing) {
          skipped++;
        } else {
          await Doctor.create(doc);
          created++;
          console.log(`  ✚ ${city.padEnd(15)} ${tpl.speciality.padEnd(20)} ${doc.displayName}`);
        }
      }
    }
  }

  console.log('\n' + '━'.repeat(55));
  console.log(`✅  Done — ${created} created, ${skipped} already existed`);

  const total = await Doctor.countDocuments({ onboardingStatus: 'demo', isVisible: true });
  console.log(`📊  Total demo doctors in DB: ${total}`);
  console.log('━'.repeat(55) + '\n');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('\n❌  Failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
