/* ===== वेबसाइट लॉजिक ===== */
const CONFIG = {
  SITE_NAME: 'Astro Vikass',
  MOBILE: '7069492135',
  // Supabase (वैकल्पिक): अपना URL और anon key डालें तो हर कुंडली का विवरण आपकी टेबल में सेव होगा
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
};
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const root = n => { while (n > 9) n = String(n).split('').reduce((a, b) => a + +b, 0); return n; };
const digitSum = s => String(s).replace(/\D/g, '').split('').reduce((a, b) => a + +b, 0);
const fmt = d => d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const yr = d => d.getFullYear();
const ord = n => n + (n === 2 ? 'रा' : n === 3 ? 'रा' : n === 4 ? 'था' : n === 1 ? 'ला' : n === 6 ? 'ठा' : 'वां');
const P = Astro.PLANETS;
const ISHTA = { Sun: 'सूर्य देव / श्री राम', Moon: 'भगवान शिव', Mars: 'हनुमान जी', Mercury: 'गणेश जी', Jupiter: 'भगवान विष्णु', Venus: 'माँ लक्ष्मी', Saturn: 'शनि देव / हनुमान जी' };
const AVOID = { Sun: 'अहंकार और पिता का अपमान', Moon: 'माता का अपमान और देर रात जागना', Mars: 'क्रोध और भाइयों से झगड़ा', Mercury: 'झूठ बोलना और बहन/बेटी का अपमान', Jupiter: 'गुरु और बुजुर्गों का अपमान', Venus: 'स्त्रियों का अपमान और अधिक विलासिता', Saturn: 'मजदूरों का शोषण और शराब', Rahu: 'नशा और गलत संगत', Ketu: 'कुत्तों को सताना और झूठे वचन' };
const PY = [null, 'नई शुरुआत, नए अवसर और आत्मनिर्भरता का वर्ष', 'साझेदारी, धैर्य और संबंधों को मजबूत करने का वर्ष', 'रचनात्मकता, यश और सामाजिक विस्तार का वर्ष', 'कड़ी मेहनत और मजबूत नींव बनाने का वर्ष', 'बदलाव, यात्रा और नए अनुभवों का वर्ष', 'परिवार, विवाह और जिम्मेदारियों का वर्ष', 'आत्मचिंतन, अध्ययन और आध्यात्म का वर्ष', 'धन, करियर और अधिकार में वृद्धि का वर्ष', 'पुराने काम पूरे करने, दान और समापन का वर्ष'];
const CHALDEAN = { A: 1, I: 1, J: 1, Q: 1, Y: 1, B: 2, K: 2, R: 2, C: 3, G: 3, L: 3, S: 3, D: 4, M: 4, T: 4, E: 5, H: 5, N: 5, X: 5, U: 6, V: 6, W: 6, O: 7, Z: 7, F: 8, P: 8 };


/* embed मोड में हल्की पृष्ठभूमि के लिए गहरे ग्रह रंग */
const EMBED = document.documentElement.classList.contains('embed');
if (EMBED) Object.entries({ Sun: '#c25e00', Moon: '#2f6fc9', Mars: '#c8102e', Mercury: '#138a52', Jupiter: '#9a6b00', Venus: '#b8378f', Saturn: '#3d4bbf', Rahu: '#5b4bb7', Ketu: '#7f4bb7' }).forEach(([p, c]) => K.P[p].c = c);
/* ---------- फॉर्म + जन्म स्थान खोज ---------- */
const norm = s => s.toLowerCase().replace(/[^a-zऀ-ॿ]/g, '');
let sugItems = [], sugIdx = -1, geoTimer = null, geoSeq = 0;
function initForm() {
  const inp = $('#place');
  inp.addEventListener('input', () => {
    if (!$('#manualBox').classList.contains('open')) { $('#lat').value = ''; $('#lon').value = ''; }
    $('#placeHint').textContent = '';
    showSug(inp.value);
  });
  inp.addEventListener('focus', () => inp.value && showSug(inp.value));
  inp.addEventListener('keydown', e => {
    if (!sugItems.length) return;
    if (e.key === 'ArrowDown') { sugIdx = (sugIdx + 1) % sugItems.length; paintSug(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sugIdx = (sugIdx - 1 + sugItems.length) % sugItems.length; paintSug(); e.preventDefault(); }
    else if (e.key === 'Enter' && sugIdx >= 0) { pickSug(sugIdx); e.preventDefault(); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.place-wrap')) hideSug(); });
  $('#manualToggle').addEventListener('click', () => $('#manualBox').classList.toggle('open'));
  try {
    const s = JSON.parse(localStorage.getItem('astrovikass_last') || 'null');
    if (s) for (const k in s) if ($('#' + k)) $('#' + k).value = s[k];
    if (s && s.lat) $('#placeHint').textContent = `✓ ${s.place}`;
  } catch (e) { }
  $('#kForm').addEventListener('submit', onSubmit);
}
function localMatches(q) {
  const n = norm(q); if (!n) return [];
  const scored = [];
  for (const c of CITIES) {
    const hi = norm(c[0]), en = c[1].toLowerCase().split(' ').map(norm);
    let s = -1;
    if (hi.startsWith(n) || en.some(e => e.startsWith(n))) s = 0;
    else if (hi.includes(n) || en.some(e => e.includes(n))) s = 1;
    if (s >= 0) scored.push([s, c]);
  }
  return scored.sort((a, b) => a[0] - b[0]).slice(0, 8).map(([, c]) => ({ label: c[0], en: c[1].split(' ')[0], st: c[2], lat: c[3], lon: c[4], tz: c[5] }));
}
function showSug(q) {
  sugItems = localMatches(q); sugIdx = sugItems.length ? 0 : -1; paintSug();
  clearTimeout(geoTimer);
  if (q.trim().length >= 3) geoTimer = setTimeout(() => onlineSug(q.trim()), 450);
}
async function onlineSug(q) {
  const my = ++geoSeq;
  try {
    const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=8&language=en&name=' + encodeURIComponent(q));
    const j = await r.json(); if (my !== geoSeq || !j.results) return;
    const dt = new Date(($('#dob').value || '2000-01-01') + 'T12:00:00Z');
    const extra = j.results.filter(g => !sugItems.some(s => Math.abs(s.lat - g.latitude) < 0.08 && Math.abs(s.lon - g.longitude) < 0.08)).map(g => {
      let tz = 5.5;
      if (g.country_code !== 'IN') { try { const loc = new Date(dt.toLocaleString('en-US', { timeZone: g.timezone })), utc = new Date(dt.toLocaleString('en-US', { timeZone: 'UTC' })); tz = Math.round((loc - utc) / 900000) / 4; } catch (e) { } }
      return { label: g.name, en: '', st: [g.admin2, g.admin1, g.country].filter(Boolean).join(', '), lat: +g.latitude.toFixed(2), lon: +g.longitude.toFixed(2), tz, online: true };
    });
    sugItems = sugItems.concat(extra).slice(0, 10); if (sugIdx < 0 && sugItems.length) sugIdx = 0; paintSug();
  } catch (e) { }
}
function paintSug() {
  const box = $('#placeSug');
  if (!sugItems.length) { box.innerHTML = $('#place').value.trim().length >= 2 ? '<div class="sug-empty">खोज रहे हैं… न मिले तो नीचे "अक्षांश/देशांतर" विकल्प चुनें</div>' : ''; box.classList.toggle('open', !!box.innerHTML); return; }
  box.innerHTML = sugItems.map((s, i) => `<div class="sug ${i === sugIdx ? 'act' : ''}" data-i="${i}"><span class="sug-ic">${s.online ? '🌐' : '📍'}</span><span><b>${esc(s.label)}</b>${s.en ? ` <i>${esc(s.en)}</i>` : ''}<small>${esc(s.st)}</small></span></div>`).join('');
  box.classList.add('open');
  box.querySelectorAll('.sug').forEach(el => el.addEventListener('mousedown', e => { e.preventDefault(); pickSug(+el.dataset.i); }));
}
function pickSug(i) {
  const s = sugItems[i]; if (!s) return;
  $('#place').value = `${s.label}, ${s.st.split(',').pop().trim()}`;
  $('#lat').value = s.lat; $('#lon').value = s.lon; $('#tz').value = s.tz;
  $('#placeHint').textContent = `✓ ${s.label} • ${Math.abs(s.lat)}°${s.lat >= 0 ? 'N' : 'S'}, ${Math.abs(s.lon)}°${s.lon >= 0 ? 'E' : 'W'}`;
  hideSug();
}
function hideSug() { $('#placeSug').classList.remove('open'); sugItems = []; }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); }

async function onSubmit(e) {
  e.preventDefault();
  const name = $('#name').value.trim(), dob = $('#dob').value, tob = $('#tob').value;
  if (!name || !dob || !tob) return toast('कृपया नाम, जन्म तिथि और जन्म समय भरें');
  if (!$('#lat').value) {
    const m = localMatches($('#place').value);
    if (m.length) { sugItems = m; pickSug(0); }
    else { $('#manualBox').classList.add('open'); $('#place').focus(); return toast('कृपया सूची से जन्म स्थान चुनें, या अक्षांश/देशांतर भरें'); }
  }
  const save = {}; ['name', 'ename', 'dob', 'tob', 'place', 'lat', 'lon', 'tz', 'mobile'].forEach(k => save[k] = $('#' + k).value);
  try { localStorage.setItem('astrovikass_last', JSON.stringify(save)); } catch (e) { }
  const [y, m, d] = dob.split('-').map(Number), [hh, mm] = tob.split(':').map(Number);
  const inp = { y, m, d, hh, mm, lat: +$('#lat').value, lon: +$('#lon').value, tz: +$('#tz').value };
  $('#loader').classList.add('show');
  setTimeout(() => {
    const k = Astro.kundli(inp);
    const html = buildReport(k, { name, ename: $('#ename').value.trim(), dob, tob, place: $('#place').value || `${inp.lat}, ${inp.lon}`, inp });
    $('#report').innerHTML = html; $('#report').classList.add('show'); kTab('info', false);
    $('#loader').classList.remove('show');
    $('#report').scrollIntoView({ behavior: 'smooth' });
    saveLead(save);
  }, 700);
}
async function saveLead(s) {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) return;
  try {
    await fetch(CONFIG.SUPABASE_URL + '/rest/v1/kundli_leads', {
      method: 'POST', headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name: s.name, mobile: s.mobile || null, dob: s.dob, tob: s.tob, place: s.place, lat: +s.lat, lon: +s.lon })
    });
  } catch (e) { }
}

/* ---------- विश्लेषण सहायक ---------- */
function stars(p, q) {
  let s = { uchch: 5, swa: 5, mitra: 4, sam: 3, shatru: 2, neech: 1 }[q.dignity];
  if (p === 'Rahu' || p === 'Ketu') s = [3, 6, 10, 11].includes(q.house) ? 4 : 3;
  if (q.combust) s--; if (q.avastha === 'मृत' && s > 2) s--;
  if (['Sun', 'Mars', 'Saturn'].includes(p) && [3, 6, 11].includes(q.house)) s++;
  return Math.max(1, Math.min(5, s));
}
const starStr = n => '⭐'.repeat(n) + '<span class="dim">' + '☆'.repeat(5 - n) + '</span>';
const lordOf = (k, h) => Astro.SIGN_LORD[(k.lagnaSign + h - 1) % 12];
const inHouse = (k, h) => P.filter(p => k.planets[p].house === h);
const pn = p => `<b style="color:${K.P[p].c}">${K.P[p].em} ${K.P[p].hi}</b>`;

function findYogas(k) {
  const q = k.planets, Y = [], Dsh = [];
  const kendra = [1, 4, 7, 10];
  const MP = { Mars: ['रुचक योग', 'साहस, भूमि, सेना/पुलिस/खेल में ऊंचा पद, शारीरिक बल'], Mercury: ['भद्र योग', 'तेज बुद्धि, वाणी, व्यापार और लेखन में असाधारण सफलता'], Jupiter: ['हंस योग', 'ज्ञान, धर्म, सम्मान, संतान सुख और आध्यात्मिक ऊंचाई'], Venus: ['मालव्य योग', 'सुंदरता, कला, वाहन, वैभव और सुखी वैवाहिक जीवन'], Saturn: ['शश योग', 'दीर्घायु, न्याय, बड़ी संस्था में अधिकार और जनसमर्थन'] };
  for (const p in MP) if (kendra.includes(q[p].house) && ['uchch', 'swa'].includes(q[p].dignity))
    Y.push({ n: MP[p][0], how: `${K.P[p].hi} ${ord(q[p].house)} भाव (केंद्र) में ${K.DIG[q[p].dignity]} में`, f: MP[p][1], tag: 'पंचमहापुरुष योग — अत्यंत दुर्लभ और शक्तिशाली' });
  const fromMoon = p => ((q[p].sign - q.Moon.sign + 12) % 12) + 1;
  if (kendra.includes(fromMoon('Jupiter'))) Y.push({ n: 'गजकेसरी योग', how: `गुरु चंद्रमा से ${ord(fromMoon('Jupiter'))} स्थान (केंद्र) में`, f: 'यश, बुद्धिमत्ता, धन और समाज में प्रतिष्ठा; शत्रुओं पर विजय' });
  if (q.Sun.sign === q.Mercury.sign) Y.push({ n: 'बुधादित्य योग', how: `सूर्य + बुध ${ord(q.Sun.house)} भाव में साथ`, f: 'तीव्र बुद्धि, शिक्षा, गणना-लेखन और प्रशासन में सफलता' });
  if (q.Moon.sign === q.Mars.sign) Y.push({ n: 'चंद्र-मंगल (लक्ष्मी) योग', how: `चंद्र + मंगल ${ord(q.Moon.house)} भाव में`, f: 'धन कमाने की प्रबल क्षमता, साहसी निर्णय से लाभ' });
  // केंद्र-त्रिकोण राजयोग
  const kl = new Set([1, 4, 7, 10].map(h => lordOf(k, h))), tl = new Set([5, 9].map(h => lordOf(k, h)));
  const done = new Set();
  for (const a of kl) for (const b of tl) if (a !== b && q[a].sign === q[b].sign) {
    const key = [a, b].sort().join(); if (done.has(key)) continue; done.add(key);
    Y.push({ n: 'केंद्र-त्रिकोण राजयोग', how: `केंद्रेश ${K.P[a].hi} + त्रिकोणेश ${K.P[b].hi} ${ord(q[a].house)} भाव में साथ`, f: 'पद, अधिकार, मान-सम्मान और जीवन में ऊंचा उठने का योग' });
  }
  for (const h of [6, 8, 12]) { const l = lordOf(k, h); if ([6, 8, 12].includes(q[l].house) && q[l].house !== h) { Y.push({ n: 'विपरीत राजयोग', how: `${ord(h)} भाव के स्वामी ${K.P[l].hi} ${ord(q[l].house)} भाव में`, f: 'संकट के बाद अचानक उन्नति; विरोधी स्वयं हारते हैं' }); break; } }
  const l2 = lordOf(k, 2), l11 = lordOf(k, 11);
  if (l2 !== l11 && q[l2].sign === q[l11].sign) Y.push({ n: 'धन योग', how: `धनेश ${K.P[l2].hi} + लाभेश ${K.P[l11].hi} साथ`, f: 'धन संचय, आय के कई स्रोत, आर्थिक स्थिरता' });
  for (const p of ['Mars', 'Jupiter', 'Saturn', 'Venus', 'Mercury', 'Sun']) if (q[p].dignity === 'uchch' && !Y.some(y => y.how.startsWith(K.P[p].hi + ' ')))
    Y.push({ n: `उच्च ${K.P[p].hi}`, how: `${K.P[p].hi} ${K.SIGN[q[p].sign]} (उच्च राशि) में, ${ord(q[p].house)} भाव`, f: `${K.P[p].key} के क्षेत्र में विशेष बल और सफलता` });

  // दोष
  const mg = [1, 4, 7, 8, 12], mL = mg.includes(q.Mars.house), mM = mg.includes(fromMoon('Mars'));
  if (mL || mM) Dsh.push({ n: 'मांगलिक दोष', how: (mL ? `लग्न कुंडली में मंगल ${ord(q.Mars.house)} भाव में` : 'लग्न कुंडली से मांगलिक नहीं') + (mM ? ` • चंद्र कुंडली से मंगल ${ord(fromMoon('Mars'))} स्थान में` : ''), f: (mL ? 'वैवाहिक जीवन में ऊर्जा का टकराव, विवाह में देरी संभव। ' : 'हल्का (आंशिक) मांगलिक प्रभाव। ') + (['uchch', 'swa'].includes(q.Mars.dignity) ? 'मंगल स्वराशि/उच्च होने से दोष का प्रभाव काफी कम है। ' : '') + 'मांगलिक जीवनसाथी से मिलान उत्तम।', u: 'हनुमान चालीसा 40 दिन • मंगलवार को लाल मसूर दान • मीठी रोटी गाय को' });
  const r = q.Rahu.lon, inArc = l => ((l - r + 360) % 360) < 180;
  const side = P.slice(0, 7).map(p => inArc(q[p].lon));
  if (side.every(x => x) || side.every(x => !x)) Dsh.push({ n: 'कालसर्प योग', how: 'सभी सात ग्रह राहु-केतु के एक ही ओर', f: 'जीवन में संघर्ष और अचानक रुकावटें, किंतु मेहनत से बड़ी सफलता भी मिलती है।', u: 'नाग पंचमी पर शिव अभिषेक • "ॐ नमः शिवाय" 108 बार रोज • चांदी का नाग-नागिन जोड़ा बहते जल में' });
  if (q.Jupiter.sign === q.Rahu.sign) Dsh.push({ n: 'गुरु-चांडाल योग', how: `गुरु + राहु ${ord(q.Jupiter.house)} भाव में`, f: 'गुरुजनों से मतभेद, धर्म में भ्रम; निर्णय सोच-समझकर लें।', u: 'गुरुवार को पीली वस्तुएं दान • माथे पर केसर तिलक • बड़ों का आशीर्वाद' });
  for (const L of ['Sun', 'Moon']) for (const N of ['Rahu', 'Ketu']) if (q[L].sign === q[N].sign)
    Dsh.push({ n: `ग्रहण दोष (${K.P[L].hi}-${K.P[N].hi})`, how: `${K.P[L].hi} + ${K.P[N].hi} ${ord(q[L].house)} भाव में`, f: L === 'Sun' ? 'पिता, सरकारी कार्य और आत्मविश्वास में कभी-कभी बाधा।' : 'मानसिक बेचैनी और माता के स्वास्थ्य पर ध्यान दें।', u: L === 'Sun' ? 'रोज सूर्य को जल • गेहूं-गुड़ दान रविवार' : 'सोमवार को शिवलिंग पर दूध • चांदी धारण' });
  const near = P.filter(p => !['Sun', 'Rahu', 'Ketu', 'Moon'].includes(p)).some(p => [2, 12].includes(fromMoon(p)) || q[p].sign === q.Moon.sign);
  if (!near) Dsh.push({ n: 'केमद्रुम योग', how: 'चंद्रमा के आगे-पीछे कोई ग्रह नहीं', f: 'मन में अकेलापन और आर्थिक उतार-चढ़ाव; मेहनत से स्थिरता आती है।', u: 'सोमवार व्रत • माता की सेवा • चांदी का कड़ा' });
  return { Y, Dsh };
}

function sadeSati(k) {
  const moon = k.planets.Moon.sign, now = new Date();
  const phase = s => { const d = (s - moon + 12) % 12; return d === 11 ? 1 : d === 0 ? 2 : d === 1 ? 3 : 0; };
  const cur = Astro.transitSaturnSign(now), ph = phase(cur);
  let start = null, end = null;
  const t = new Date(now);
  if (ph) { // पीछे जाकर शुरुआत खोजें
    const b = new Date(now); for (let i = 0; i < 120; i++) { b.setMonth(b.getMonth() - 1); if (!phase(Astro.transitSaturnSign(b))) { start = new Date(b); start.setMonth(start.getMonth() + 1); break; } }
    for (let i = 0; i < 120; i++) { t.setMonth(t.getMonth() + 1); if (!phase(Astro.transitSaturnSign(t))) { end = new Date(t); break; } }
  } else {
    for (let i = 0; i < 400; i++) { t.setMonth(t.getMonth() + 1); if (phase(Astro.transitSaturnSign(t))) { start = new Date(t); break; } }
    if (start) { const e = new Date(start); for (let i = 0; i < 120; i++) { e.setMonth(e.getMonth() + 1); if (!phase(Astro.transitSaturnSign(e))) { end = new Date(e); break; } } }
  }
  const d = (cur - moon + 12) % 12;
  const dhaiya = d === 3 ? 'चतुर्थ ढैय्या (कंटक शनि) चल रही है' : d === 7 ? 'अष्टम ढैय्या चल रही है' : '';
  return { ph, cur, start, end, dhaiya };
}

/* ---------- कुंडली चार्ट (उत्तर भारतीय शैली) ---------- */
const HPOS = [null, [200, 100], [100, 36], [36, 100], [100, 200], [36, 300], [100, 364], [200, 300], [300, 364], [364, 300], [300, 200], [364, 100], [300, 36]];
const SPOS = [null, [200, 182], [100, 90], [88, 104], [182, 204], [88, 304], [100, 322], [200, 230], [300, 322], [314, 304], [220, 204], [314, 104], [300, 90]];
function chartSVG(k, mode) {
  const g = []; let txt = '';
  for (let h = 1; h <= 12; h++) {
    const [x, y] = HPOS[h];
    const signNo = mode === 'lk' ? h : ((k.lagnaSign + h - 1) % 12) + 1;
    const [sx, sy] = SPOS[h];
    txt += `<text x="${sx}" y="${sy + 4}" class="sn">${signNo}</text>`;
    const ps = inHouse(k, h);
    const lines = ps.map(p => ({ t: K.P[p].short + (k.planets[p].retro && p !== 'Rahu' && p !== 'Ketu' ? '(व)' : '') + ' ' + Math.floor(k.planets[p].deg) + '°', c: K.P[p].c }));
    if (h === 1 && mode !== 'lk') lines.unshift({ t: 'लग्न ' + Math.floor(k.lagnaDeg) + '°', c: EMBED ? '#93301f' : '#ffd76a' });
    const big = [1, 4, 7, 10].includes(h), lh = big ? 17 : 13, y0 = y - (lines.length - 1) * lh / 2 - (big ? 10 : 0);
    lines.forEach((l, i) => txt += `<text x="${x}" y="${y0 + i * lh + 5}" class="pl${big ? '' : ' sm'}" style="fill:${l.c}">${l.t}</text>`);
  }
  return `<svg viewBox="0 0 400 400" class="chart"><defs><linearGradient id="cg${mode}" x1="0" y1="0" x2="1" y2="1">${EMBED ? '<stop offset="0" stop-color="#ee6f16"/><stop offset="1" stop-color="#6b1418"/>' : '<stop offset="0" stop-color="#ff9a3c"/><stop offset=".5" stop-color="#ff4fa3"/><stop offset="1" stop-color="#7b6cff"/>'}</linearGradient></defs>
  <rect x="2" y="2" width="396" height="396" rx="14" fill="rgba(255,255,255,.03)" stroke="url(#cg${mode})" stroke-width="3"/>
  <path d="M2 2L398 398M398 2L2 398M200 2L398 200L200 398L2 200Z" fill="none" stroke="url(#cg${mode})" stroke-width="2"/>${txt}</svg>`;
}

/* ---------- रिपोर्ट ---------- */
function sec(no, en, title, sub, icon, body, hue) {
  return `<section class="sec" data-k="s${no}" style="--h:${hue}"><div class="sec-head"><div><div class="sec-no">SECTION ${String(no).padStart(2, '0')} — ${en}</div><h2>${title}</h2><p class="sub">${sub}</p></div><div class="sec-ic">${icon}</div></div>${body}</section>`;
}
function buildReport(k, u) {
  const q = k.planets, ln = k.lagnaSign, ms = q.Moon.sign, now = new Date();
  const lagnaLord = Astro.SIGN_LORD[ln], rashiLord = Astro.SIGN_LORD[ms];
  const nak = K.NAK[q.Moon.nak];
  const curMaha = k.dasha.list.find(d => d.start <= now && d.end > now) || k.dasha.list[0];
  const curAntar = curMaha.antar.find(a => a.start <= now && a.end > now) || curMaha.antar[0];
  const [dy, dm, dd] = u.dob.split('-').map(Number);
  const mulank = root(dd), bhagyank = root(digitSum(u.dob));
  const latin = (u.ename || (/[a-z]/i.test(u.name) ? u.name : '')).toUpperCase().replace(/[^A-Z]/g, '');
  const nameComp = latin ? latin.split('').reduce((a, c) => a + (CHALDEAN[c] || 0), 0) : 0;
  const nameNo = nameComp ? root(nameComp) : null;
  const paya = [null, 'सोना', 'चांदी', 'तांबा', 'लोहा', 'चांदी', 'सोना', 'तांबा', 'लोहा', 'चांदी', 'तांबा', 'सोना', 'लोहा'][q.Moon.house];
  const days = [...new Set([lagnaLord, lordOf(k, 5), lordOf(k, 9)].map(p => K.P[p].day))].join(', ');
  const ML = K.MULANK[mulank];
  const { Y, Dsh } = findYogas(k);
  const ss = sadeSati(k);
  const strong = P.filter(p => ['uchch', 'swa'].includes(q[p].dignity) && p !== 'Rahu' && p !== 'Ketu');
  const weak = P.filter(p => stars(p, q[p]) <= 2);
  const hn = u.name + ' जी';

  /* हीरो */
  const rid = 'AV-' + (Math.abs([...(u.name + u.dob + u.tob)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)) % 2176782336).toString(36).toUpperCase().padStart(6, '0');
  const today = fmt(now);
  let h = `<div class="r-hero"><div class="om">ॐ</div><div class="r-lh"><div class="r-logo"><div class="mark"><span>✦</span></div><div><b>ASTRO VIKASS</b><small>लाल किताब • वैदिक ज्योतिष • अंक ज्योतिष</small></div></div><div class="r-id"><span>रिपोर्ट नं. <b>${rid}</b></span><span>दिनांक: ${today}</span><span>☎ 7069492135</span></div></div><div class="r-rule"><i></i><span>✦ ॐ ✦</span><i></i></div><div class="r-kicker">लाल किताब संपूर्ण विश्लेषण</div><h1 class="r-name">${esc(u.name)}</h1>
  <div class="r-meta">जन्म: ${fmt(new Date(dy, dm - 1, dd))} | समय: ${u.tob} | ${esc(u.place)}</div>
  <div class="chips"><span class="chip c1">${K.SIGN_ICON[ln]} ${K.SIGN[ln]} लग्न</span><span class="chip c2">🌙 ${K.SIGN[ms]} राशि</span><span class="chip c3">✨ ${nak[0]} नक्षत्र</span><span class="chip c4">🪐 ${K.P[curMaha.lord].hi} महादशा</span></div></div>`;
  h += `<div class="ktoc" id="ktoc"><div class="ktoc-h"><b>📑 रिपोर्ट के खंड</b><small>जो देखना हो उस पर टैप करें</small></div><div class="ktoc-g">${TOC.map(([kk, ic, t], i) => `<button type="button" data-k="${kk}"${i ? '' : ' class="on"'} onclick="kTab('${kk}')"><i>${ic}</i><span>${t}</span></button>`).join('')}</div></div>`;

  /* जन्म विवरण */
  const cell = (a, b, c) => `<div class="info" style="--c:${c}"><small>${a}</small><b>${b}</b></div>`;
  h += `<section class="sec" data-k="info" style="--h:40"><h3 class="ct">📋 जन्म विवरण एवं ग्रह स्थिति</h3><div class="grid-info">
  ${cell('लग्न', `${K.SIGN[ln]} (${K.SIGN_EN[ln]}) ${Math.floor(k.lagnaDeg)}°`, '#ff9a3c')}${cell('लग्न स्वामी', K.P[lagnaLord].em + ' ' + K.P[lagnaLord].hi, '#ff6a3c')}
  ${cell('जन्म राशि', `${K.SIGN[ms]} (${K.SIGN_EN[ms]})`, '#4fc3ff')}${cell('राशि स्वामी', K.P[rashiLord].em + ' ' + K.P[rashiLord].hi, '#4f8bff')}
  ${cell('जन्म नक्षत्र', `${nak[0]} – चरण ${q.Moon.pada}`, '#c06bff')}${cell('नक्षत्र स्वामी', K.P[nak[1]].em + ' ' + K.P[nak[1]].hi, '#9b6bff')}
  ${cell('वर्तमान महादशा', `${K.P[curMaha.lord].hi} (${yr(curMaha.start)}–${yr(curMaha.end)})`, '#ff4fa3')}${cell('अंतर्दशा', `${K.P[curAntar.lord].hi} (${fmt(curAntar.end)} तक)`, '#ff4f78')}
  ${cell('मूलांक / भाग्यांक', `${mulank} / ${bhagyank}`, '#ffc400')}${cell('शुभ अंक', ML.lucky, '#ffb000')}
  ${cell('भाग्यशाली दिन', days, '#1fd17a')}${cell('शुभ रत्न', K.P[lagnaLord].gem, '#17c3a5')}
  ${cell('इष्ट देव', ISHTA[lagnaLord], '#ff8a00')}${cell('पाया', paya, '#c08b5c')}
  </div></section>`;

  /* चार्ट */
  h += `<section class="sec" data-k="chart" style="--h:300"><div class="charts"><div><h3 class="ct">🪔 लग्न कुंडली</h3>${chartSVG(k, 'lagna')}</div><div><h3 class="ct">📕 लाल किताब कुंडली</h3>${chartSVG(k, 'lk')}<p class="note">लाल किताब में पहला भाव हमेशा मेष (1) माना जाता है; ग्रह अपने भाव के अनुसार ही रहते हैं।</p></div></div></section>`;

  /* ग्रह तालिका */
  h += `<section class="sec" data-k="graha" style="--h:200"><h3 class="ct">🪐 ग्रह स्पष्ट</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>ग्रह</th><th>राशि</th><th>अंश</th><th>भाव</th><th>नक्षत्र</th><th>स्थिति</th></tr></thead><tbody>
  ${P.map(p => { const x = q[p]; const st = (p === 'Rahu' || p === 'Ketu') ? 'छाया ग्रह' : K.DIG[x.dignity] + (['uchch', 'swa'].includes(x.dignity) ? ' ⭐' : ''); return `<tr><td>${pn(p)}${x.retro && p !== 'Rahu' && p !== 'Ketu' ? ' <span class="tag r">वक्री</span>' : ''}${x.combust ? ' <span class="tag a">अस्त</span>' : ''}</td><td>${K.SIGN[x.sign]}</td><td>${Math.floor(x.deg)}°${String(Math.floor((x.deg % 1) * 60)).padStart(2, '0')}'</td><td>${ord(x.house)}</td><td>${K.NAK[x.nak][0]} – ${x.pada}</td><td class="st-${x.dignity}">${st}</td></tr>`; }).join('')}
  </tbody></table></div></section>`;

  /* SECTION 1 */
  const keyLine = `${K.SIGN[ln]} लग्न` + strong.map(p => ` + ${K.DIG[q[p].dignity].replace(' राशि', '')} ${K.P[p].hi} (${ord(q[p].house)})`).join('');
  let s1 = `<blockquote class="quote">"${keyLine} — ${strong.length >= 2 ? 'यह ग्रह संयोग अत्यंत शुभ और शक्तिशाली है।' : 'यही आपकी कुंडली की मूल शक्ति है।'}"</blockquote>
  <h4>${K.SIGN_ICON[ln]} ${K.SIGN[ln]} लग्न — व्यक्तित्व का आधार</h4><p>${hn} का लग्न ${K.SIGN[ln]} है जिसके स्वामी ${K.P[lagnaLord].hi} हैं। ${K.LAGNA[ln].n} लग्नेश ${K.P[lagnaLord].hi} ${ord(q[lagnaLord].house)} भाव (${K.HOUSE[q[lagnaLord].house]}) में ${K.SIGN[q[lagnaLord].sign]} राशि में ${K.DIG[q[lagnaLord].dignity]} है — इसलिए जीवन की ऊर्जा ${K.HOUSE[q[lagnaLord].house]} के क्षेत्र में सबसे अधिक लगेगी।</p>`;
  if (strong.length) s1 += `<h4>⭐ प्रमुख बलवान ग्रह</h4><div class="cards">${strong.map(p => `<div class="pc" style="--c:${K.P[p].c}"><div class="pc-h">${K.P[p].em} ${K.DIG[q[p].dignity]} ${K.P[p].hi}</div><p>${K.SIGN[q[p].sign]} राशि में ${K.P[p].hi} (${Math.floor(q[p].deg)}°), ${ord(q[p].house)} भाव में। ${K.P[p].key} के क्षेत्र में विशेष बल। ${K.LK[p][q[p].house - 1][0]}</p></div>`).join('')}</div>`;
  s1 += `<h4>📊 ग्रह शक्ति तालिका</h4><div class="tbl-wrap"><table class="tbl"><thead><tr><th>ग्रह</th><th>भाव</th><th>स्थिति</th><th>अवस्था</th><th>शक्ति</th></tr></thead><tbody>${P.map(p => `<tr><td>${pn(p)}</td><td>${ord(q[p].house)}${[3, 6, 10, 11].includes(q[p].house) ? ' (उपचय)' : ''}</td><td>${p === 'Rahu' || p === 'Ketu' ? 'वक्री' : K.DIG[q[p].dignity]}${q[p].combust ? ', अस्त' : ''}</td><td>${p === 'Rahu' || p === 'Ketu' ? '--' : q[p].avastha}</td><td>${starStr(stars(p, q[p]))}</td></tr>`).join('')}</tbody></table></div>`;
  const crowded = [...Array(12)].map((_, i) => i + 1).filter(hh => inHouse(k, hh).length >= 3);
  crowded.forEach(hh => s1 += `<div class="finding"><b>⭐ CRITICAL FINDING</b><p>${ord(hh)} भाव (${K.HOUSE[hh]}) में ${inHouse(k, hh).length} ग्रह (${inHouse(k, hh).map(p => K.P[p].hi).join(' + ')}) — यह भाव आपके जीवन का केंद्र है; इसके विषयों में सबसे बड़ी घटनाएं और उपलब्धियां होंगी।</p></div>`);
  h += sec(1, 'TECHNICAL FOUNDATION', 'खगोलीय एवं तकनीकी आधार', 'ग्रह शक्ति, अवस्था एवं सूक्ष्म विश्लेषण', '🔭', s1, 30);

  /* SECTION 2 */
  let s2 = `<h4>🏆 प्रमुख राजयोग एवं शुभ योग</h4>` + (Y.length ? `<div class="cards">${Y.map(y => `<div class="yc"><div class="yc-h">${y.n} ⭐</div><p><b>निर्माण:</b> ${y.how}</p><p><b>फल:</b> ${y.f}</p>${y.tag ? `<p class="dim">${y.tag}</p>` : ''}</div>`).join('')}</div>` : '<p>कुंडली में कोई प्रमुख शास्त्रीय राजयोग नहीं बन रहा, किंतु ग्रहों की शुभ स्थिति से परिश्रम द्वारा अच्छी सफलता मिलेगी।</p>');
  s2 += `<h4>⚠️ महत्वपूर्ण दोष एवं चुनौतियां</h4>` + (Dsh.length ? `<div class="cards">${Dsh.map(d => `<div class="dc"><div class="dc-h">${d.n}</div><p><b>स्थिति:</b> ${d.how}</p><p>${d.f}</p><p class="up"><b>उपाय:</b> ${d.u}</p></div>`).join('')}</div>` : '<p>✅ कुंडली में मांगलिक, कालसर्प या ग्रहण जैसा कोई प्रमुख दोष नहीं है।</p>');
  s2 += `<div class="dc ss"><div class="dc-h">🪐 साढ़े साती — वर्तमान स्थिति</div><p>${ss.ph ? `इस समय शनि ${K.SIGN[ss.cur]} राशि में हैं — साढ़े साती का <b>${['', 'पहला (उदय)', 'दूसरा (चरम)', 'तीसरा (अस्त)'][ss.ph]} चरण</b> चल रहा है${ss.start ? ` (${fmt(ss.start)} से` : ''}${ss.end ? ` ${fmt(ss.end)} तक)` : ')'}। प्रभाव: व्यय वृद्धि, मानसिक दबाव, संबंधों में धैर्य की परीक्षा।` : `इस समय साढ़े साती नहीं चल रही (शनि ${K.SIGN[ss.cur]} में)। ${ss.dhaiya ? '⚠️ ' + ss.dhaiya + '। ' : ''}${ss.start ? `अगली साढ़े साती लगभग ${fmt(ss.start)} से ${ss.end ? fmt(ss.end) : ''} तक रहेगी।` : ''}`}</p><p class="up"><b>उपाय:</b> शनिवार को पीपल पर सरसों तेल का दीपक • हनुमान चालीसा • काले तिल दान</p></div>`;
  s2 += `<h4>🏠 भाव-वार फलादेश</h4><div class="houses">${[...Array(12)].map((_, i) => i + 1).filter(hh => inHouse(k, hh).length).map(hh => `<div class="hc"><b>${ord(hh)} भाव — ${inHouse(k, hh).map(p => K.P[p].hi).join(' + ')}</b><small>${K.HOUSE[hh]}</small><p>${inHouse(k, hh).map(p => K.LK[p][hh - 1][0]).join(' ')}</p></div>`).join('')}</div>`;
  h += sec(2, 'YOGA & BHAVA', 'योग एवं भाव विश्लेषण', 'राजयोग, दोष और भाव फलादेश', '⚡', s2, 330);

  /* SECTION 3 */
  const L = K.LAGNA[ln];
  let s3 = `<blockquote class="quote">"${K.SIGN[ln]} लग्न + ${nak[0]} नक्षत्र + ${K.P[nak[1]].hi} नक्षत्र स्वामी — ${nak[2]}"</blockquote>
  <h4>👤 मुख्य व्यक्तित्व लक्षण</h4><p>${L.n} चंद्रमा ${K.SIGN[ms]} राशि में होने से ${K.RASHI[ms]} ${nak[0]} नक्षत्र के प्रभाव से आप ${nak[2]}</p>
  <div class="two"><div class="good"><b>सकारात्मक गुण</b><ul>${L.plus.map(x => `<li>🔱 ${x}</li>`).join('')}<li>🔱 ${K.P[q.Moon.sign === ms ? nak[1] : nak[1]].key} में स्वाभाविक रुचि</li></ul></div><div class="bad"><b>चुनौतियां</b><ul>${L.minus.map(x => `<li>🔱 ${x}</li>`).join('')}${weak.slice(0, 2).map(p => `<li>🔱 ${K.P[p].hi} कमजोर — ${AVOID[p]} से बचें</li>`).join('')}</ul></div></div>
  <h4>🧍 शारीरिक बनावट</h4><p>${L.body} ${inHouse(k, 1).length ? 'लग्न में ' + inHouse(k, 1).map(p => K.P[p].hi).join(', ') + ' होने से व्यक्तित्व पर इनका गहरा प्रभाव।' : ''}</p>`;
  h += sec(3, 'PERSONAL DNA', 'व्यक्तिगत DNA एवं स्वरूप', 'व्यक्तित्व, शारीरिक बनावट, आंतरिक ऊर्जा', '🧬', s3, 260);

  /* SECTION 4 */
  const l10 = lordOf(k, 10), in10 = inHouse(k, 10), l2 = lordOf(k, 2), l11 = lordOf(k, 11);
  const car = [...new Set([...K.CAREER[l10], ...in10.flatMap(p => K.CAREER[p].slice(0, 2)), ...strong.flatMap(p => K.CAREER[p].slice(0, 2)), ...K.CAREER[lagnaLord].slice(0, 2)])].slice(0, 10);
  let s4 = `<p>दशम भाव (कर्म) में ${K.SIGN[(ln + 9) % 12]} राशि है, जिसके स्वामी ${pn(l10)} ${ord(q[l10].house)} भाव में ${K.DIG[q[l10].dignity]} में हैं। ${in10.length ? 'दशम भाव में ' + in10.map(p => K.P[p].hi).join(', ') + ' स्थित है — ' + in10.map(p => K.LK[p][9][0]).join(' ') : 'दशम भाव खाली है, इसलिए करियर दशम-स्वामी और दशा के अनुसार फल देगा।'}</p>
  <h4>💼 सर्वोत्तम करियर क्षेत्र</h4><div class="pills">${car.map(c => `<span>${c}</span>`).join('')}</div>
  <h4>💰 धनार्जन के स्रोत</h4><div class="cards">
  <div class="pc" style="--c:#ffc400"><div class="pc-h">प्राथमिक (धन भाव)</div><p>धनेश ${K.P[l2].hi} ${ord(q[l2].house)} भाव में — ${K.HOUSE[q[l2].house]} से जुड़े कार्यों से धन संचय। ${stars(l2, q[l2]) >= 4 ? 'धन की स्थिति मजबूत।' : 'बचत पर ध्यान देने से स्थिरता।'}</p></div>
  <div class="pc" style="--c:#1fd17a"><div class="pc-h">लाभ (11वां भाव)</div><p>लाभेश ${K.P[l11].hi} ${ord(q[l11].house)} भाव में — ${K.HOUSE[q[l11].house]} से आय के अवसर। ${inHouse(k, 11).length ? '11वें में ' + inHouse(k, 11).map(p => K.P[p].hi).join(', ') + ' — आय के कई स्रोत।' : ''}</p></div>
  <div class="pc" style="--c:#4fc3ff"><div class="pc-h">निवेश सलाह</div><p>${q.Saturn.dignity === 'swa' || q.Saturn.dignity === 'uchch' || q.Jupiter.house === 2 || q.Jupiter.house === 11 ? 'दीर्घकालिक निवेश — FD, सोना, जमीन — धीमे पर स्थिर लाभ देंगे।' : 'सोच-समझकर निवेश करें; सट्टे और जल्दबाजी से बचें।'}</p></div></div>`;
  h += sec(4, 'CAREER & WEALTH', 'करियर, धन एवं प्रतिष्ठा', 'कर्म, धनार्जन और सामाजिक ऊंचाई', '💼', s4, 45);

  /* SECTION 5 */
  const l7 = lordOf(k, 7), in7 = inHouse(k, 7), l5 = lordOf(k, 5);
  const delay = in7.some(p => ['Saturn', 'Rahu', 'Ketu', 'Sun'].includes(p)) || q.Venus.dignity === 'neech' || q.Venus.combust || q.Saturn.house === 1;
  let s5 = `<h4>💍 विवाह एवं जीवनसाथी</h4><p>सप्तम भाव में ${K.SIGN[(ln + 6) % 12]} राशि है; स्वामी ${pn(l7)} ${ord(q[l7].house)} भाव में। ${K.SPOUSE[l7]}</p>
  ${in7.length ? `<p>सप्तम भाव में ${in7.map(p => pn(p)).join(' + ')}: ${in7.map(p => K.SPOUSE[p]).join(' ')}</p>` : ''}
  <p>प्रेम कारक शुक्र ${K.SIGN[q.Venus.sign]} में ${K.DIG[q.Venus.dignity]} (${ord(q.Venus.house)} भाव) — ${stars('Venus', q.Venus) >= 4 ? 'वैवाहिक सुख और आकर्षण उत्तम।' : 'संबंधों में धैर्य और सम्मान से सुख बढ़ेगा।'}</p>
  <div class="finding"><b>⏳ विवाह का समय</b><p>${delay ? 'ग्रह स्थिति के अनुसार विवाह में कुछ देरी संभव है — किंतु देर से हुआ विवाह अधिक स्थिर और सुखद रहेगा।' : 'ग्रह स्थिति सामान्य आयु में विवाह का संकेत देती है।'} शुक्र, गुरु या सप्तमेश ${K.P[l7].hi} की दशा-अंतर्दशा विवाह के लिए सबसे अनुकूल समय है।</p></div>
  <h4>👶 संतान</h4><p>पंचम भाव के स्वामी ${pn(l5)} ${ord(q[l5].house)} भाव में; संतान कारक गुरु ${K.DIG[q.Jupiter.dignity]} में ${ord(q.Jupiter.house)} भाव में। ${stars('Jupiter', q.Jupiter) >= 4 ? 'संतान सुख उत्तम, संतान बुद्धिमान और भाग्यशाली होगी।' : 'संतान सुख मिलेगा; गुरुवार को पीली वस्तुओं का दान शुभ रहेगा।'} ${inHouse(k, 5).length ? '5वें भाव में ' + inHouse(k, 5).map(p => K.P[p].hi).join(', ') + ' — ' + inHouse(k, 5).map(p => K.LK[p][4][0]).join(' ') : ''}</p>`;
  h += sec(5, 'MARRIAGE & CHILDREN', 'विवाह एवं संतान', 'जीवनसाथी, वैवाहिक सुख और संतान योग', '💞', s5, 320);

  /* SECTION 6 */
  const l6 = inHouse(k, 6), l8 = inHouse(k, 8);
  let s6 = `<p>${K.SIGN[ln]} लग्न के अनुसार इन अंगों का विशेष ध्यान रखें: <b>${L.health}</b>।</p>
  <div class="cards"><div class="pc" style="--c:#1fd17a"><div class="pc-h">रोग भाव (6वां)</div><p>${l6.length ? l6.map(p => K.P[p].hi).join(', ') + ' — ' + (l6.some(p => ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'].includes(p)) ? 'रोग प्रतिरोधक क्षमता अच्छी, बीमारी पर जल्दी विजय।' : 'खान-पान में संयम से स्वास्थ्य अच्छा रहेगा।') : 'खाली — सामान्यतः स्वास्थ्य स्थिर।'}</p></div>
  <div class="pc" style="--c:#ff4f78"><div class="pc-h">आयु भाव (8वां)</div><p>${l8.length ? l8.map(p => K.P[p].hi).join(', ') + ' — ' + l8.map(p => K.LK[p][7][0]).join(' ') : 'खाली — दीर्घायु के लिए शुभ।'}</p></div>
  <div class="pc" style="--c:#7fb3ff"><div class="pc-h">मानसिक स्वास्थ्य (चंद्र)</div><p>चंद्र ${K.DIG[q.Moon.dignity]} में, ${ord(q.Moon.house)} भाव — ${stars('Moon', q.Moon) >= 4 ? 'मन स्थिर और सकारात्मक।' : 'ध्यान-प्राणायाम से मानसिक शांति बढ़ेगी।'}</p></div></div>`;
  h += sec(6, 'HEALTH & LONGEVITY', 'स्वास्थ्य एवं आयु', 'शरीर, रोग प्रतिरोध और दीर्घायु', '🌿', s6, 150);

  /* SECTION 7 — लाल किताब */
  let s7 = `<p>नीचे आपकी कुंडली के हर ग्रह का लाल किताब के अनुसार फल और अचूक उपाय है। उपाय 40 या 43 दिन तक बिना रुके करें।</p><div class="lk">${P.map((p, i) => `<div class="lkc" style="--c:${K.P[p].c}"><div class="lk-no">${i + 1}</div><div><div class="lk-h">${K.P[p].em} ${K.P[p].hi} — ${ord(q[p].house)} भाव ${['uchch', 'swa'].includes(q[p].dignity) ? '⭐' : ''}</div><p>${K.LK[p][q[p].house - 1][0]}</p><p class="up"><b>🛡️ उपाय:</b> ${K.LK[p][q[p].house - 1][1]}</p></div></div>`).join('')}</div>`;
  h += sec(7, 'LAL KITAB', 'लाल किताब फलादेश एवं अचूक उपाय', 'ग्रह-भाव के अनुसार फल और टोटके', '📕', s7, 0);

  /* SECTION 8 — दशा */
  const antarTxt = a => { const x = q[a.lord], s = stars(a.lord, x); return `${K.P[a.lord].key} — ${ord(x.house)} भाव (${K.HOUSE[x.house]}) के विषय सक्रिय। ${s >= 4 ? '✅ शुभ परिणाम, प्रगति।' : s <= 2 ? '⚠️ सावधानी, उपाय करें।' : 'मिश्रित फल, मेहनत से लाभ।'}`; };
  let s8 = `<div class="finding big"><b>🔮 वर्तमान ${K.P[curMaha.lord].hi} महादशा (${yr(curMaha.start)}–${yr(curMaha.end)})</b><p>${K.P[curMaha.lord].hi} ${K.SIGN[q[curMaha.lord].sign]} राशि, ${ord(q[curMaha.lord].house)} भाव में ${K.DIG[q[curMaha.lord].dignity]}। ${K.DASHA_PHAL[curMaha.lord]}</p></div>
  <h4>📆 अंतर्दशा फल (${K.P[curMaha.lord].hi} महादशा)</h4><div class="antar">${curMaha.antar.map(a => `<div class="an ${a === curAntar ? 'now' : ''} ${a.end < now ? 'past' : ''}"><div class="an-d">${fmt(a.start)} – ${fmt(a.end)}${a === curAntar ? ' <span class="tag n">अभी</span>' : ''}</div><b>${K.P[a.lord].em} ${K.P[a.lord].hi}</b><p>${antarTxt(a)}</p></div>`).join('')}</div>
  <h4>📅 जीवन की महादशा टाइमलाइन</h4><div class="timeline">${k.dasha.list.filter(d => yr(d.end) > dy && yr(d.start) < dy + 100).map(d => `<div class="tl ${d === curMaha ? 'now' : ''}" style="--c:${K.P[d.lord].c}"><div class="tl-y">${yr(d.start) < dy ? yr(k.birth) : yr(d.start)}–${yr(d.end)}<small>आयु ${Math.max(0, yr(d.start) - dy)}–${yr(d.end) - dy}</small></div><div class="tl-b"><b>${K.P[d.lord].em} ${K.P[d.lord].hi} महादशा ${d === curMaha ? '🌟' : ''}</b><p>${K.DASHA_PHAL[d.lord]}</p></div></div>`).join('')}</div>
  <h4>🗓️ अगले 5 वर्षों का वर्षफल</h4><div class="tbl-wrap"><table class="tbl vf"><thead><tr><th>वर्ष</th><th>दशा</th><th>व्यक्तिगत वर्ष अंक</th><th>फल</th></tr></thead><tbody>${[0, 1, 2, 3, 4].map(i => { const Yr = yr(now) + i, mid = new Date(Yr, 6, 1); const md = k.dasha.list.find(d => d.start <= mid && d.end > mid) || curMaha; const ad = md.antar.find(a => a.start <= mid && a.end > mid) || md.antar[0]; const py = root(dd + dm + digitSum(Yr)); return `<tr><td><b>${Yr}</b></td><td>${K.P[md.lord].hi}–${K.P[ad.lord].hi}</td><td>${py}</td><td>${PY[py]}। ${stars(ad.lord, q[ad.lord]) >= 4 ? 'उन्नति के प्रबल योग।' : stars(ad.lord, q[ad.lord]) <= 2 ? 'धैर्य रखें।' : 'स्थिर प्रगति।'}</td></tr>`; }).join('')}</tbody></table></div>`;
  h += sec(8, 'TIMELINE & DASHA', 'समय चक्र एवं विंशोत्तरी दशा', 'महादशा, अंतर्दशा और वर्षफल', '⏳', s8, 210);

  /* SECTION 9 — अंक ज्योतिष */
  const py = root(dd + dm + digitSum(yr(now)));
  let s9 = `<div class="nums"><div class="num" style="--c:#ff9a3c"><small>मूलांक</small><b>${mulank}</b><span>${ML.g}</span></div><div class="num" style="--c:#ff4fa3"><small>भाग्यांक</small><b>${bhagyank}</b><span>${K.MULANK[bhagyank].g}</span></div>${nameNo ? `<div class="num" style="--c:#7b6cff"><small>नामांक (${latin})</small><b>${nameComp}/${nameNo}</b><span>${K.MULANK[nameNo].g}</span></div>` : ''}<div class="num" style="--c:#1fd17a"><small>व्यक्तिगत वर्ष ${yr(now)}</small><b>${py}</b><span>${K.MULANK[py].g}</span></div></div>
  <p><b>मूलांक ${mulank} (${ML.g}):</b> ${ML.t}</p><p><b>भाग्यांक ${bhagyank}:</b> ${K.MULANK[bhagyank].t}</p>${nameNo ? `<p><b>नामांक ${nameNo}:</b> ${K.MULANK[nameNo].t} ${[mulank, bhagyank].includes(nameNo) || ML.lucky.includes(String(nameNo)) ? '✅ नामांक आपके मूलांक/भाग्यांक से मेल खाता है — शुभ।' : '⚠️ नामांक मूलांक से मेल नहीं खाता; चाहें तो नाम की स्पेलिंग में बदलाव पर विचार करें।'}</p>` : '<p class="dim">नामांक जानने के लिए फॉर्म में नाम अंग्रेज़ी में भी लिखें।</p>'}
  <p><b>वर्ष ${yr(now)}:</b> ${PY[py]}।</p><div class="pills"><span>🔢 शुभ अंक: ${ML.lucky}</span><span>🎨 शुभ रंग: ${ML.col}</span><span>📅 शुभ दिन: ${ML.day}</span></div>`;
  h += sec(9, 'NUMEROLOGY', 'अंक ज्योतिष', 'मूलांक, भाग्यांक, नामांक और वर्ष अंक', '🔢', s9, 50);

  /* SECTION 10 */
  const dos = [`${ISHTA[lagnaLord]} की नियमित पूजा करें`, `${K.P[lagnaLord].day} को ${K.P[lagnaLord].daan} का दान करें`, `${K.P[curMaha.lord].hi} महादशा में "${K.P[curMaha.lord].mantra}" का जाप करें`, `${K.P[lagnaLord].color} रंग का अधिक प्रयोग करें`, ...weak.slice(0, 2).map(p => `${K.P[p].day} को ${K.P[p].daan} दान करें (${K.P[p].hi} को बल देने हेतु)`), 'माता-पिता और गुरुजनों का आशीर्वाद लेकर हर नया काम शुरू करें'];
  const donts = [...new Set([...weak, lagnaLord === 'Sun' ? 'Sun' : null, 'Rahu'].filter(Boolean))].slice(0, 5).map(p => AVOID[p] + ' से बचें');
  const mantras = [...new Set([curMaha.lord, lagnaLord, ...weak.slice(0, 1)])];
  let s10 = `<blockquote class="quote">"${hn} की कुंडली में ${Y.length ? Y.slice(0, 3).map(y => y.n).join(' + ') : keyLine} — सही दिशा में किया गया परिश्रम आपको असाधारण ऊंचाई तक ले जाएगा।"</blockquote>
  <div class="two"><div class="good"><b>✅ क्या करें (Do's)</b><ol>${dos.map(x => `<li>${x}</li>`).join('')}</ol></div><div class="bad"><b>❌ क्या न करें (Don'ts)</b><ol>${donts.map(x => `<li>${x}</li>`).join('')}</ol></div></div>
  <h4>🕉️ मंत्र जाप (108 बार प्रतिदिन)</h4>${mantras.map(p => `<div class="mantra" style="--c:${K.P[p].c}"><b>${K.P[p].mantra}</b><small>${K.P[p].hi} ${p === curMaha.lord ? '— वर्तमान महादशा में सर्वाधिक प्रभावी' : p === lagnaLord ? '— लग्नेश, आत्मबल के लिए' : '— कमजोर ग्रह को बल देने हेतु'} • 40 दिन नियमित</small></div>`).join('')}
  <h4>💎 शुभ तत्व</h4><div class="pills"><span>💎 रत्न: ${K.P[lagnaLord].gem} (लग्नेश)</span><span>💠 सहायक रत्न: ${K.P[lordOf(k, 5)].gem}, ${K.P[lordOf(k, 9)].gem}</span><span>🎨 रंग: ${K.P[lagnaLord].color}</span><span>📅 दिन: ${days}</span><span>🙏 इष्ट: ${ISHTA[lagnaLord]}</span></div>
  <p class="dim">रत्न धारण करने से पहले किसी अनुभवी ज्योतिषी से सलाह अवश्य लें।</p>`;
  h += sec(10, 'GUIDANCE & CONCLUSION', 'मार्गदर्शिका एवं अंतिम निष्कर्ष', "Do's & Don'ts, मंत्र, शुभ तत्व", '🎓', s10, 280);

  const share = `${u.name} की कुंडली: ${K.SIGN[ln]} लग्न, ${K.SIGN[ms]} राशि, ${nak[0]} नक्षत्र, ${K.P[curMaha.lord].hi} महादशा। Astro Vikass पर अपनी मुफ्त लाल किताब कुंडली बनाएं: ${location.href.split('#')[0]}`;
  h += `<div class="kpager" id="kpager"></div>`;
  h += `<div class="actions"><button class="btn" onclick="doPrint()">📄 PDF डाउनलोड</button><a class="btn wa" href="https://wa.me/?text=${encodeURIComponent(share)}" target="_blank" rel="noopener">💬 WhatsApp पर शेयर</a><button class="btn ghost" onclick="document.getElementById('form').scrollIntoView({behavior:'smooth'})">🔄 नई कुंडली</button></div>
  <div class="r-consult"><b>अपनी कुंडली पर विस्तृत परामर्श चाहिए?</b><p>विवाह मिलान, करियर, व्यापार या किसी समस्या के समाधान के लिए Astro Vikass से संपर्क करें — ☎ 7069492135</p><div class="btns"><a class="cta" href="tel:+917069492135" target="_blank">☎ कॉल करें</a><a class="cta wa" href="https://wa.me/917069492135?text=${encodeURIComponent(`नमस्ते, मेरी कुंडली (${u.name}, ${u.dob}, ${u.tob}, ${u.place}) पर परामर्श चाहिए`)}" target="_blank" rel="noopener">WhatsApp करें</a></div></div>
  <div class="r-foot"><div class="r-rule"><i></i><span>✦</span><i></i></div><div class="rf-g">
    <div class="rf-b"><div class="r-logo"><div class="mark"><span>✦</span></div><div><b>ASTRO VIKASS</b><small>लाल किताब • वैदिक ज्योतिष</small></div></div><p>ग्रहों की सटीक गणना और लाल किताब के अनुभव पर आधारित व्यक्तिगत रिपोर्ट।</p></div>
    <div class="rf-c"><b>संपर्क</b><span>☎ 7069492135</span><span>💬 WhatsApp: 7069492135</span><span>🌐 sidtech366.github.io/jyotishi</span></div>
    <div class="rf-s"><b>रिपोर्ट विवरण</b><span>नं. ${rid} • ${today}</span><span>लाहिरी अयनांश ${k.ayanamsa.toFixed(3)}°</span><span>${u.inp.lat}°, ${u.inp.lon}° • UTC${u.inp.tz >= 0 ? '+' : ''}${u.inp.tz}</span></div>
  </div><p class="rf-d">यह रिपोर्ट ज्योतिषीय गणना पर आधारित मार्गदर्शन है। रत्न, उपाय या महत्वपूर्ण निर्णय से पहले अनुभवी ज्योतिषी से परामर्श अवश्य लें। © ${now.getFullYear()} Astro Vikass</p></div>`;
  return h;
}
const TOC = [['info', '📋', 'जन्म विवरण'], ['chart', '🪔', 'कुंडली चार्ट'], ['graha', '🪐', 'ग्रह स्पष्ट'], ['s1', '🔭', 'ग्रह शक्ति'], ['s2', '⚡', 'योग-दोष, भाव'], ['s3', '🧬', 'व्यक्तित्व'], ['s4', '💼', 'करियर-धन'], ['s5', '💞', 'विवाह-संतान'], ['s6', '🌿', 'स्वास्थ्य'], ['s7', '📕', 'लाल किताब उपाय'], ['s8', '⏳', 'दशा-वर्षफल'], ['s9', '🔢', 'अंक ज्योतिष'], ['s10', '🎓', 'मार्गदर्शन']];
function kTab(key, scroll) {
  const r = document.getElementById('report'); if (!r) return;
  r.classList.add('tabbed');
  r.querySelectorAll('.sec').forEach(s => s.classList.toggle('on', s.dataset.k === key));
  r.querySelectorAll('#ktoc button').forEach(b => b.classList.toggle('on', b.dataset.k === key));
  const i = TOC.findIndex(t => t[0] === key), pv = TOC[i - 1], nx = TOC[i + 1];
  const pg = document.getElementById('kpager');
  if (pg) pg.innerHTML = `${pv ? `<button type="button" onclick="kTab('${pv[0]}',1)">‹ ${pv[1]} ${pv[2]}</button>` : '<span></span>'}<button type="button" class="mid" onclick="kTab('${key}',1)">${i + 1}/${TOC.length}</button>${nx ? `<button type="button" onclick="kTab('${nx[0]}',1)">${nx[1]} ${nx[2]} ›</button>` : '<span></span>'}`;
  if (scroll !== false) { const t = document.getElementById('ktoc'); if (t && scroll) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}
function doPrint() { try { window.print(); } catch (e) { } setTimeout(() => toast('PDF के लिए: ब्राउज़र मेनू ⋮ → Share/Print → "Save as PDF" चुनें'), 400); }
document.addEventListener('DOMContentLoaded', initForm);
