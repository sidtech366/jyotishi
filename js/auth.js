function bindRegister() {
  const f = $('#regForm'); if (!f) return;
  f.addEventListener('submit', async e => {
    e.preventDefault(); const btn = $('button[type=submit]', f), err = $('#err');
    err.textContent = '';
    const v = Object.fromEntries(new FormData(f));
    if (v.password !== v.confirmPassword) { err.textContent = 'Passwords do not match.'; return; }
    try {
      const d = await busy(btn, () => API.call('register', v, 'none'));
      API.tok.setUser(d.token); location.href = 'dashboard.html';
    } catch (x) { err.textContent = x.message; }
  });
}
function bindLogin() {
  const f = $('#loginForm'); if (!f) return;
  f.addEventListener('submit', async e => {
    e.preventDefault(); const btn = $('button[type=submit]', f), err = $('#err');
    err.textContent = '';
    try {
      const d = await busy(btn, () => API.call('login', Object.fromEntries(new FormData(f)), 'none'));
      API.tok.setUser(d.token); location.href = 'dashboard.html';
    } catch (x) { err.textContent = x.message; if (x.code === 'AUTH_FAILED') popup('Login failed', x.message); }
  });
}
async function logout() {
  try { await API.call('logout', {}, 'user'); } catch (e) {}
  API.tok.clear(); location.href = 'index.html';
}
