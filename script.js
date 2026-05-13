const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-menu a');
const searchForm = document.querySelector('.search-form');
const stateSelect = document.querySelector('#stateSelect');
const citySelect = document.querySelector('#citySelect');
const cityField = document.querySelector('.city-field');
const alertClose = document.querySelector('.alert-close');
const floatingAlert = document.querySelector('#floatingAlert');

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

alertClose?.addEventListener('click', () => {
  floatingAlert.classList.add('hidden');
});

renderCities(stateSelect.value);
updateQueue();
window.setInterval(updateQueue, 10000);
