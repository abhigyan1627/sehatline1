/**
 * chatbotService.js
 * GPT-4o powered health assistant with rule-based fallback.
 * No diagnosis claims. Always recommends a doctor.
 */
const https = require('https');
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

/* ─── OpenAI GPT-4o call ─────────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are SehatLine AI Health Assistant — a helpful, empathetic healthcare assistant for an Indian healthcare platform.
Your job:
1. Listen to the patient's symptoms or health concern.
2. Suggest the most relevant medical specialist (e.g. Cardiologist, Dentist, General Physician, etc.).
3. Give a brief, clear, friendly explanation in 2-3 sentences. Do NOT diagnose.
4. Always end with a recommendation to consult a doctor.
5. If the user writes in Hinglish or Hindi, respond in simple English.
6. Keep replies concise (max 4 sentences).
7. Return a JSON object with these fields:
   - reply: string (your response to the patient)
   - suggestedSpecialization: string (specialist name) or null
   - urgency: "emergency" | "urgent" | "normal"
Only return valid JSON. No markdown, no code blocks.`;

const callOpenAI = (message, city) => new Promise((resolve, reject) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return reject(new Error('OPENAI_API_KEY not set'));

  const userContent = city
    ? `Patient location: ${city}\nPatient message: ${message}`
    : `Patient message: ${message}`;

  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent }
    ],
    temperature: 0.4,
    max_tokens: 300
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) return reject(new Error(parsed.error.message));
        const content = parsed.choices?.[0]?.message?.content || '';
        const result = JSON.parse(content);
        resolve(result);
      } catch (e) {
        reject(new Error('Failed to parse OpenAI response'));
      }
    });
  });

  req.on('error', reject);
  req.write(body);
  req.end();
});

/* ─── Main function ─────────────────────────────────────────────────── */
const processMessage = async ({ message, city }) => {
  const text = String(message || '').trim();

  /* 1. Emergency check — always rule-based for safety */
  if (isEmergency(text)) {
    return {
      reply: '🚨 This sounds like a medical emergency. Please call emergency services (112) or go to the nearest hospital IMMEDIATELY. Do not wait.',
      suggestedSpecialization: 'Emergency',
      urgency: 'emergency',
      doctors: [],
      quickReplies: []
    };
  }

  /* 2. Try OpenAI GPT-4o */
  let aiReply = null;
  let suggestedSpecialization = null;
  let urgency = 'normal';

  if (process.env.OPENAI_API_KEY) {
    try {
      const aiResult = await callOpenAI(text, city);
      aiReply = aiResult.reply || null;
      suggestedSpecialization = aiResult.suggestedSpecialization || null;
      urgency = aiResult.urgency || 'normal';
    } catch (err) {
      console.error('OpenAI fallback to rule-based:', err.message);
    }
  }

  /* 3. Rule-based fallback if OpenAI failed or key missing */
  if (!aiReply) {
    const match = detectSpeciality(text);
    if (!match) {
      return {
        reply: "I'm not sure which specialist you need. Could you describe your symptoms in more detail? For example: fever, tooth pain, joint pain, skin rash, etc.",
        suggestedSpecialization: null,
        urgency: 'normal',
        doctors: [],
        quickReplies: ['Fever', 'Tooth Pain', 'Joint Pain', 'Skin Problem', 'Chest Pain', 'Child Health', 'Eye Problem', 'Women Health']
      };
    }
    aiReply = match.reply;
    suggestedSpecialization = match.speciality;
  }

  /* 4. Fetch top doctors for suggested speciality */
  const doctors = await fetchTopDoctors(city, suggestedSpecialization);

  const cityNote = city && doctors.length
    ? ` I've found available doctors in ${city} for you below.`
    : !city ? ' Share your city and I can suggest nearby doctors.' : '';

  return {
    reply: `${aiReply}${cityNote}\n\n⚠️ Disclaimer: This is guidance only, not a medical diagnosis. Always consult a qualified doctor.`,
    suggestedSpecialization,
    urgency,
    doctors,
    quickReplies: []
  };
};

module.exports = { processMessage, isEmergency, detectSpeciality };
