/* ===== Astro Vikass — टूल्स के साझा सहायक ===== */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
  function toast(m) { let t = $('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); } t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2800); }
  function share(text) { window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n\n— Astro Vikass • ☎ 7069492135\nhttps://sidtech366.github.io/jyotishi/'), '_blank'); }
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  /* स्थान फ़ील्ड: el में बनता है; key = कहाँ याद रखें (डिफ़ॉल्ट: सभी टूल्स का साझा स्थान) */
  function placeField(el, opts) {
    opts = opts || {}; const key = opts.key || null, id = 'pf' + Math.random().toString(36).slice(2, 7);
    el.innerHTML = `<label class="l">${esc(opts.label || 'स्थान')}</label><div class="locrow"><input class="in" id="${id}" placeholder="शहर लिखें — Bagaha या बगहा" autocomplete="off" spellcheck="false">${opts.gps === false ? '' : `<button type="button" class="gpsb" id="${id}g" title="मेरा वर्तमान स्थान">📍</button>`}</div><div class="locnote" id="${id}n"></div>`;
    const inp = $(id), note = $(id + 'n'); let cur = null;
    function set(L, silent) {
      cur = L; inp.value = L.name + (L.st ? ', ' + L.st.split(',').pop().trim() : '');
      note.textContent = '✓ ' + Math.abs(L.lat).toFixed(2) + '°' + (L.lat >= 0 ? 'N' : 'S') + ', ' + Math.abs(L.lon).toFixed(2) + '°' + (L.lon >= 0 ? 'E' : 'W');
      if (key) store.set(key, L); else AVPlaces.save(L);
      if (!silent && opts.onPick) opts.onPick(L);
    }
    AVPlaces.mount(inp, L => set(L));
    inp.addEventListener('input', () => { cur = null; note.textContent = ''; });
    if (opts.gps !== false) $(id + 'g').onclick = () => { note.textContent = '📍 स्थान ढूंढ रहे हैं…'; AVPlaces.gps().then(L => set(L)).catch(e => { note.textContent = e.message; }); };
    const saved = key ? store.get(key, null) : AVPlaces.load();
    if (saved) set(saved, true); else if (opts.hint !== false) note.textContent = opts.hint || 'एक बार चुनें — अगली बार अपने आप भरा मिलेगा';
    return { get: () => cur, set, tz: (dateStr) => cur ? (cur.zone ? AVPlaces.tzOf(cur.zone, dateStr) : cur.tz) : 5.5 };
  }
  /* जन्म विवरण फ़ॉर्म */
  function birthForm(el, key, title) {
    const s = store.get(key, {}), id = key.replace(/\W/g, '');
    el.innerHTML = `${title ? `<h4>${esc(title)}</h4>` : ''}<label class="l">नाम</label><input class="in" id="${id}nm" placeholder="नाम" value="${esc(s.name || '')}">
      <div class="av-row"><div><label class="l">जन्म तिथि</label><input class="in" type="date" id="${id}dt" value="${esc(s.date || '')}"></div><div><label class="l">जन्म समय</label><input class="in" type="time" id="${id}tm" value="${esc(s.time || '')}"></div></div><div id="${id}pl"></div>`;
    const pf = placeField($(id + 'pl'), { key: key + '_loc', label: 'जन्म स्थान', gps: false, hint: 'शहर लिखकर सूची से चुनें' });
    return {
      get() {
        const name = $(id + 'nm').value.trim(), date = $(id + 'dt').value, time = $(id + 'tm').value, L = pf.get();
        if (!date || !time || !L) { toast('कृपया जन्म तिथि, समय और स्थान भरें'); return null; }
        store.set(key, { name, date, time });
        const [y, m, d] = date.split('-').map(Number), [hh, mm] = time.split(':').map(Number), tz = pf.tz(date);
        return { name, date, time, L, tz, jd: AVAstro.jdOf(y, m, d, hh + mm / 60 - tz) };
      }
    };
  }
  const foot = () => '<div class="foot"><b>Astro Vikass</b> • ☎ 7069492135<br>ज्योतिषीय गणना मार्गदर्शन हेतु है</div>';
  window.AVUI = { $, esc, store, toast, share, iso, placeField, birthForm, foot };
})();
