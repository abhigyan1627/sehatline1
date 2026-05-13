const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    scheduledAt: { type: Date, required: true, index: true },
    symptoms: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
      index: true
    },
    source: { type: String, enum: ['demo', 'google_places'], default: 'demo' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

appointmentSchema.index({ patient: 1, scheduledAt: -1 });
appointmentSchema.index({ doctor: 1, scheduledAt: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
