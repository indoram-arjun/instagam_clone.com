(function () {
  const API_BASE = 'http://localhost:5000';

  function getToken() {
    return localStorage.getItem('token');
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
      return null;
    }
  }

  function saveSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }

  function requireAuth() {
    if (!getToken()) {
      window.location.href = 'login.html';
      return false;
    }

    return true;
  }

  function imageUrl(value) {
    if (!value || value === 'default.jpg') {
      return '';
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    return value.startsWith('/') ? `${API_BASE}${value}` : `${API_BASE}/${value}`;
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function avatarLetter(username) {
    return escapeHTML(String(username || '?').trim().charAt(0) || '?');
  }

  function setMessage(element, text, type) {
    if (!element) {
      return;
    }

    element.textContent = text || '';
    element.classList.remove('error', 'success');

    if (type) {
      element.classList.add(type);
    }
  }

  async function request(path, options) {
    const config = options || {};
    const headers = { ...(config.headers || {}) };
    let body = config.body;

    if (config.auth !== false && getToken()) {
      headers.Authorization = `Bearer ${getToken()}`;
    }

    if (body && !(body instanceof FormData) && typeof body !== 'string') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...config,
      headers,
      body
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      if (response.status === 401 && config.auth !== false) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }

      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  function initNavigation() {
    const user = getUser();

    document.querySelectorAll('.profile-link').forEach((link) => {
      if (user && user.username) {
        link.href = `profile.html?user=${encodeURIComponent(user.username)}`;
      }
    });

    document.querySelectorAll('.logout-button').forEach((button) => {
      button.addEventListener('click', logout);
    });

    if (document.body.hasAttribute('data-auth-required')) {
      requireAuth();
    }
  }

  window.IG = {
    API_BASE,
    getToken,
    getUser,
    saveSession,
    logout,
    requireAuth,
    imageUrl,
    escapeHTML,
    avatarLetter,
    setMessage,
    request
  };

  document.addEventListener('DOMContentLoaded', initNavigation);
}());
