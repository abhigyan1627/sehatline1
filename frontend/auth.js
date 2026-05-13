const API_BASE = 'http://localhost:5000';

const ROLE_DASHBOARD = {
  patient: 'patient-dashboard.html',
  doctor: 'doctor-dashboard.html',
  receptionist: 'receptionist-dashboard.html',
  admin: 'admin-dashboard.html'
};

const getToken = () => localStorage.getItem('sl_token');
const getUser = () => { try { return JSON.parse(localStorage.getItem('sl_user') || 'null'); } catch { return null; } };

const saveSession = (token, user) => {
  localStorage.setItem('sl_token', token);
  localStorage.setItem('sl_user', JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem('sl_token');
  localStorage.removeItem('sl_user');
};

const redirectByRole = (role) => {
  window.location.href = ROLE_DASHBOARD[role] || 'index.html';
};

const requireAuth = (allowedRoles = []) => {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = 'index.html';
    return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    window.location.href = ROLE_DASHBOARD[user.role] || 'index.html';
    return null;
  }
  return user;
};

const authFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (res.status === 401) { clearSession(); window.location.href = 'index.html'; return null; }
  return res;
};

const applyNavAuth = () => {
  const user = getUser();
  const loginBtn = document.querySelector('#navLoginBtn');
  const signupBtn = document.querySelector('#navSignupBtn');
  const logoutBtn = document.querySelector('#navLogoutBtn');
  const dashBtn = document.querySelector('#navDashboardBtn');
  const userLabel = document.querySelector('#navUserLabel');

  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (dashBtn) { dashBtn.style.display = 'inline-flex'; dashBtn.href = ROLE_DASHBOARD[user.role] || '#'; }
    if (userLabel) { userLabel.textContent = `${user.name} (${user.role})`; userLabel.style.display = 'inline'; }
  } else {
    if (loginBtn) loginBtn.style.display = 'inline';
    if (signupBtn) signupBtn.style.display = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (dashBtn) dashBtn.style.display = 'none';
    if (userLabel) userLabel.style.display = 'none';
  }
};

const logout = () => { clearSession(); window.location.href = 'index.html'; };

window.SL = { API_BASE, getToken, getUser, saveSession, clearSession, redirectByRole, requireAuth, authFetch, applyNavAuth, logout, ROLE_DASHBOARD };
