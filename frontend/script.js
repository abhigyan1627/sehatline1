console.log('SehatLine Frontend Loaded Successfully');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-menu a');
const searchForm = document.querySelector('.search-form');
const stateSelect = document.querySelector('#stateSelect');
const citySelect = document.querySelector('#citySelect');
const cityField = document.querySelector('.city-field');
const API_BASE_URL = 'https://sehatline-backend.onrender.com';
const clinicState = document.querySelector('#clinicState');
const clinicCity = document.querySelector('#clinicCity');
const clinicSpeciality = document.querySelector('#clinicSpeciality');
const clinicRating = document.querySelector('#clinicRating');
const clinicOpenNow = document.querySelector('#clinicOpenNow');
const clinicFilterForm = document.querySelector('.clinic-filter-form');
const clinicResults = document.querySelector('#clinicResults');
const clinicStateMessage = document.querySelector('#clinicStateMessage');
const bookingModal = document.querySelector('#bookingModal');
const bookingForm = document.querySelector('#bookingModal .booking-form');
const modalClose = document.querySelector('#bookingModal .modal-close');
const loginModal = document.querySelector('#loginModal');
const loginForm = document.querySelector('#loginForm');
const loginModalClose = document.querySelector('#loginModalClose');
const loginEmailInput = document.querySelector('#loginEmail');
const loginPasswordInput = document.querySelector('#loginPassword');
const loginError = document.querySelector('#loginError');
const loginSubmitBtn = document.querySelector('#loginSubmitBtn');
const navLoginBtn = document.querySelector('#navLoginBtn');
const navSignupBtn = document.querySelector('#navSignupBtn');
const navLogoutBtn = document.querySelector('#navLogoutBtn');
const navUserLabel = document.querySelector('#navUserLabel');
const bookingClinicMeta = document.querySelector('#bookingClinicMeta');
const bookingTitle = document.querySelector('#bookingTitle');
const bookingToken = document.querySelector('#bookingToken');
let selectedClinic = null;

/* ── Doctor section elements ── */
const docState      = document.querySelector('#docState');
const docCity       = document.querySelector('#docCity');
const docSpec       = document.querySelector('#docSpec');
const doctorFilterForm  = document.querySelector('#doctorFilterForm');
const doctorResults = document.querySelector('#doctorResults');
const doctorStateMsg = document.querySelector('#doctorStateMsg');
let selectedDoctorId = null;

const serviceCities = {
  Bihar: ['Patna', 'Gaya', 'Muzaffarpur', 'Siwan', 'Chhapra', 'Gopalganj'],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani', 'Rishikesh'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot']
};

const queueState = {
  currentToken: 24,
  yourToken: 31,
  waitTime: 28,
  activePatients: 18,
  completedConsults: 42,
  statusIndex: 0
};

const doctorStatuses = [
  'Consulting patient',
  'Reviewing reports',
  'Emergency priority active',
  'Consultation resumed'
];

const queueElements = {
  currentToken: document.querySelector('#currentToken'),
  yourToken: document.querySelector('#yourToken'),
  queuePosition: document.querySelector('#queuePosition'),
  waitTime: document.querySelector('#waitTime'),
  doctorStatus: document.querySelector('#doctorStatus'),
  dashboardToken: document.querySelector('#dashboardToken'),
  dashboardEta: document.querySelector('#dashboardEta'),
  activePatients: document.querySelector('#activePatients'),
  completedConsults: document.querySelector('#completedConsults'),
  analyticsBar: document.querySelector('#analyticsBar'),
  predictionBar: document.querySelector('#predictionBar'),
  flowBar: document.querySelector('#flowBar')
};

const setTextWithPop = (element, value) => {
  if (!element || element.textContent === String(value)) return;
  element.textContent = value;
  element.classList.remove('number-pop');
  void element.offsetWidth;
  element.classList.add('number-pop');
};

const formatToken = (token) => `A-${String(token).padStart(2, '0')}`;

const calculateEta = (minutes) => {
  const eta = new Date(Date.now() + minutes * 60000);
  return eta.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const renderCities = (state) => {
  cityField.classList.remove('switching');
  void cityField.offsetWidth;
  cityField.classList.add('switching');

  citySelect.innerHTML = serviceCities[state]
    .map((city) => `<option>${city}</option>`)
    .join('');
};

const renderClinicCities = (state) => {
  if (!clinicCity) return;
  clinicCity.innerHTML = serviceCities[state]
    .map((city) => `<option>${city}</option>`)
    .join('');
};

const renderSkeletons = () => {
  clinicResults.innerHTML = Array.from({ length: 6 }, () => '<div class="skeleton-card"></div>').join('');
  clinicStateMessage.textContent = 'Loading verified clinics from Google Places...';
};

const renderStateMessage = (className, message) => {
  clinicResults.innerHTML = `<div class="${className} glass-card">${message}</div>`;
  clinicStateMessage.textContent = '';
};

const getOpenStatus = (clinic) => {
  if (clinic.openNow === true) return 'Open now';
  if (clinic.openNow === false) return 'Closed now';
  return 'Hours unavailable';
};

const renderClinicCards = (clinics) => {
  if (!clinics.length) {
    renderStateMessage('empty-state', 'No clinics matched these filters. Try another speciality, city, or rating.');
    return;
  }

  clinicResults.innerHTML = clinics.map((clinic, index) => `
    <article class="clinic-card glass-card reveal active" data-index="${index}">
      <div class="clinic-photo">
        ${clinic.photoUrl ? `<img src="${clinic.photoUrl}" alt="${clinic.name}" loading="lazy" />` : '<span>Clinic Photo</span>'}
      </div>
      <div class="clinic-body">
        <h3>${clinic.name}</h3>
        <div class="clinic-category">${clinic.category}</div>
        <p class="clinic-address">${clinic.address || 'Address unavailable'}</p>
        <div class="clinic-meta">
          <span>⭐ ${clinic.rating || 'New'}</span>
          <span>${clinic.totalReviews || 0} reviews</span>
          <span>${getOpenStatus(clinic)}</span>
        </div>
        <div class="clinic-actions">
          <a class="btn btn-secondary" href="${clinic.phone ? `tel:${clinic.phone}` : '#clinics'}">Call</a>
          <a class="btn btn-secondary" href="${clinic.mapsUrl}" target="_blank" rel="noopener">Google Maps</a>
          <button class="btn btn-primary book-clinic" type="button" data-index="${index}">Book Appointment</button>
          <a class="btn btn-secondary" href="#smartqueue">Track Queue</a>
        </div>
      </div>
    </article>
  `).join('');

  window.currentClinics = clinics;
  clinicStateMessage.textContent = `Showing ${clinics.length} results · Clinic data powered by Google Maps`;
};

const renderDemoDoctorCards = (doctors) => {
  if (!doctors.length) {
    renderStateMessage('empty-state', 'No demo doctors found. Run <code>npm run seed:full-demo</code> on the backend.');
    return;
  }
  clinicResults.innerHTML = doctors.map((doc) => `
    <article class="clinic-card glass-card reveal active">
      <div class="clinic-photo">
        <img src="${doc.profileImage || ''}" alt="${doc.displayName}" loading="lazy"
          onerror="this.parentElement.innerHTML='<span style=\\'font-size:2.5rem;line-height:90px;text-align:center;display:block\\'>🩺</span>'" />
      </div>
      <div class="clinic-body">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
          <h3 style="margin:0;">${doc.displayName}</h3>
          <span style="background:rgba(245,158,11,0.15);color:#b45309;font-size:0.72rem;font-weight:800;padding:2px 8px;border-radius:999px;">Demo Doctor</span>
        </div>
        <div class="clinic-category">${doc.speciality}</div>
        <p class="clinic-address">${doc.clinicName || ''} · ${doc.city}, ${doc.state}</p>
        <div class="clinic-meta">
          <span>⭐ ${doc.rating || 'New'}</span>
          <span>${doc.experienceYears}y exp</span>
          <span>₹${doc.consultationFee} fee</span>
          <span style="color:${doc.availableToday ? '#087a5e' : '#b45309'};font-weight:700;">${doc.availableToday ? '✅ Available today' : '⚠️ Not today'}</span>
        </div>
        <div class="clinic-actions">
          <a class="btn btn-secondary" href="patient-dashboard.html">Book via Dashboard</a>
          <a class="btn btn-secondary" href="#smartqueue">Track Queue</a>
        </div>
      </div>
    </article>
  `).join('');
  clinicStateMessage.textContent = `Showing ${doctors.length} demo doctors · Real verified doctors will be added after onboarding`;
};

const loadDemoDoctors = async (city) => {
  try {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    const res = await fetch(`${API_BASE_URL}/api/doctors?${params.toString()}`);
    if (!res.ok) throw new Error('Doctor API error');
    const data = await res.json();
    renderDemoDoctorCards(data.doctors || []);
  } catch {
    renderStateMessage('error-state', 'Unable to load demo doctors. Make sure the backend is running.');
  }
};

const fetchClinics = async () => {
  if (!clinicResults) return;
  renderSkeletons();

  /* ── Step 1: Check if Google Places is active ── */
  let placesActive = false;
  try {
    const probeParams = new URLSearchParams({
      city: clinicCity.value || 'Patna',
      speciality: clinicSpeciality.value || 'general',
      rating: '0',
      openNow: 'false'
    });
    const probeRes = await fetch(`${API_BASE_URL}/api/places/clinics?${probeParams.toString()}`);
    const probeData = await probeRes.json();

    if (probeRes.ok && !probeData.demoMode) {
      /* Real Google Places data available */
      placesActive = true;
      renderClinicCards(probeData.clinics || []);
    }
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      renderStateMessage('error-state', 'Backend is offline. Start the backend with <code>npm run dev</code>.');
      return;
    }
  }

  /* ── Step 2: Demo mode — load from /api/doctors directly ── */
  if (!placesActive) {
    await loadDemoDoctors(clinicCity.value || '');
  }
};

const openBookingModal = (clinic) => {
  selectedClinic = clinic;
  bookingTitle.textContent = clinic.name;
  bookingClinicMeta.textContent = `${clinic.city} · ${clinic.category}`;
  bookingToken.classList.remove('active');
  bookingToken.textContent = '';
  bookingModal.classList.add('active');
  bookingModal.setAttribute('aria-hidden', 'false');
};

const closeBookingModal = () => {
  bookingModal.classList.remove('active');
  bookingModal.setAttribute('aria-hidden', 'true');
};

const generateBookingToken = () => {
  const token = `SL-${Math.floor(100 + Math.random() * 900)}`;
  const queuePosition = Math.floor(3 + Math.random() * 12);
  const estimatedWait = queuePosition * 5 + Math.floor(Math.random() * 8);
  bookingToken.innerHTML = `Booking confirmed for <strong>${selectedClinic.name}</strong><br />Token: ${token} · Queue position: ${queuePosition} · Estimated wait: ${estimatedWait} minutes`;
  bookingToken.classList.add('active');
};

const updateQueue = () => {
  const movement = Math.random() > 0.35 ? 1 : 0;
  queueState.currentToken = Math.min(queueState.yourToken, queueState.currentToken + movement);
  const position = Math.max(queueState.yourToken - queueState.currentToken, 0);
  queueState.waitTime = Math.max(position * 4 + Math.floor(Math.random() * 5), position === 0 ? 0 : 6);
  queueState.activePatients = Math.max(4, 18 - (queueState.currentToken - 24));
  queueState.completedConsults += movement;
  queueState.statusIndex = (queueState.statusIndex + 1) % doctorStatuses.length;

  setTextWithPop(queueElements.currentToken, formatToken(queueState.currentToken));
  setTextWithPop(queueElements.yourToken, formatToken(queueState.yourToken));
  setTextWithPop(queueElements.queuePosition, position);
  setTextWithPop(queueElements.waitTime, queueState.waitTime);
  setTextWithPop(queueElements.dashboardToken, formatToken(queueState.currentToken));
  setTextWithPop(queueElements.activePatients, queueState.activePatients);
  setTextWithPop(queueElements.completedConsults, queueState.completedConsults);
  setTextWithPop(queueElements.doctorStatus, doctorStatuses[queueState.statusIndex]);

  if (queueElements.dashboardEta) {
    queueElements.dashboardEta.textContent = `Your token ${formatToken(queueState.yourToken)} · ETA ${calculateEta(queueState.waitTime)}`;
  }

  queueElements.analyticsBar?.style.setProperty('--w', `${Math.min(92, 44 + position * 6)}%`);
  queueElements.predictionBar?.style.setProperty('--w', `${Math.max(30, 90 - queueState.waitTime)}%`);
  queueElements.flowBar?.style.setProperty('--w', `${Math.min(94, 46 + (queueState.completedConsults % 38))}%`);
};

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('active');
    document.body.classList.toggle('nav-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.14,
    rootMargin: '0px 0px -40px 0px'
  }
);

revealElements.forEach((element) => revealObserver.observe(element));

stateSelect?.addEventListener('change', (event) => {
  renderCities(event.target.value);
});

clinicState?.addEventListener('change', (event) => {
  renderClinicCities(event.target.value);
  fetchClinics();
});

clinicFilterForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  fetchClinics();
});

clinicResults?.addEventListener('click', (event) => {
  const button = event.target.closest('.book-clinic');
  if (!button) return;
  openBookingModal(window.currentClinics[Number(button.dataset.index)]);
});

modalClose?.addEventListener('click', closeBookingModal);

bookingModal?.addEventListener('click', (event) => {
  if (event.target === bookingModal) closeBookingModal();
});

bookingForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitBtn = bookingForm.querySelector('button[type="submit"]');
  const origText  = submitBtn.textContent;
  submitBtn.textContent = 'Booking...';
  submitBtn.disabled = true;

  const user = SL.getUser();
  if (!user) {
    submitBtn.textContent = origText;
    submitBtn.disabled = false;
    closeBookingModal();
    openLoginModal();
    return;
  }

  try {
    const doctorId   = selectedDoctorId;
    const date       = document.querySelector('#preferredDate')?.value;
    const time       = document.querySelector('#preferredTime')?.value;
    const symptoms   = document.querySelector('#symptoms')?.value || '';
    const scheduledAt = date && time ? new Date(`${date}T${time}`) : new Date();

    const res = await SL.authFetch('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ doctorId, scheduledAt, symptoms, source: 'website' })
    });

    if (!res) return;
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Booking failed');

    const token = data.queue?.tokenNumber || data.appointment?.tokenNumber || '—';
    const wait  = data.queue?.estimatedWaitMinutes ?? '—';
    bookingToken.innerHTML = `
      <strong style="display:block;font-size:1.05rem;margin-bottom:4px;">Booking confirmed!</strong>
      Token <strong>#${token}</strong> · Est. wait <strong>${wait} min</strong><br/>
      <span style="font-size:0.82rem;color:var(--muted);">Check your dashboard for live queue updates.</span>`;
    bookingToken.classList.add('active');
  } catch (err) {
    bookingToken.innerHTML = `<span style="color:#c0392b;">${err.message}</span>`;
    bookingToken.classList.add('active');
  } finally {
    submitBtn.textContent = origText;
    submitBtn.disabled = false;
  }
});

searchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const button = searchForm.querySelector('button');
  const originalText = button.textContent;

  button.textContent = 'Searching...';
  button.disabled = true;

  window.setTimeout(() => {
    button.textContent = `${citySelect.value} Doctors Found`;

    window.setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1400);
  }, 900);
});

const openLoginModal = () => {
  loginError.style.display = 'none';
  loginError.textContent = '';
  loginForm.reset();
  loginModal.classList.add('active');
  loginModal.setAttribute('aria-hidden', 'false');
};

const closeLoginModal = () => {
  loginModal.classList.remove('active');
  loginModal.setAttribute('aria-hidden', 'true');
};

navLoginBtn?.addEventListener('click', (e) => { e.preventDefault(); openLoginModal(); });
loginModalClose?.addEventListener('click', closeLoginModal);
loginModal?.addEventListener('click', (e) => { if (e.target === loginModal) closeLoginModal(); });

navLogoutBtn?.addEventListener('click', () => { SL.logout(); });

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  loginSubmitBtn.textContent = 'Signing in...';
  loginSubmitBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmailInput.value.trim(), password: loginPasswordInput.value })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Login failed.');

    SL.saveSession(data.token, data.user);
    SL.applyNavAuth();
    closeLoginModal();
    SL.redirectByRole(data.user.role);
  } catch (err) {
    loginError.textContent = err.message;
    loginError.style.display = 'block';
  } finally {
    loginSubmitBtn.textContent = 'Login';
    loginSubmitBtn.disabled = false;
  }
});

/* ══════════════════════════════════════════════════════
   DOCTOR SECTION
══════════════════════════════════════════════════════ */
const populateDocCities = (state) => {
  if (!docCity) return;
  const map = {
    Bihar:       ['Patna', 'Gaya', 'Muzaffarpur', 'Siwan', 'Chhapra', 'Gopalganj'],
    Uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani', 'Rishikesh'],
    Gujarat:     ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot']
  };
  const cities = map[state] || [];
  docCity.innerHTML = '<option value="">All Cities</option>' +
    cities.map((c) => `<option>${c}</option>`).join('');
};

const renderDoctorCards = (doctors) => {
  if (!doctorResults) return;
  if (!doctors.length) {
    doctorResults.innerHTML = '<div class="empty-state glass-card">No doctors found for this filter. Try a different city or speciality.</div>';
    if (doctorStateMsg) doctorStateMsg.textContent = '';
    return;
  }
  doctorResults.innerHTML = doctors.map((doc) => {
    const isDemo     = doc.onboardingStatus === 'demo';
    const isVerified = doc.verified || doc.verificationStatus === 'verified';
    const badge      = isVerified
      ? '<span style="background:rgba(5,150,105,0.12);color:#065f46;font-size:0.7rem;font-weight:800;padding:2px 8px;border-radius:999px;">✅ Verified</span>'
      : isDemo
        ? '<span style="background:rgba(245,158,11,0.12);color:#92400e;font-size:0.7rem;font-weight:800;padding:2px 8px;border-radius:999px;">Demo Doctor</span>'
        : '<span style="background:rgba(99,102,241,0.1);color:#4338ca;font-size:0.7rem;font-weight:800;padding:2px 8px;border-radius:999px;">Pending Verification</span>';
    const avail = doc.availableToday
      ? '<span style="color:#059669;font-weight:700;font-size:0.78rem;">✅ Available today</span>'
      : '<span style="color:#b45309;font-weight:700;font-size:0.78rem;">Not today</span>';
    const timing = (doc.availableTimeStart && doc.availableTimeEnd)
      ? `${doc.availableTimeStart} – ${doc.availableTimeEnd}` : '9:00 – 18:00';
    const days = Array.isArray(doc.availableDays) && doc.availableDays.length
      ? doc.availableDays.join(', ') : 'Mon–Sat';
    const qual = doc.qualification || (doc.qualifications && doc.qualifications[0]) || '';
    return `
    <article class="doctor-card glass-card reveal active" data-docid="${doc._id}">
      <div class="doctor-photo" style="width:72px;height:72px;border-radius:50%;overflow:hidden;flex-shrink:0;margin-bottom:10px;">
        <img src="${doc.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.displayName)}&background=0f6fff&color=fff&size=128`}"
          alt="${doc.displayName}" style="width:100%;height:100%;object-fit:cover;"
          onerror="this.src='https://ui-avatars.com/api/?name=Dr&background=0f6fff&color=fff&size=128'" />
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:4px;">
        ${badge} ${avail}
      </div>
      <h3 style="margin:4px 0 2px;font-size:1rem;">${doc.displayName}</h3>
      <div style="color:var(--primary);font-weight:600;font-size:0.85rem;margin-bottom:2px;">${doc.speciality}</div>
      ${qual ? `<div style="color:var(--muted);font-size:0.78rem;margin-bottom:4px;">${qual}</div>` : ''}
      <div style="color:var(--muted);font-size:0.8rem;">${doc.clinicName || ''}</div>
      <div style="color:var(--muted);font-size:0.78rem;margin-bottom:8px;">${doc.address || doc.city}${doc.city && doc.state ? `, ${doc.state}` : ''}</div>
      <div class="doctor-meta" style="flex-wrap:wrap;gap:6px;margin-bottom:10px;">
        <span>⭐ ${doc.rating || '4.8'}</span>
        <span>${doc.experienceYears || 0}y exp</span>
        <span>₹${doc.consultationFee || 0} fee</span>
        <span>🕐 ${timing}</span>
        <span>📅 ${days}</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary book-doctor-btn" type="button" data-docid="${doc._id}" data-docname="${doc.displayName}" data-doccity="${doc.city || ''}" data-docspec="${doc.speciality}" style="font-size:0.82rem;padding:8px 14px;">Book Appointment</button>
        <a class="btn btn-secondary" href="#smartqueue" style="font-size:0.82rem;padding:8px 14px;">Track Queue</a>
      </div>
    </article>`;
  }).join('');
  if (doctorStateMsg) doctorStateMsg.textContent = `Showing ${doctors.length} doctor${doctors.length !== 1 ? 's' : ''}`;
};

const fetchDoctors = async () => {
  if (!doctorResults) return;
  doctorResults.innerHTML = Array.from({ length: 4 }, () => '<div class="skeleton-card"></div>').join('');
  if (doctorStateMsg) doctorStateMsg.textContent = 'Loading doctors...';

  try {
    const params = new URLSearchParams();
    if (docState && docState.value)  params.set('state', docState.value);
    if (docCity  && docCity.value)   params.set('city',  docCity.value);
    if (docSpec  && docSpec.value)   params.set('specialization', docSpec.value);

    const res  = await fetch(`${API_BASE_URL}/api/doctors?${params.toString()}`);
    const data = await res.json();
    renderDoctorCards(data.doctors || []);
  } catch {
    if (doctorResults) doctorResults.innerHTML = '<div class="empty-state glass-card">Could not load doctors. Make sure the backend is running.</div>';
  }
};

docState?.addEventListener('change', () => {
  populateDocCities(docState.value);
  fetchDoctors();
});

docCity?.addEventListener('change', fetchDoctors);

doctorFilterForm?.addEventListener('submit', (e) => { e.preventDefault(); fetchDoctors(); });

/* Book doctor button in doctor section — open booking modal with doctorId */
doctorResults?.addEventListener('click', (e) => {
  const btn = e.target.closest('.book-doctor-btn');
  if (!btn) return;
  selectedDoctorId = btn.dataset.docid;
  if (bookingTitle)     bookingTitle.textContent = `Book with ${btn.dataset.docname}`;
  if (bookingClinicMeta) bookingClinicMeta.textContent = `${btn.dataset.doccity} · ${btn.dataset.docspec}`;
  if (bookingToken)     { bookingToken.textContent = ''; bookingToken.classList.remove('active'); }
  if (bookingModal)     { bookingModal.classList.add('active'); bookingModal.setAttribute('aria-hidden', 'false'); }
});

/* ══════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════ */
SL.applyNavAuth();
renderCities(stateSelect?.value || 'Bihar');
renderClinicCities(clinicState?.value || 'Bihar');
fetchClinics();
fetchDoctors();
updateQueue();
window.setInterval(updateQueue, 10000);
