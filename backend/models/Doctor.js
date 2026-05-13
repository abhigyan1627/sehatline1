const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    /* ── Linked user account ── */
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    /* ── Core identity ── */
    displayName: { type: String, required: true, trim: true },
    email:       { type: String, default: '', trim: true, lowercase: true },
    phone:       { type: String, default: '' },

    /* ── Speciality / qualifications ── */
    speciality:              { type: String, required: true, trim: true, index: true },
    qualification:           { type: String, default: '' },
    qualifications:          { type: [String], default: [] },
    experienceYears:         { type: Number, default: 0 },
    registrationNumber:      { type: String, default: '' },
    languages:               { type: [String], default: ['Hindi', 'English'] },
    services:                { type: [String], default: [] },
    aboutDoctor:             { type: String, default: '' },

    /* ── Clinic / location ── */
    clinicName:    { type: String, default: '' },
    address:       { type: String, default: '' },
    city:          { type: String, default: '', index: true },
    state:         { type: String, default: '', index: true },
    website:       { type: String, default: '' },

    /* ── Fees & timing ── */
    consultationFee:          { type: Number, default: 0 },
    averageConsultationTime:  { type: Number, default: 8 },
    availableDays:            { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
    availableTimeStart:       { type: String, default: '09:00' },
    availableTimeEnd:         { type: String, default: '18:00' },
    emergencyAvailable:       { type: Boolean, default: false },

    /* ── Legacy availability array (kept for backward compat) ── */
    availability: [
      {
        day:       { type: String, required: true },
        startTime: { type: String, required: true },
        endTime:   { type: String, required: true }
      }
    ],
    availableToday: { type: Boolean, default: true },
    isAvailable:    { type: Boolean, default: true },

    /* ── Profile & ratings ── */
    rating:       { type: Number, default: 4.8 },
    totalReviews: { type: Number, default: 0 },
    profileImage: { type: String, default: '' },

    /* ── Visibility & verification ── */
    isVisible: { type: Boolean, default: true, index: true },
    verified:  { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true
    },
    onboardingStatus: {
      type: String,
      enum: ['demo', 'registered', 'under_review', 'approved', 'rejected'],
      default: 'registered',
      index: true
    },

    /* ── Admin ── */
    documents:         { type: [String], default: [] },
    verificationNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

doctorSchema.index({ speciality: 1, city: 1, isVisible: 1 });
doctorSchema.index({ verificationStatus: 1, isVisible: 1 });
doctorSchema.index({ state: 1, city: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
