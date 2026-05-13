const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema(
  {
    placeId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    address: { type: String, default: '' },
    rating: { type: Number, default: null },
    totalReviews: { type: Number, default: 0 },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    mapsUrl: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    openingHours: { type: [String], default: [] },
    openNow: { type: Boolean, default: null },
    source: { type: String, enum: ['google_places'], default: 'google_places' },
    lastFetchedAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

clinicSchema.index({ city: 1, category: 1, lastFetchedAt: -1 });
clinicSchema.index({ placeId: 1, category: 1, city: 1 }, { unique: true });

module.exports = mongoose.model('Clinic', clinicSchema);
