const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg, type = '') {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.className = type; t.style.display = 'block';
  clearTimeout(toast._t); toast._t = setTimeout(() => t.style.display = 'none', 3500);
}
function popup(title, msg, okText = 'OK') {
  return new Promise(res => {
    const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.setAttribute('role', 'dialog');
    bg.innerHTML = `<div class="modal"><h3>${esc(title)}</h3><p>${esc(msg)}</p><div class="actions"><button class="btn btn-ink">${esc(okText)}</button></div></div>`;
    document.body.appendChild(bg);
    const b = $('button', bg); b.focus(); b.onclick = () => { bg.remove(); res(); };
  });
}
function confirmDlg(title, msg, okText = 'Confirm') {
  return new Promise(res => {
    const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.setAttribute('role', 'dialog');
    bg.innerHTML = `<div class="modal"><h3>${esc(title)}</h3><p>${esc(msg)}</p><div class="actions"><button class="btn btn-line" data-x="0">Cancel</button><button class="btn btn-ink" data-x="1">${esc(okText)}</button></div></div>`;
    document.body.appendChild(bg);
    bg.onclick = e => { const x = e.target.dataset && e.target.dataset.x; if (x !== undefined) { bg.remove(); res(x === '1'); } };
  });
}
async function busy(btn, fn) {
  const old = btn.textContent; btn.disabled = true; btn.textContent = 'Please wait';
  try { return await fn(); } finally { btn.disabled = false; btn.textContent = old; }
}

/* branding comes from admin Settings: no frontend change needed to rebrand */
let SITE = {};
function applyBranding(s) {
  if (!s) return; SITE = s;
  const r = document.documentElement.style;
  if (s.PRIMARY_COLOR) { r.setProperty('--ink', s.PRIMARY_COLOR); }
  if (s.SECONDARY_COLOR) r.setProperty('--rose', s.SECONDARY_COLOR);
  if (s.ACCENT_COLOR) r.setProperty('--gold', s.ACCENT_COLOR);
  $$('[data-site-name]').forEach(e => e.textContent = s.SITE_NAME || '');
  $$('[data-tagline]').forEach(e => e.textContent = s.TAGLINE || '');
  $$('[data-footer]').forEach(e => e.textContent = s.FOOTER_TEXT || '');
  $$('[data-contact]').forEach(e => { const c = [s.CONTACT_EMAIL, s.CONTACT_MOBILE].filter(Boolean).join('  /  '); e.textContent = c; });
  if (s.LOGO_URL) $$('[data-logo]').forEach(e => { e.src = s.LOGO_URL; e.style.display = 'block'; });
  if (s.FAVICON_URL) { let l = $('link[rel=icon]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon' })); l.href = s.FAVICON_URL; }
  if (s.SITE_NAME && !document.title.includes(s.SITE_NAME)) document.title = document.title.split(' | ')[0] + ' | ' + s.SITE_NAME;
  if (s.MAINTENANCE_MODE === true && !location.pathname.includes('admin')) {
    document.body.innerHTML = '<div class="narrow"><div class="panel"><h1>We will be back soon</h1><p>The site is under maintenance. Please try again shortly.</p></div></div>';
  }
}

function renderChrome(active) {
  const loggedIn = !!API.tok.user();
  const links = [['index.html', 'Home', '&#9788;', 'home'], ['numerology.html', 'Numerology', '&#9733;', 'num'], [loggedIn ? 'dashboard.html' : 'login.html', loggedIn ? 'My account' : 'Log in', '&#9786;', 'acc']];
  $('#chrome-top').innerHTML = `<header class="top"><div class="wrap"><a class="brand" href="index.html"><img data-logo alt="" style="display:none"><span data-site-name>Ank Jyotish</span></a><nav aria-label="Main">${links.map(l => `<a href="${l[0]}" class="${l[3] === active ? 'on' : ''}">${l[1]}</a>`).join('')}</nav></div></header>`;
  $('#chrome-bottom').innerHTML = `<nav class="bottom" aria-label="Main">${links.map(l => `<a href="${l[0]}" class="${l[3] === active ? 'on' : ''}"><b>${l[2]}</b>${l[1]}</a>`).join('')}</nav>`;
}
