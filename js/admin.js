/* Admin panel. All permissions are enforced by the server; the UI only hides what you cannot use. */
if (!API.tok.admin()) location.href = 'admin-login.html';
const INFO = JSON.parse(sessionStorage.getItem('ap_admin_info') || '{}');
const can = g => (INFO.perms || []).includes('*') || (INFO.perms || []).includes(g);
const A = (action, p) => API.call(action, p || {}, 'admin');
const main = $('#main');
$('#who').textContent = (INFO.Name || 'Admin') + ' (' + (INFO.Role || '') + ')';
$('#lo').onclick = () => { API.tok.clear(); sessionStorage.removeItem('ap_admin_info'); location.href = 'admin-login.html'; };

const KNOW = [
  ['NumerologyMappings', 'Alphabet and planet mapping'], ['NumerologyRules', 'Numerology meanings'], ['YearWarnings', 'Future year warnings'],
  ['Remedies', 'Remedies'], ['BirthPlaces', 'Birth places'], ['Planets', 'Planets'], ['Rashis', 'Rashis'], ['Houses', 'Houses'], ['Nakshatras', 'Nakshatras'],
  ['AstrologyRules', 'Astrology rules'], ['PlanetCombinations', 'Planet combinations'], ['Yogas', 'Yogas'], ['Doshas', 'Doshas'], ['LalKitabRules', 'Lal Kitab rules']
];
const SECTIONS = [
  ['home', 'Overview', () => true, viewHome], ['users', 'Users', () => can('users'), viewUsers],
  ['know', 'Knowledge', () => can('content'), viewKnow], ['plans', 'Plans', () => can('plans'), () => viewSheet('Plans')],
  ['settings', 'Settings', () => can('settings'), viewSettings], ['admins', 'Admins', () => can('admins'), viewAdmins], ['audit', 'Audit log', () => can('audit'), viewAudit]
].filter(s => s[2]());

const nav = $('#nav');
nav.innerHTML = SECTIONS.map(s => `<button data-s="${s[0]}">${s[1]}</button>`).join('');
nav.onclick = e => { if (e.target.dataset.s) go(e.target.dataset.s); };
async function go(id) {
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.s === id));
  main.innerHTML = '<div class="skeleton"></div>';
  const s = SECTIONS.find(x => x[0] === id);
  try { await s[3](); } catch (e) { main.innerHTML = '<p class="err">' + esc(e.message) + '</p>'; }
}

/* ---------- generic modal form ---------- */
const LONG = /(Text|Description|JSON|Interpretation|Result|Effects|Remedies|Instructions|Notes|Meanings|Significations|Karakatwa|Benefits|Lifestyle)/;
const BOOL = ['Active', 'PremiumOnly', 'PremiumAccess'];
function formModal(title, fields, values, onSave, saveText = 'Save') {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  const inputs = fields.map(f => {
    const v = values[f.name] ?? '';
    const lab = `<label>${esc(f.label || f.name)}</label>`;
    if (f.type === 'bool') return `<div class="field">${lab}<select name="${f.name}"><option value="true" ${String(v).toUpperCase() !== 'FALSE' && v !== '' ? 'selected' : ''}>Yes</option><option value="false" ${String(v).toUpperCase() === 'FALSE' ? 'selected' : ''}>No</option></select></div>`;
    if (f.type === 'select') return `<div class="field">${lab}<select name="${f.name}">${f.options.map(o => `<option ${String(v) === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
    if (f.type === 'long') return `<div class="field">${lab}<textarea name="${f.name}">${esc(v)}</textarea></div>`;
    return `<div class="field">${lab}<input name="${f.name}" type="${f.type || 'text'}" value="${esc(v)}" ${f.ro ? 'readonly' : ''}></div>`;
  }).join('');
  bg.innerHTML = `<form class="modal wide"><h3>${esc(title)}</h3>${inputs}<p class="err" role="alert"></p><div class="actions"><button type="button" class="btn btn-line" data-c>Cancel</button><button class="btn btn-ink" type="submit">${esc(saveText)}</button></div></form>`;
  document.body.appendChild(bg);
  $('[data-c]', bg).onclick = () => bg.remove();
  $('form', bg).onsubmit = async e => {
    e.preventDefault(); const btn = $('[type=submit]', bg);
    try { await busy(btn, () => onSave(Object.fromEntries(new FormData(e.target)))); bg.remove(); }
    catch (x) { $('.err', bg).textContent = x.message; }
  };
}
const pager = (total, page, size, fn) => {
  const pages = Math.max(1, Math.ceil(total / size));
  return `<div class="pager"><button class="btn btn-line mini" data-pg="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Previous</button><span>Page ${page} of ${pages} (${total})</span><button class="btn btn-line mini" data-pg="${page + 1}" ${page >= pages ? 'disabled' : ''}>Next</button></div>`;
};
const fmt = v => v instanceof Object ? '' : (String(v).match(/^\d{4}-\d\d-\d\dT/) ? new Date(v).toLocaleString('en-IN') : String(v));

/* ---------- overview ---------- */
async function viewHome() {
  const s = await A('adminStats');
  const items = [['Users', s.users], ['Plans', s.plans], ['Birth places', s.places], ['Meanings and rules', s.rules], ['Year warnings', s.warnings], ['Reports', s.reports]];
  main.innerHTML = '<h2>Overview</h2><div class="stats">' + items.map(i => `<div class="card"><p class="hint">${i[0]}</p><div class="stat">${i[1]}</div></div>`).join('') + '</div><p class="hint" style="margin-top:16px">Everything customers see comes from the Knowledge, Plans and Settings sections. Changes apply immediately.</p>';
}

/* ---------- users ---------- */
let uState = { q: '', page: 1 };
async function viewUsers() {
  const d = await A('adminListUsers', uState);
  main.innerHTML = `<h2>Users</h2><div class="tools"><input id="uq" placeholder="Search name, mobile, email" value="${esc(uState.q)}"><button class="btn btn-ink" id="us">Search</button></div>
  <div class="tbl"><table><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Status</th><th>Joined</th><th></th></tr>${d.rows.map(u => `<tr class="${String(u.Deleted).toUpperCase() === 'TRUE' ? 'off' : ''}"><td>${esc(u.Name)}</td><td>${esc(u.Mobile)}</td><td>${esc(u.Email)}</td><td>${esc(String(u.Deleted).toUpperCase() === 'TRUE' ? 'DELETED' : u.Status)}</td><td>${esc(fmt(u.CreatedAt))}</td>
  <td class="act"><button class="btn btn-line mini" data-e="${u.UserID}">Edit</button> <button class="btn btn-line mini" data-w="${u.UserID}">Wallet</button> <button class="btn btn-line mini" data-p="${u.UserID}">Password</button></td></tr>`).join('') || '<tr><td colspan="6">No users found.</td></tr>'}</table></div>${pager(d.total, d.page, d.pageSize)}`;
  const reload = () => viewUsers();
  $('#us').onclick = () => { uState = { q: $('#uq').value, page: 1 }; reload(); };
  $('#uq').onkeydown = e => { if (e.key === 'Enter') $('#us').click(); };
  $$('[data-pg]', main).forEach(b => b.onclick = () => { uState.page = +b.dataset.pg; reload(); });
  const byId = id => d.rows.find(r => r.UserID === id);
  $$('[data-e]', main).forEach(b => b.onclick = () => {
    const u = byId(b.dataset.e);
    formModal('Edit user', [{ name: 'Name' }, { name: 'Mobile' }, { name: 'Email', type: 'email' }, { name: 'Status', type: 'select', options: ['ACTIVE', 'SUSPENDED'] }, { name: 'Deleted', label: 'Deleted', type: 'select', options: ['FALSE', 'TRUE'] }],
      { ...u, Deleted: String(u.Deleted).toUpperCase() }, async v => { await A('adminUserUpdate', { userId: u.UserID, fields: v }); toast('Saved', 'ok'); reload(); });
  });
  $$('[data-p]', main).forEach(b => b.onclick = () => formModal('Reset password', [{ name: 'newPassword', label: 'New password (min 8 characters)' }], {}, async v => { await A('adminResetUserPassword', { userId: b.dataset.p, newPassword: v.newPassword }); toast('Password reset', 'ok'); }));
  $$('[data-w]', main).forEach(b => b.onclick = () => walletModal(b.dataset.w));
}
async function walletModal(userId) {
  const w = await A('adminWallet', { userId });
  const tx = w.transactions.map(t => `<tr><td>${esc(fmt(t.CreatedAt))}</td><td>${esc(t.Type)}</td><td>${t.Points}</td><td>${t.BalanceAfter}</td><td>${esc(t.Reason)}</td></tr>`).join('') || '<tr><td colspan="5">No transactions.</td></tr>';
  formModal('Wallet: ' + w.balance + ' points', [{ name: 'direction', label: 'Action', type: 'select', options: ['ADD', 'DEDUCT'] }, { name: 'points', label: 'Points (1 point = Rs 1)', type: 'number' }, { name: 'reason', label: 'Reason (required)' }], {},
    async v => { const r = await A('adminAddPoints', { userId, ...v }); toast('New balance: ' + r.balance, 'ok'); }, 'Apply');
  const m = $('.modal.wide:last-of-type') || $$('.modal.wide').pop();
  m.insertAdjacentHTML('beforeend', '<div class="tbl" style="margin-top:14px"><table><tr><th>When</th><th>Type</th><th>Pts</th><th>Balance</th><th>Reason</th></tr>' + tx + '</table></div>');
}

/* ---------- knowledge / generic sheets ---------- */
async function viewKnow() {
  main.innerHTML = '<h2>Knowledge</h2><p class="hint">Choose a table. Customers only ever see what is entered here.</p><div class="stack" style="margin-top:12px">' + KNOW.map(k => `<button class="btn btn-line" style="justify-content:flex-start" data-k="${k[0]}">${k[1]}</button>`).join('') + '</div>';
  $$('[data-k]', main).forEach(b => b.onclick = () => viewSheet(b.dataset.k, true));
}
let sState = {};
async function viewSheet(name, fromKnow) {
  const st = sState[name] = sState[name] || { q: '', page: 1 };
  const d = await A('adminSheetList', { sheet: name, ...st });
  const H = d.headers, idCol = H[0], hasActive = H.includes('Active');
  const show = H.filter(h => !['CreatedAt', 'UpdatedAt'].includes(h)).slice(0, 6);
  main.innerHTML = `<h2>${esc((KNOW.find(k => k[0] === name) || [0, name])[1])}</h2>
  <div class="tools">${fromKnow ? '<button class="btn btn-line" id="bk">Back</button>' : ''}<input id="sq" placeholder="Search" value="${esc(st.q)}"><button class="btn btn-ink" id="ss">Search</button><button class="btn btn-gold" id="sn">Add new</button></div>
  <div class="tbl"><table><tr>${show.map(h => `<th>${esc(h)}</th>`).join('')}<th></th></tr>${d.rows.map(r => `<tr class="${hasActive && String(r.Active).toUpperCase() === 'FALSE' ? 'off' : ''}">${show.map(h => `<td title="${esc(r[h])}">${esc(fmt(r[h]))}</td>`).join('')}<td class="act"><button class="btn btn-line mini" data-e="${esc(r[idCol])}">Edit</button>${hasActive ? ` <button class="btn btn-line mini" data-t="${esc(r[idCol])}" data-a="${String(r.Active).toUpperCase() === 'FALSE' ? 1 : 0}">${String(r.Active).toUpperCase() === 'FALSE' ? 'Activate' : 'Deactivate'}</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="${show.length + 1}">Nothing here yet. Use Add new.</td></tr>`}</table></div>${pager(d.total, d.page, d.pageSize)}`;
  if (fromKnow) $('#bk').onclick = viewKnow;
  const again = () => viewSheet(name, fromKnow);
  $('#ss').onclick = () => { st.q = $('#sq').value; st.page = 1; again(); };
  $('#sq').onkeydown = e => { if (e.key === 'Enter') $('#ss').click(); };
  $$('[data-pg]', main).forEach(b => b.onclick = () => { st.page = +b.dataset.pg; again(); });
  const fields = H.filter(h => !['CreatedAt', 'UpdatedAt'].includes(h)).map(h => ({ name: h, type: BOOL.includes(h) ? 'bool' : LONG.test(h) ? 'long' : 'text', ro: h === idCol }));
  const edit = row => formModal(row ? 'Edit record' : 'Add record', fields, row || {}, async v => { await A('adminSheetSave', { sheet: name, row: v }); toast('Saved', 'ok'); again(); });
  $('#sn').onclick = () => edit(null);
  $$('[data-e]', main).forEach(b => b.onclick = () => edit(d.rows.find(r => String(r[idCol]) === b.dataset.e)));
  $$('[data-t]', main).forEach(b => b.onclick = async () => {
    if (b.dataset.a === '0' && !await confirmDlg('Deactivate', 'This record will stop appearing for customers. You can activate it again later.', 'Deactivate')) return;
    await A('adminSheetToggle', { sheet: name, id: b.dataset.t, active: b.dataset.a === '1' }); toast('Updated', 'ok'); again();
  });
}

/* ---------- settings ---------- */
async function viewSettings() {
  const d = await A('adminGetSettings');
  main.innerHTML = `<h2>Settings</h2><form id="sf">${d.rows.map(r => `<div class="field"><label>${esc(r.Key)} <span class="hint">${esc(r.Group)}</span></label><input name="${esc(r.Key)}" value="${esc(r.Value)}"></div>`).join('')}<button class="btn btn-ink" type="submit">Save settings</button></form><p class="hint" style="margin-top:10px">Use TRUE or FALSE for switches. Colors are hex codes like #2B2A6B.</p>`;
  $('#sf').onsubmit = async e => { e.preventDefault(); const r = await busy($('button', e.target), () => A('adminSaveSettings', { settings: Object.fromEntries(new FormData(e.target)) })); localStorage.removeItem('ap_boot'); toast(r.changed + ' setting(s) changed', 'ok'); };
}

/* ---------- admins ---------- */
async function viewAdmins() {
  const d = await A('adminListAdmins');
  main.innerHTML = `<h2>Admins</h2><div class="tools"><button class="btn btn-gold" id="an">Add admin</button></div><div class="tbl"><table><tr><th>Name</th><th>Mobile</th><th>Role</th><th>Status</th><th>Last login</th><th></th></tr>${d.rows.map(a => `<tr><td>${esc(a.Name)}</td><td>${esc(a.Mobile)}</td><td>${esc(a.Role)}</td><td>${esc(a.Status)}${a.HasPassword ? '' : ' (no password set)'}</td><td>${esc(fmt(a.LastLoginAt))}</td><td class="act"><button class="btn btn-line mini" data-e="${a.AdminID}">Edit</button></td></tr>`).join('')}</table></div>
  <p class="hint" style="margin-top:10px">Passwords are stored in the private Admins sheet. You can also edit them directly in the sheet.</p>`;
  const F = [{ name: 'Name' }, { name: 'Mobile' }, { name: 'Role', type: 'select', options: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'SUPPORT'] }, { name: 'Status', type: 'select', options: ['ACTIVE', 'INACTIVE'] }, { name: 'Permissions', label: 'Permissions (ALL, or comma list: users, wallet, content, plans, settings, audit)' }, { name: 'NewPassword', label: 'New password (leave blank to keep current)' }];
  const edit = a => formModal(a ? 'Edit admin' : 'Add admin', F, a || { Permissions: 'ALL', Status: 'ACTIVE', Role: 'ADMIN' }, async v => { await A('adminSaveAdmin', { row: { ...v, AdminID: a ? a.AdminID : '' } }); toast('Saved', 'ok'); viewAdmins(); });
  $('#an').onclick = () => edit(null);
  $$('[data-e]', main).forEach(b => b.onclick = () => edit(d.rows.find(r => r.AdminID === b.dataset.e)));
}

/* ---------- audit ---------- */
let auPage = 1;
async function viewAudit() {
  const d = await A('adminAudit', { page: auPage });
  main.innerHTML = `<h2>Audit log</h2><div class="tbl"><table><tr><th>When</th><th>Admin</th><th>Action</th><th>Target</th><th>ID</th></tr>${d.rows.map(r => `<tr><td>${esc(fmt(r.CreatedAt))}</td><td>${esc(r.AdminID)}</td><td>${esc(r.Action)}</td><td>${esc(r.TargetType)}</td><td title="${esc(r.NewValueJSON)}">${esc(r.TargetID)}</td></tr>`).join('') || '<tr><td colspan="5">No entries yet.</td></tr>'}</table></div>${pager(d.total, d.page, d.pageSize)}`;
  $$('[data-pg]', main).forEach(b => b.onclick = () => { auPage = +b.dataset.pg; viewAudit(); });
}

go('home');
