/**
 * SehatLine AI Health Assistant — chatbot.js
 * Rule-based, no paid AI API. MVP.
 */
(() => {
  const API_BASE = (window.SL && window.SL.API_BASE) || 'https://sehatline1.onrender.com';

  const CITIES = {
    Bihar:       ['Patna', 'Gaya', 'Muzaffarpur', 'Siwan', 'Chhapra', 'Gopalganj'],
    Uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani', 'Rishikesh'],
    Gujarat:     ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot']
  };

  const ALL_CITIES = Object.values(CITIES).flat();

  const QUICK_REPLIES = [
    'Fever', 'Tooth Pain', 'Joint Pain', 'Skin Problem',
    'Chest Pain', 'Child Health', 'Eye Problem', 'Women Health'
  ];

  /* ── Build widget HTML ────────────────────────────── */
  const buildWidget = () => {
    const cityOptions = ALL_CITIES.map((c) => `<option value="${c}">${c}</option>`).join('');

    const html = `
<button class="chatbot-fab" id="chatbotFab" type="button" aria-label="Open AI Health Assistant">
  <span class="fab-icon">🩺</span>
  <span>Ask SehatLine AI</span>
  <span class="fab-pulse"></span>
</button>

<div class="chatbot-window" id="chatbotWindow" role="dialog" aria-modal="true" aria-label="SehatLine AI Health Assistant">
  <div class="chatbot-header">
    <div class="chatbot-header-avatar">🤖</div>
    <div class="chatbot-header-info">
      <strong>SehatLine AI Assistant</strong>
      <span>🟢 Online · Basic health guidance</span>
    </div>
    <button class="chatbot-close-btn" id="chatbotClose" type="button" aria-label="Close">✕</button>
  </div>

  <div class="chatbot-disclaimer">
    ⚠️ SehatLine AI Assistant gives basic guidance only. For emergencies or serious symptoms, contact a doctor immediately.
  </div>

  <div class="chatbot-city-bar">
    <label for="chatbotCity">📍 Your city:</label>
    <select id="chatbotCity">
      <option value="">Select city</option>
      ${cityOptions}
    </select>
  </div>

  <div class="chatbot-messages" id="chatbotMessages"></div>

  <div class="chatbot-input-area">
    <input
      class="chatbot-input" id="chatbotInput" type="text"
      placeholder="Describe your symptoms…" autocomplete="off"
      maxlength="400" aria-label="Type your health question"
    />
    <button class="chatbot-send-btn" id="chatbotSend" type="button" aria-label="Send">➤</button>
  </div>
</div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
  };

  /* ── DOM refs ─────────────────────────────────────── */
  let fab, win, closeBtn, messagesEl, inputEl, sendBtn, citySelect;

  const init = () => {
    fab        = document.getElementById('chatbotFab');
    win        = document.getElementById('chatbotWindow');
    closeBtn   = document.getElementById('chatbotClose');
    messagesEl = document.getElementById('chatbotMessages');
    inputEl    = document.getElementById('chatbotInput');
    sendBtn    = document.getElementById('chatbotSend');
    citySelect = document.getElementById('chatbotCity');

    fab.addEventListener('click', openChat);
    closeBtn.addEventListener('click', closeChat);
    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });

    /* Show welcome message */
    addBotMessage(
      "👋 Hello! I'm the SehatLine AI Health Assistant.\n\nTell me what you're feeling and I'll suggest the right specialist. You can also select your city to see available doctors near you.",
      QUICK_REPLIES
    );
  };

  /* ── Open / close ─────────────────────────────────── */
  const openChat = () => {
    win.classList.add('open');
    fab.style.display = 'none';
    inputEl.focus();
  };

  const closeChat = () => {
    win.classList.remove('open');
    fab.style.display = 'flex';
  };

  /* ── Message rendering ────────────────────────────── */
  const scrollToBottom = () => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const addUserMessage = (text) => {
    const el = document.createElement('div');
    el.className = 'chat-msg user';
    el.innerHTML = `
      <div class="chat-bubble">${escHtml(text)}</div>
      <div class="chat-avatar" style="background:linear-gradient(135deg,#059669,#0f6fff);">U</div>`;
    messagesEl.appendChild(el);
    scrollToBottom();
  };

  const addBotMessage = (text, quickReplies = [], doctors = [], isEmergency = false) => {
    const el = document.createElement('div');
    el.className = 'chat-msg bot';

    const bubbleClass = `chat-bubble${isEmergency ? ' emergency' : ''}`;
    const formatted   = escHtml(text).replace(/\n/g, '<br/>');

    let inner = `
      <div class="chat-avatar">AI</div>
      <div>
        <div class="${bubbleClass}">${formatted}</div>`;

    if (quickReplies && quickReplies.length) {
      inner += `<div class="quick-replies">${quickReplies.map((q) =>
        `<button class="quick-btn" type="button" data-q="${escAttr(q)}">${escHtml(q)}</button>`
      ).join('')}</div>`;
    }

    if (doctors && doctors.length) {
      inner += `<div class="chat-doctor-cards">${doctors.map((d) => buildDocCard(d)).join('')}</div>`;
    }

    inner += `</div>`;
    el.innerHTML = inner;

    /* Quick reply click */
    el.querySelectorAll('.quick-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        inputEl.value = btn.dataset.q;
        handleSend();
      });
    });

    /* Book button click */
    el.querySelectorAll('.chat-doc-book').forEach((btn) => {
      btn.addEventListener('click', () => openBookingForDoctor(btn.dataset));
    });

    messagesEl.appendChild(el);
    scrollToBottom();
  };

  const addTypingIndicator = () => {
    const el = document.createElement('div');
    el.className = 'chat-msg bot';
    el.id = 'chatTyping';
    el.innerHTML = `
      <div class="chat-avatar">AI</div>
      <div class="chat-bubble" style="padding:10px 16px;">
        <div class="typing-dots"><span></span><span></span><span></span></div>
      </div>`;
    messagesEl.appendChild(el);
    scrollToBottom();
    return el;
  };

  const removeTypingIndicator = () => {
    const el = document.getElementById('chatTyping');
    if (el) el.remove();
  };

  /* ── Doctor card HTML ─────────────────────────────── */
  const buildDocCard = (d) => {
    const img = d.profileImage
      ? d.profileImage
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(d.displayName)}&background=0f6fff&color=fff&size=80`;
    const verified = d.verified
      ? '<span style="color:#059669;font-size:0.7rem;font-weight:700;">✅ Verified</span>'
      : '<span style="color:#b45309;font-size:0.7rem;font-weight:700;">Demo</span>';
    const avail = d.availableToday
      ? '<span style="color:#059669;">Available today</span>'
      : '';

    return `
    <div class="chat-doc-card">
      <img src="${escAttr(img)}" alt="${escAttr(d.displayName)}" onerror="this.src='https://ui-avatars.com/api/?name=Dr&background=0f6fff&color=fff&size=80'" />
      <div class="chat-doc-info">
        <strong>${escHtml(d.displayName)}</strong>
        <div class="doc-spec">${escHtml(d.speciality)}${d.qualification ? ' · ' + escHtml(d.qualification) : ''}</div>
        <div class="doc-meta">
          <span>⭐ ${d.rating || '4.8'}</span>
          <span>₹${d.consultationFee || 0}</span>
          <span>${escHtml(d.city || '')}</span>
          ${avail ? `<span>${avail}</span>` : ''}
          ${verified}
        </div>
        <div class="doc-meta" style="margin-top:2px;">${escHtml(d.clinicName || '')}</div>
      </div>
      <button class="chat-doc-book"
        data-docid="${escAttr(String(d._id))}"
        data-docname="${escAttr(d.displayName)}"
        data-doccity="${escAttr(d.city || '')}"
        data-docspec="${escAttr(d.speciality)}"
        type="button">Book</button>
    </div>`;
  };

  /* ── Open booking modal with doctor pre-filled ────── */
  const openBookingForDoctor = (dataset) => {
    /* Set selectedDoctorId for the booking form */
    if (typeof window.selectedDoctorId !== 'undefined') {
      window.selectedDoctorId = dataset.docid;
    }

    /* Try to use global booking modal on the page */
    const bookingModal = document.getElementById('bookingModal');
    const bookingTitle = document.getElementById('bookingTitle');
    const bookingClinicMeta = document.getElementById('bookingClinicMeta');
    const bookingToken = document.getElementById('bookingToken');

    if (bookingModal) {
      if (bookingTitle)     bookingTitle.textContent = `Book with ${dataset.docname}`;
      if (bookingClinicMeta) bookingClinicMeta.textContent = `${dataset.doccity} · ${dataset.docspec}`;
      if (bookingToken)     { bookingToken.textContent = ''; bookingToken.classList.remove('active'); }
      bookingModal.classList.add('active');
      bookingModal.setAttribute('aria-hidden', 'false');
      closeChat();
    } else {
      /* Fallback: redirect to patient dashboard with doctor query */
      window.location.href = `patient-dashboard.html?doctorId=${encodeURIComponent(dataset.docid)}&doctorName=${encodeURIComponent(dataset.docname)}`;
    }
  };

  /* ── Send handler ─────────────────────────────────── */
  const handleSend = async () => {
    const message = inputEl.value.trim();
    if (!message) return;

    inputEl.value = '';
    sendBtn.disabled = true;
    addUserMessage(message);

    const typingEl = addTypingIndicator();

    try {
      const city = citySelect ? citySelect.value : '';
      const res  = await fetch(`${API_BASE}/api/chatbot/message`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message, city })
      });

      removeTypingIndicator();

      if (!res.ok) {
        addBotMessage("I'm having trouble connecting right now. Please check that the backend is running.");
        return;
      }

      const data = await res.json();
      const isEmerg = data.urgency === 'emergency';

      addBotMessage(
        data.reply,
        data.quickReplies || [],
        data.doctors      || [],
        isEmerg
      );

      /* If no doctors returned but speciality detected, suggest city selection */
      if (data.suggestedSpecialization && (!data.doctors || !data.doctors.length) && !city && !isEmerg) {
        setTimeout(() => {
          addBotMessage(`Select your city above to see available ${data.suggestedSpecialization}s near you. 📍`);
        }, 600);
      }
    } catch {
      removeTypingIndicator();
      addBotMessage("I can't reach the server right now. Please make sure the backend is running on port 5000.");
    } finally {
      sendBtn.disabled = false;
      inputEl.focus();
    }
  };

  /* ── Utils ────────────────────────────────────────── */
  const escHtml = (str) => String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const escAttr = escHtml;

  /* ── Boot ─────────────────────────────────────────── */
  const boot = () => {
    buildWidget();
    init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
