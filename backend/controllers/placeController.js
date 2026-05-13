const Clinic = require('../models/Clinic');
const {
  fetchClinicsFromGoogle,
  getStateForCity,
  normalizeSpeciality,
  specialityLabels,
  isGoogleKeyValid
} = require('../services/googlePlacesService');

const CACHE_DAYS = 7;
const CACHE_MAX_AGE_MS = CACHE_DAYS * 24 * 60 * 60 * 1000;

const getClinics = async (req, res, next) => {
  try {
    const city = String(req.query.city || '').trim();
    const speciality = String(req.query.speciality || 'general').trim();
    const minRating = Number(req.query.rating || 0);
    const openNow = String(req.query.openNow || '').toLowerCase() === 'true';

    if (!city) {
      return res.status(400).json({ message: 'city is required' });
    }

    const state = getStateForCity(city);
    if (!state) {
      return res.status(400).json({ message: 'Unsupported city for SehatLine availability.' });
    }

    const specialityKey = normalizeSpeciality(speciality);
    const category = specialityLabels[specialityKey] || speciality;
    const freshAfter = new Date(Date.now() - CACHE_MAX_AGE_MS);
    const baseQuery = { city, category, source: 'google_places' };

    /* ── Skip Google entirely when API key is missing / placeholder ── */
    if (!isGoogleKeyValid()) {
      return res.json({
        demoMode: true,
        attribution: 'Google Places disabled — demo mode active',
        city,
        state,
        speciality: category,
        count: 0,
        clinics: []
      });
    }

    const cachedCount = await Clinic.countDocuments({ ...baseQuery, lastFetchedAt: { $gte: freshAfter } });

    if (cachedCount < 20) {
      const clinics = await fetchClinicsFromGoogle({ city, speciality: specialityKey });
      await Promise.all(
        clinics.map((clinic) =>
          Clinic.findOneAndUpdate(
            { placeId: clinic.placeId, category: clinic.category, city: clinic.city },
            { $set: clinic },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
        )
      );
    }

    const filters = { ...baseQuery };
    if (minRating > 0) filters.rating = { $gte: minRating };
    if (openNow) filters.openNow = true;

    const results = await Clinic.find(filters)
      .sort({ rating: -1, totalReviews: -1, name: 1 })
      .limit(30)
      .lean();

    return res.json({
      attribution: 'Clinic data powered by Google Maps',
      city,
      state,
      speciality: category,
      count: results.length,
      cached: cachedCount >= 20,
      clinics: results
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getClinics };
