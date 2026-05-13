const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { signAccessToken } = require('../utils/jwt');

const register = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = String(req.body.role || 'patient').trim();
    const phone = String(req.body.phone || '').trim();
    const city = String(req.body.city || '').trim();
    const state = String(req.body.state || '').trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (!['patient', 'doctor', 'receptionist', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const user = await User.create({ name, email, password, role, phone });

    if (role === 'doctor') {
      const speciality = String(req.body.specialization || req.body.speciality || 'General Physician').trim();
      const rawDays = req.body.availableDays;
      const availableDays = Array.isArray(rawDays)
        ? rawDays
        : typeof rawDays === 'string'
          ? rawDays.split(',').map((d) => d.trim()).filter(Boolean)
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      await Doctor.create({
        user:                    user._id,
        displayName:             name,
        email,
        phone,
        speciality,
        qualification:           String(req.body.qualification || '').trim(),
        qualifications:          req.body.qualification ? [req.body.qualification] : [],
        experienceYears:         Number(req.body.experienceYears || 0),
        consultationFee:         Number(req.body.consultationFee || 0),
        averageConsultationTime: Number(req.body.averageConsultationTime || 8),
        clinicName:              String(req.body.clinicName || '').trim(),
        address:                 String(req.body.clinicAddress || req.body.address || '').trim(),
        city,
        state,
        aboutDoctor:             String(req.body.aboutDoctor || '').trim(),
        profileImage:            String(req.body.profileImageUrl || req.body.profileImage || '').trim(),
        registrationNumber:      String(req.body.registrationNumber || '').trim(),
        website:                 String(req.body.website || '').trim(),
        emergencyAvailable:      Boolean(req.body.emergencyAvailable),
        availableDays,
        availableTimeStart:      String(req.body.availableTimeStart || '09:00'),
        availableTimeEnd:        String(req.body.availableTimeEnd || '18:00'),
        languages:               Array.isArray(req.body.languages) ? req.body.languages : ['Hindi', 'English'],
        services:                Array.isArray(req.body.services) ? req.body.services : [],
        isAvailable:             true,
        availableToday:          true,
        isVisible:               true,
        verificationStatus:      'pending',
        onboardingStatus:        'registered'
      });
    }

    return res.status(201).json({
      token: signAccessToken(user),
      user: user.toSafeObject()
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This account is disabled.' });
    }

    return res.json({
      token: signAccessToken(user),
      user: user.toSafeObject()
    });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};

module.exports = { register, login, me };
