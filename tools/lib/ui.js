/* AVQ — हिंदी / English / Hinglish किसी में भी खोजें (ध्वनि-आधारित मिलान) */
(function (W) {
  if (W.AVQ) return;
  const C = { 'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n', 'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n', 'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n', 'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'ळ': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h', 'ड़': 'r', 'ढ़': 'rh', 'क़': 'k', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'j', 'फ़': 'f' };
  const V = { 'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', 'ः': 'h', '्': '', '़': '', 'ॅ': 'e', 'ॉ': 'o' };
  function rom(s) {
    s = String(s || '').normalize('NFC').toLowerCase(); let o = '';
    for (const ch of s) o += C[ch] != null ? C[ch] : V[ch] != null ? V[ch] : ch;
    return o;
  }
  function sk(s) {   // व्यंजन-ढाँचा: स्वर, h, y हटाकर समान ध्वनियाँ एक
    return rom(s).replace(/ph/g, 'f').replace(/[^a-z]/g, '').replace(/ksh|x/g, 'ks').replace(/w/g, 'v').replace(/z/g, 'j').replace(/q/g, 'k')
      .replace(/c(?!h)/g, 'k').replace(/(.)\1+/g, '$1').replace(/[aeiouyh]/g, '').replace(/m(?=[pb])/g, 'n');
  }
  const SYN = {
    horoscope: 'राशिफल rashifal', rashi: 'राशि', zodiac: 'राशि', marriage: 'विवाह शादी', wedding: 'विवाह शादी लग्न', shadi: 'विवाह', shaadi: 'विवाह',
    chart: 'कुंडली', kundali: 'कुंडली', kundli: 'कुंडली', birth: 'जन्म कुंडली', match: 'मिलान', matching: 'मिलान', gem: 'रत्न', stone: 'रत्न', gemstone: 'रत्न',
    dream: 'स्वप्न सपना', sapna: 'स्वप्न', sapne: 'स्वप्न', shubh: 'शुभ', ashubh: 'अशुभ', fast: 'व्रत', eclipse: 'ग्रहण', house: 'गृह वास्तु', home: 'गृह घर', money: 'धन', wealth: 'धन लक्ष्मी', health: 'स्वास्थ्य रोग',
    love: 'प्रेम', job: 'नौकरी करियर', career: 'करियर नौकरी', child: 'संतान', baby: 'संतान गर्भ', pregnancy: 'गर्भ', number: 'अंक', numerology: 'अंक मूलांक',
    remedy: 'उपाय', remedies: 'उपाय', planet: 'ग्रह', sun: 'सूर्य', moon: 'चंद्र', mars: 'मंगल', mercury: 'बुध', jupiter: 'गुरु बृहस्पति', venus: 'शुक्र', saturn: 'शनि',
    prayer: 'स्तुति पूजा', worship: 'पूजा', meditation: 'ध्यान', chant: 'जाप मंत्र', festival: 'त्योहार पर्व', calendar: 'पंचांग', auspicious: 'मुहूर्त शुभ',
    time: 'मुहूर्त समय', name: 'नाम', donation: 'दान दक्षिणा', fire: 'अग्नि हवन', snake: 'सर्प', ganesh: 'गणेश', shiva: 'शिव', hanuman: 'हनुमान', durga: 'दुर्गा',
    lakshmi: 'लक्ष्मी', krishna: 'कृष्ण', ram: 'राम', vishnu: 'विष्णु', business: 'व्यापार', exam: 'परीक्षा विद्या', study: 'विद्या', vehicle: 'वाहन', property: 'भूमि संपत्ति',
    letter: 'पत्रिका', card: 'पत्रिका', invitation: 'पत्रिका निमंत्रण', dosha: 'दोष', dosh: 'दोष', mangalik: 'मांगलिक मंगल', manglik: 'मांगलिक', vastu: 'वास्तु'
  };
  const cache = new Map();
  function tsk(t) { let v = cache.get(t); if (v == null) { v = sk(t); if (cache.size > 4000) cache.clear(); cache.set(t, v); } return v; }
  function one(text, low, w) {
    if (low.includes(w)) return true;
    const ws = sk(w); if (ws.length >= 2 && tsk(text).includes(ws)) return true;
    // शब्द-स्तर: हर शब्द के ढाँचे की शुरुआत से
    const s = SYN[rom(w).replace(/[^a-z]/g, '')];
    if (s) return s.split(' ').some(x => low.includes(x) || (sk(x).length >= 2 && tsk(text).includes(sk(x))));
    return false;
  }
  function AVQ(text, q) {
    q = String(q || '').trim().toLowerCase(); if (!q) return true;
    text = String(text || ''); const low = text.toLowerCase();
    if (low.includes(q)) return true;
    return q.split(/\s+/).filter(Boolean).every(w => one(text, low, w));
  }
  AVQ.sk = sk; AVQ.rom = rom;
  W.AVQ = AVQ;
})(window);

/* ===== Astro Vikass — टूल्स के साझा सहायक ===== */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
  function toast(m) { let t = $('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); } t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2800); }
  /* WhatsApp: wa.me का redirect इमोजी को ? बना देता है — इसलिए सीधे api.whatsapp.com; टूटे surrogate भी साफ़ */
  function waText(t) { t = String(t || ''); return t.toWellFormed ? t.toWellFormed() : t.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, ''); }
  function waUrl(text, phone) { const n = String(phone || '').replace(/\D/g, ''), p = n.length === 10 ? '91' + n : n; return 'https://api.whatsapp.com/send?' + (p ? 'phone=' + p + '&' : '') + 'text=' + encodeURIComponent(waText(text)); }
  function share(text) { const t = /7069492135/.test(text) ? text : text + '\n\n— Astro Vikass • ☎ 7069492135'; window.open(waUrl(t), '_blank'); }
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
  /* Astro Vikass Android ऐप (WebView) में फ़ाइल सेव / शेयर — ब्राउज़र वाला डाउनलोड/शेयर वहाँ नहीं चलता */
  const hasApp = () => { try { return !!(window.AVApp && typeof window.AVApp.shareFile === 'function'); } catch (e) { return false; } };
  const b64Of = f => new Promise((r, j) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1] || ''); fr.onerror = j; fr.readAsDataURL(f); });
  async function appFile(f, how, phone, text) {   // how: 'save' | 'share'
    const b = await b64Of(f);
    if (how === 'save') window.AVApp.saveFile(f.name, f.type || '', b);
    else window.AVApp.shareFile(f.name, f.type || '', b, String(phone || '').replace(/\D/g, ''), text || '');
  }
  window.AVUI = { $, esc, store, toast, share, waUrl, iso, placeField, birthForm, foot, hasApp, appFile };
})();
/* 📊 AVTRK — मुख्य ऐप (Apps Script) के अंदर खुलने पर गतिविधि भेजें: क्या खोजा, क्या भरा (एडमिन लॉग, हर रविवार साफ़) */
(function (W) {
  if (W.AVTRK || W.parent === W) { W.AVTRK = W.AVTRK || function () {}; return; }
  function send(t, d, x) { try { W.parent.postMessage({ avTrk: 1, t: t, d: String(d || '').slice(0, 400), x: x || null }, '*'); } catch (e) {} }
  W.AVTRK = send;
  const D = document;
  const lab = el => {
    let l = '';
    if (el.id) { const L = D.querySelector('label[for="' + el.id + '"]'); if (L) l = L.textContent; }
    if (!l) { const p = el.closest('label'); if (p) l = p.textContent.replace(el.value || '', ''); }
    if (!l && el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') l = el.previousElementSibling.textContent;
    if (!l) { let p = el.parentElement; for (let k = 0; k < 3 && p && !l; k++, p = p.parentElement) { const L = p.querySelector('label'); if (L && !L.contains(el) && p.querySelectorAll('input,select,textarea').length <= 2) l = L.textContent; } }
    if (!l) l = el.getAttribute('aria-label') || el.title || '';
    return String(l || el.placeholder || el.name || el.id || 'फ़ील्ड').replace(/[*:\s]+$/,'').replace(/\s+/g, ' ').trim().slice(0, 40);
  };
  const isSrch = el => el.type === 'search' || /खोज|search|🔍|ढूँढ|ढूंढ/i.test((el.placeholder || '') + ' ' + (el.id || ''));
  const val = el => el.tagName === 'SELECT' ? (el.options[el.selectedIndex] || {}).text || el.value : el.value;
  let ti = null, lastI = '', ts = null, lastS = '';
  function snap() {
    const o = {}, a = [];
    D.querySelectorAll('input,select,textarea').forEach(el => {
      if (/^(password|hidden|button|submit|checkbox|radio|file|range)$/.test(el.type) || isSrch(el) || !el.value || !el.offsetParent) return;
      const k = lab(el), v = String(val(el)).slice(0, 80); if (o[k]) return; o[k] = v; a.push(k + ': ' + v);
    });
    const s = a.join(' | '); if (!s || s === lastI) return; lastI = s; send('input', s, o);
  }
  D.addEventListener('change', e => { const el = e.target; if (!el || !el.matches || !el.matches('input,select,textarea') || isSrch(el)) return; clearTimeout(ti); ti = setTimeout(snap, 4000); }, true);
  D.addEventListener('input', e => {
    const el = e.target; if (!el || !el.matches || !el.matches('input') || !isSrch(el)) return;
    clearTimeout(ts); ts = setTimeout(() => { const v = el.value.trim(); if (v.length >= 2 && v !== lastS && !(lastS && lastS.indexOf(v) === 0)) { lastS = v; send('search', v); } }, 2500);
  }, true);
})(window);
