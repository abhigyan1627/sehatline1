const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    tokenNumber: { type: Number, required: true },
    currentToken: { type: Number, default: 0 },
    estimatedWaitMinutes: { type: Number, default: 0 },
    emergencyDelayMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['waiting', 'called', 'in_consultation', 'completed', 'skipped', 'cancelled'],
      default: 'waiting',
      index: true
    },
    queueDate: { type: Date, required: true, index: true },
    calledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

queueSchema.index({ doctor: 1, queueDate: 1, tokenNumber: 1 }, { unique: true });

module.exports = mongoose.model('Queue', queueSchema);
