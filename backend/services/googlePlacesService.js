const TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo';

const specialityQueries = {
  general: 'general physician clinic',
  orthopedic: 'orthopedic doctor',
  dental: 'dentist clinic',
  cardiology: 'cardiology hospital',
  pediatric: 'children hospital pediatrician',
  gynecology: 'gynecology clinic',
  dermatology: 'skin clinic dermatologist',
  ent: 'ENT clinic',
  eye: 'eye hospital',
  neurology: 'neurology clinic'
};

const specialityLabels = {
  general: 'General Physician Clinic',
  orthopedic: 'Orthopedic Clinic',
  dental: 'Dental Clinic',
  cardiology: 'Heart Clinic / Cardiology Hospital',
  pediatric: 'Children Hospital / Pediatrician',
  gynecology: 'Gynecology Clinic',
  dermatology: 'Skin Clinic / Dermatologist',
  ent: 'ENT Clinic',
  eye: 'Eye Hospital',
  neurology: 'Neurology Clinic'
};

const supportedStates = {
  Bihar: ['Patna', 'Gaya', 'Muzaffarpur', 'Siwan', 'Chhapra', 'Gopalganj'],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani', 'Rishikesh'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot']
};

const getStateForCity = (city) => {
  const normalizedCity = city.trim().toLowerCase();
  return Object.entries(supportedStates).find(([, cities]) =>
    cities.some((item) => item.toLowerCase() === normalizedCity)
  )?.[0];
};

const normalizeSpeciality = (speciality = '') => {
  const value = speciality.trim().toLowerCase();
  const aliases = {
    dentist: 'dental',
    dental: 'dental',
    orthopedic: 'orthopedic',
    orthopaedic: 'orthopedic',
    cardiologist: 'cardiology',
    cardiology: 'cardiology',
    heart: 'cardiology',
    physician: 'general',
    general: 'general',
    pediatrician: 'pediatric',
    pediatric: 'pediatric',
    children: 'pediatric',
    gynecology: 'gynecology',
    gynaecology: 'gynecology',
    dermatologist: 'dermatology',
    dermatology: 'dermatology',
    skin: 'dermatology',
    ent: 'ent',
    eye: 'eye',
    ophthalmology: 'eye',
    neurology: 'neurology',
    neurologist: 'neurology'
  };

  return aliases[value] || value || 'general';
};

const PLACEHOLDER_KEY = 'replace_with_your_google_places_api_key';

const isGoogleKeyValid = () => {
  const key = process.env.GOOGLE_PLACES_API_KEY || '';
  return key.length > 10 && key !== PLACEHOLDER_KEY;
};

const assertGoogleKey = () => {
  if (!isGoogleKeyValid()) {
    const error = new Error('GOOGLE_PLACES_API_KEY is not configured on the backend.');
    error.statusCode = 500;
    throw error;
  }
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || !['OK', 'ZERO_RESULTS'].includes(data.status)) {
    const error = new Error(data.error_message || `Google Places API failed with status ${data.status}`);
    error.statusCode = 502;
    throw error;
  }

  return data;
};

const buildPhotoUrl = (photoReference) => {
  if (!photoReference) return '';

  const params = new URLSearchParams({
    maxwidth: '900',
    photo_reference: photoReference,
    key: process.env.GOOGLE_PLACES_API_KEY
  });

  return `${PHOTO_URL}?${params.toString()}`;
};

const mapPlaceDetails = (details, city, state, category) => ({
  placeId: details.place_id,
  name: details.name,
  category,
  city,
  state,
  address: details.formatted_address || details.vicinity || '',
  rating: details.rating ?? null,
  totalReviews: details.user_ratings_total || 0,
  phone: details.formatted_phone_number || details.international_phone_number || '',
  website: details.website || '',
  mapsUrl: details.url || `https://www.google.com/maps/place/?q=place_id:${details.place_id}`,
  photoUrl: buildPhotoUrl(details.photos?.[0]?.photo_reference),
  latitude: details.geometry?.location?.lat ?? null,
  longitude: details.geometry?.location?.lng ?? null,
  openingHours: details.opening_hours?.weekday_text || [],
  openNow: details.opening_hours?.open_now ?? null,
  source: 'google_places',
  lastFetchedAt: new Date()
});

const fetchClinicsFromGoogle = async ({ city, speciality }) => {
  assertGoogleKey();

  const state = getStateForCity(city);
  if (!state) {
    const error = new Error('Unsupported city.');
    error.statusCode = 400;
    throw error;
  }

  const specialityKey = normalizeSpeciality(speciality);
  const queryBase = specialityQueries[specialityKey] || speciality;
  const category = specialityLabels[specialityKey] || speciality;
  const textSearchParams = new URLSearchParams({
    query: `${queryBase} in ${city}`,
    type: 'health',
    region: 'in',
    key: process.env.GOOGLE_PLACES_API_KEY
  });

  const searchData = await fetchJson(`${TEXT_SEARCH_URL}?${textSearchParams.toString()}`);
  const places = (searchData.results || []).slice(0, 30);

  const details = await Promise.all(
    places.map(async (place) => {
      const detailParams = new URLSearchParams({
        place_id: place.place_id,
        fields: 'place_id,name,formatted_address,rating,user_ratings_total,formatted_phone_number,international_phone_number,opening_hours,website,geometry,url,photos',
        key: process.env.GOOGLE_PLACES_API_KEY
      });

      const detailData = await fetchJson(`${DETAILS_URL}?${detailParams.toString()}`);
      return mapPlaceDetails(detailData.result, city, state, category);
    })
  );

  return details.filter((clinic) => clinic.placeId && clinic.name);
};

module.exports = {
  fetchClinicsFromGoogle,
  getStateForCity,
  normalizeSpeciality,
  specialityLabels,
  supportedStates,
  isGoogleKeyValid
};
