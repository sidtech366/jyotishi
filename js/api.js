/* All backend calls live here, so moving to Supabase/another backend later only changes this file. */
const API = (() => {
  const U = () => APP_CONFIG.API_URL;
  const BOOT_KEY = 'ap_boot', BOOT_TTL = 5 * 60 * 1000;
  const tok = {
    user: () => localStorage.getItem('ap_token'),
    admin: () => sessionStorage.getItem('ap_admin'),
    setUser: t => localStorage.setItem('ap_token', t),
    setAdmin: t => sessionStorage.setItem('ap_admin', t),
    clear() { localStorage.removeItem('ap_token'); sessionStorage.removeItem('ap_admin'); }
  };
  function ensure() { if (!U() || U().includes('PASTE_YOUR')) throw new Error('Set API_URL in js/config.js first.'); }

  async function call(action, payload = {}, kind = 'user') {
    ensure();
    const token = kind === 'admin' ? tok.admin() : tok.user();
    let r;
    try {
      r = await fetch(U() + '?action=' + action, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...payload, token }) });
    } catch (e) { throw new Error('Network problem. Check your internet and try again.'); }
    const j = await r.json();
    if (!j.success) {
      if (j.errorCode === 'SESSION_EXPIRED') {
        kind === 'admin' ? sessionStorage.removeItem('ap_admin') : localStorage.removeItem('ap_token');
        if (kind === 'admin' && !location.pathname.includes('admin-login')) location.href = 'admin-login.html';
        else if (kind === 'user' && !location.pathname.match(/login|register|index|numerology/)) location.href = 'login.html';
      }
      const e = new Error(j.message || 'Something went wrong. Please try again.'); e.code = j.errorCode; throw e;
    }
    return j.data;
  }

  /** Stale-while-revalidate: cb fires instantly with cached public data, then again if fresh data differs. */
  function bootstrap(cb) {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(BOOT_KEY)); } catch (e) {}
    if (cached) cb(cached.data);
    if (cached && Date.now() - cached.t < BOOT_TTL) return;
    try { ensure(); } catch (e) { if (!cached) cb(null, e); return; }
    fetch(U() + '?action=getBootstrap').then(r => r.json()).then(j => {
      if (!j.success) return;
      const old = cached && JSON.stringify(cached.data);
      localStorage.setItem(BOOT_KEY, JSON.stringify({ t: Date.now(), data: j.data }));
      if (old !== JSON.stringify(j.data)) cb(j.data);
    }).catch(() => { if (!cached) cb(null, new Error('offline')); });
  }
  return { call, bootstrap, tok };
})();
