"use strict";
(function () {
  // SHA-256 hex of the site password. Default password: 509th  (CHANGE IT, see README).
  const PASSWORD_HASH = 'b0e882e28543d56926bbd92585e5aaa6178cd564025c46e9961b96abd47ee446';
  const MAX_SESSIONS = 10;
  const KEY = 'information-page-auth-v1';
  const SESSION_FLAG = 'information-page-session-counted';
  const ACTIVE_KEY = 'information-page-last-active';
  const ACTIVE_WINDOW_MS = 60000;
  const root = document.documentElement;

  function load() {
    try {
      const rec = JSON.parse(localStorage.getItem(KEY));
      if (rec && rec.h === PASSWORD_HASH && Number.isInteger(rec.n) && rec.n >= 1) return rec;
    } catch (e) {}
    return null;
  }
  function save(rec) { try { localStorage.setItem(KEY, JSON.stringify(rec)); return true; } catch (e) { return false; } }
  function lastActive() { const t = Number(localStorage.getItem(ACTIVE_KEY)); return Number.isFinite(t) ? t : 0; }
  function heartbeat() { try { localStorage.setItem(ACTIVE_KEY, String(Date.now())); } catch (e) {} }

  // A "session" is one browser session (sessionStorage), shared by tabs opened while another
  // tab was recently active, so multiple tabs and reloads do not burn through the allowance.
  function isNewSession() {
    try {
      if (sessionStorage.getItem(SESSION_FLAG)) return false;
      sessionStorage.setItem(SESSION_FLAG, '1');
    } catch (e) { return false; }
    return Date.now() - lastActive() > ACTIVE_WINDOW_MS;
  }

  function checkAccess() {
    const rec = load();
    if (!rec) return false;
    if (isNewSession()) {
      rec.n += 1;
      if (rec.n > MAX_SESSIONS) { try { localStorage.removeItem(KEY); } catch (e) {} return false; }
      save(rec);
    }
    return true;
  }

  async function sha256(text) {
    if (!window.crypto || !crypto.subtle) throw new Error('This page must be opened over HTTPS or localhost.');
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  }

  function unlock() {
    const gate = document.getElementById('gate');
    if (gate) gate.remove();
    root.classList.add('unlocked');
    heartbeat();
    setInterval(heartbeat, 15000);
    const s = document.createElement('script');
    s.src = './app.js';
    document.body.append(s);
  }

  function showGate() {
    const gate = document.getElementById('gate');
    gate.hidden = false;
    const form = document.getElementById('gate-form');
    const input = document.getElementById('gate-password');
    const msg = document.getElementById('gate-error');
    input.focus();
    form.addEventListener('submit', async e => {
      e.preventDefault();
      msg.textContent = '';
      try {
        if (await sha256(input.value) !== PASSWORD_HASH) {
          msg.textContent = 'Incorrect password. Please try again.';
          input.value = ''; input.focus();
          return;
        }
      } catch (err) { msg.textContent = err.message; return; }
      // The session in which the password is entered counts as session 1.
      try { sessionStorage.setItem(SESSION_FLAG, '1'); } catch (err) {}
      if (!save({ h: PASSWORD_HASH, n: 1 })) {
        msg.textContent = 'Signed in for this visit only: browser storage is unavailable, so the password will be requested again next time.';
      }
      unlock();
    });
  }

  // Another tab signing out/expiring or signing in is picked up on the next load; if the
  // record is removed while this tab is open, lock again.
  window.addEventListener('storage', e => { if (e.key === KEY && !e.newValue) location.reload(); });

  function start() { if (checkAccess()) unlock(); else showGate(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
