/**
 * chatbotService.js
 * Rule-based symptom → specialist mapping with emergency detection.
 * No paid AI API. No diagnosis claims. Recommend doctor always.
 */
const Doctor = require('../models/Doctor');

/* ─── Emergency patterns ────────────────────────────────────────────── */
const EMERGENCY_PATTERNS = [
  /severe\s+chest\s+pain/i,
  /chest\s+pain/i,
  /heart\s+attack/i,
  /can'?t?\s+breath/i,
  /breathing\s+(problem|difficulty|trouble|issue)/i,
  /unconscious/i,
  /heavy\s+bleeding/i,
  /stroke/i,
  /paralys/i,
  /severe\s+accident/i,
  /road\s+accident/i,
  /suicid/i,
  /overdose/i,
  /not\s+breathing/i,
  /seizure/i,
  /convulsion/i,
  /collapsed/i
];

/* ─── Symptom → Speciality rules ────────────────────────────────────── */
const RULES = [
  {
    speciality: 'Cardiologist',
    patterns: [
      /chest\s+pain/i, /heart\s+pain/i, /palpitation/i, /irregular\s+heartbeat/i,
      /heart\s+problem/i, /cardiac/i, /bp\s+high/i, /blood\s+pressure/i,
      /shortness\s+of\s+breath/i, /breathless/i
    ],
    reply: 'Your symptoms may be related to the heart or cardiovascular system. Please consult a Cardiologist promptly.'
  },
  {
    speciality: 'Dentist',
    patterns: [
      /tooth\s+pain/i, /toothache/i, /dental/i, /gum\s+bleed/i, /gum\s+pain/i,
      /mouth\s+pain/i, /cavity/i, /broken\s+tooth/i, /wisdom\s+tooth/i, /swollen\s+gum/i
    ],
    reply: 'This sounds like a dental issue. A Dentist can help with tooth pain, gum problems, and oral health.'
  },
  {
    speciality: 'Orthopedic',
    patterns: [
      /bone\s+pain/i, /joint\s+pain/i, /knee\s+pain/i, /back\s+pain/i,
      /shoulder\s+pain/i, /fracture/i, /sprain/i, /injury/i, /arthritis/i,
      /slip\s+disc/i, /neck\s+pain/i, /hip\s+pain/i, /ankle\s+pain/i, /wrist\s+pain/i
    ],
    reply: 'Bone, joint, or injury-related symptoms are best evaluated by an Orthopedic specialist.'
  },
  {
    speciality: 'Pediatrician',
    patterns: [
      /child\s+fever/i, /child\s+cough/i, /child\s+sick/i, /baby\s+fever/i,
      /infant/i, /toddler/i, /my\s+child/i, /my\s+baby/i, /newborn/i,
      /kid\s+sick/i, /child\s+vomit/i, /child\s+diarr/i, /child\s+rash/i
    ],
    reply: "Children's health concerns should be checked by a Pediatrician who specializes in child care."
  },
  {
    speciality: 'Dermatologist',
    patterns: [
      /skin\s+rash/i, /rash/i, /acne/i, /itching/i, /itch/i, /skin\s+problem/i,
      /eczema/i, /psoriasis/i, /hives/i, /skin\s+infection/i, /pimple/i,
      /hair\s+fall/i, /hair\s+loss/i, /dandruff/i, /fungal/i, /pigmentation/i
    ],
    reply: 'Skin-related symptoms like rash, itching, or acne are best treated by a Dermatologist.'
  },
  {
    speciality: 'ENT',
    patterns: [
      /ear\s+pain/i, /earache/i, /throat\s+pain/i, /sore\s+throat/i,
      /nose\s+block/i, /blocked\s+nose/i, /runny\s+nose/i, /sinus/i,
      /tonsil/i, /hearing\s+(loss|problem)/i, /ear\s+infection/i, /nasal/i,
      /snoring/i, /voice\s+problem/i, /hoarse/i
    ],
    reply: 'Ear, throat, or nose symptoms are best handled by an ENT (Ear Nose Throat) specialist.'
  },
  {
    speciality: 'Eye Specialist',
    patterns: [
      /eye\s+pain/i, /blurry\s+vision/i, /blurred\s+vision/i, /vision\s+problem/i,
      /eye\s+redness/i, /red\s+eye/i, /watery\s+eye/i, /eye\s+infection/i,
      /spectacle/i, /glasses/i, /cataract/i, /glaucoma/i, /double\s+vision/i
    ],
    reply: 'Eye pain or vision problems should be evaluated by an Eye Specialist (Ophthalmologist).'
  },
  {
    speciality: 'Neurologist',
    patterns: [
      /headache/i, /migraine/i, /numbness/i, /tingling/i, /dizziness/i,
      /vertigo/i, /memory\s+loss/i, /confusion/i, /tremor/i, /epilepsy/i,
      /nerve\s+pain/i, /weakness\s+in\s+(hand|leg|arm)/i, /paralysis/i
    ],
    reply: 'Headaches, dizziness, numbness, or neurological symptoms should be assessed by a Neurologist.'
  },
  {
    speciality: 'Gynecologist',
    patterns: [
      /period\s+pain/i, /menstrual/i, /pregnancy/i, /pregnant/i, /vaginal/i,
      /pcod/i, /pcos/i, /irregular\s+period/i, /white\s+discharge/i,
      /ovarian/i, /uterus/i, /fertility/i, /menopause/i, /breast\s+pain/i
    ],
    reply: "Women's health issues like menstrual problems or pregnancy care are handled by a Gynecologist."
  },
  {
    speciality: 'General Physician',
    patterns: [
      /fever/i, /cold/i, /cough/i, /weakness/i, /fatigue/i, /tired/i,
      /body\s+ache/i, /body\s+pain/i, /vomit/i, /nausea/i, /diarr/i,
      /loose\s+motion/i, /stomach\s+pain/i, /stomach\s+ache/i, /abdomen/i,
      /indigestion/i, /acidity/i, /gas/i, /constipation/i, /not\s+feeling\s+well/i,
      /unwell/i, /sick/i, /flu/i, /infection/i, /viral/i, /sugar/i, /diabetes/i,
      /thyroid/i, /weight\s+(loss|gain)/i, /appetite/i
    ],
    reply: 'A General Physician can help with common symptoms like fever, cold, cough, weakness, and general illness.'
  }
];

/* ─── Helpers ───────────────────────────────────────────────────────── */
const isEmergency = (text) => EMERGENCY_PATTERNS.some((p) => p.test(text));

const detectSpeciality = (text) => {
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      return rule;
    }
  }
  return null;
};

const fetchTopDoctors = async (city, speciality) => {
  if (!city || !speciality) return [];
  return Doctor.find({
    isVisible:   true,
    speciality:  { $regex: new RegExp(`^${speciality}$`, 'i') },
    city:        { $regex: new RegExp(`^${city.trim()}$`, 'i') }
  })
    .select('displayName speciality clinicName address city rating consultationFee profileImage availableToday verified verificationStatus availableTimeStart availableTimeEnd qualification')
    .sort({ verified: -1, availableToday: -1, rating: -1 })
    .limit(3)
    .lean();
};

/* ─── Main function ─────────────────────────────────────────────────── */
const processMessage = async ({ message, city }) => {
  const text = String(message || '').trim();

  /* 1. Emergency check */
  if (isEmergency(text)) {
    return {
      reply: '🚨 This sounds like a medical emergency. Please call emergency services or go to the nearest hospital IMMEDIATELY. Do not wait.',
      suggestedSpecialization: 'Cardiologist',
      urgency: 'emergency',
      doctors: [],
      quickReplies: []
    };
  }

  /* 2. Detect speciality */
  const match = detectSpeciality(text);

  if (!match) {
    return {
      reply: "I'm not sure which specialist you need based on your message. Could you describe your symptoms in more detail? For example: fever, tooth pain, joint pain, skin rash, etc.",
      suggestedSpecialization: null,
      urgency: 'normal',
      doctors: [],
      quickReplies: ['Fever', 'Tooth Pain', 'Joint Pain', 'Skin Problem', 'Chest Pain', 'Child Health', 'Eye Problem', 'Women Health']
    };
  }

  /* 3. Fetch doctors */
  const doctors = await fetchTopDoctors(city, match.speciality);

  const cityNote = city
    ? ` I've found doctors in ${city} for you below.`
    : ' Tell me your city and I can suggest available doctors near you.';

  return {
    reply: `${match.reply}${cityNote}\n\n⚠️ Disclaimer: This is basic guidance only. For emergencies or persistent symptoms, consult a doctor immediately.`,
    suggestedSpecialization: match.speciality,
    urgency: 'normal',
    doctors,
    quickReplies: []
  };
};

module.exports = { processMessage, isEmergency, detectSpeciality };
