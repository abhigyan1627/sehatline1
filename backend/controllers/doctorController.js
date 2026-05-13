const Doctor = require('../models/Doctor');
const User = require('../models/User');

const DEPARTMENTS = [
  'General Physician', 'Dentist', 'Orthopedic', 'Cardiologist',
  'Pediatrician', 'Gynecologist', 'Dermatologist', 'ENT',
  'Eye Specialist', 'Neurologist'
];

const ALLOWED_UPDATE_FIELDS = [
  'displayName', 'phone', 'clinicName', 'address', 'city', 'state',
  'consultationFee', 'averageConsultationTime', 'availableDays',
  'availableTimeStart', 'availableTimeEnd', 'aboutDoctor', 'profileImage',
  'emergencyAvailable', 'languages', 'services', 'website',
  'availableToday', 'isAvailable', 'qualification'
];

/* GET /api/doctors — all filters, isVisible=true, deduped, sorted */
const getDoctors = async (req, res, next) => {
  try {
    const filter = { isVisible: true };

    if (req.query.city)  filter.city  = { $regex: new RegExp(`^${req.query.city.trim()}$`, 'i') };
    if (req.query.state) filter.state = { $regex: new RegExp(`^${req.query.state.trim()}$`, 'i') };

    const spec = req.query.specialization || req.query.speciality || req.query.spec;
    if (spec) {
      /* partial-match so "Dentist" matches "Dentist", "Dental", etc. */
      filter.speciality = { $regex: new RegExp(spec.trim(), 'i') };
    }

    if (req.query.availableToday === 'true') filter.availableToday = true;

    const raw = await Doctor.find(filter)
      .select('-documents -verificationNotes -__v')
      /* verified first, then rating desc, then newest */
      .sort({ verified: -1, rating: -1, createdAt: -1 })
      .lean();

    /* Deduplicate by displayName + city — guards against duplicate seed runs */
    const seen = new Set();
    const doctors = raw.filter((d) => {
      const key = `${(d.displayName || '').toLowerCase()}|${(d.city || '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return res.json({ doctors, departments: DEPARTMENTS });
  } catch (error) {
    return next(error);
  }
};

/* GET /api/doctors/departments */
const getDepartments = async (req, res) => res.json({ departments: DEPARTMENTS });

/* GET /api/doctors/demo-logins */
const getDemoLogins = async (req, res, next) => {
  try {
    const demoUsers = await User.find({ email: /@demo\.com$/ })
      .select('name email role').sort({ role: 1, email: 1 }).lean();
    const demoProfiles = await Doctor.find({ onboardingStatus: 'demo' })
      .select('displayName speciality city email').lean();
    const profilesByEmail = {};
    demoProfiles.forEach((d) => { profilesByEmail[d.email] = d._id; });
    const rows = demoUsers.map((u) => ({
      role: u.role, name: u.name, email: u.email, password: '123456',
      doctorProfileId: profilesByEmail[u.email] || null
    }));
    return res.json({ credentials: rows, note: 'All demo accounts use password: 123456' });
  } catch (error) {
    return next(error);
  }
};

/* GET /api/doctors/me — logged-in doctor's own profile */
const getMe = async (req, res, next) => {
  try {
    const profile = await Doctor.findOne({ user: req.user._id })
      .select('-documents -verificationNotes -__v').lean();
    if (!profile) return res.status(404).json({ message: 'Doctor profile not found. Complete your registration.' });
    return res.json({ doctor: profile });
  } catch (error) {
    return next(error);
  }
};

/* PUT /api/doctors/me — doctor updates own profile */
const updateMe = async (req, res, next) => {
  try {
    const updates = {};
    ALLOWED_UPDATE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    /* profileImageUrl alias */
    if (req.body.profileImageUrl !== undefined) updates.profileImage = req.body.profileImageUrl;
    /* clinicAddress alias */
    if (req.body.clinicAddress !== undefined) updates.address = req.body.clinicAddress;

    const profile = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-documents -verificationNotes -__v');

    if (!profile) return res.status(404).json({ message: 'Doctor profile not found.' });
    return res.json({ doctor: profile, message: 'Profile updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

/* GET /api/doctors/:id */
const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .select('-documents -verificationNotes -__v').lean();
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    return res.json({ doctor });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getDoctors, getDoctorById, getDepartments, getDemoLogins, getMe, updateMe };
