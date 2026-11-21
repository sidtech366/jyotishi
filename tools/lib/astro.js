/* ===== Astro Vikass — साझा खगोल गणना (सभी टूल्स) =====
   ग्रह: Schlyter विधि + संशोधन | अयनांश: लाहिरी | सूर्योदय: NOAA | सब कुछ फ़ोन में, बिना API */
(function () {
  const R = Math.PI / 180, D = 180 / Math.PI;
  const n360 = x => ((x % 360) + 360) % 360;
  const sin = x => Math.sin(x * R), cos = x => Math.cos(x * R);

  function jdOf(y, m, d, hUT) { if (m <= 2) { y--; m += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + hUT / 24; }
  const jdFromDate = dt => dt.getTime() / 86400000 + 2440587.5;
  const dateFromJd = jd => new Date((jd - 2440587.5) * 86400000);
  function kepler(M, e) { let E = M + e * D * sin(M) * (1 + e * cos(M)); for (let k = 0; k < 30; k++) { const dE = (E - e * D * sin(E) - M) / (1 - e * cos(E)); E -= dE; if (Math.abs(dE) < 1e-7) break; } return E; }
  const EL = {
    Mercury: d => [48.3313 + 3.24587e-5 * d, 7.0047 + 5e-8 * d, 29.1241 + 1.01444e-5 * d, 0.387098, 0.205635 + 5.59e-10 * d, 168.6562 + 4.0923344368 * d],
    Venus: d => [76.6799 + 2.4659e-5 * d, 3.3946 + 2.75e-8 * d, 54.891 + 1.38374e-5 * d, 0.72333, 0.006773 - 1.302e-9 * d, 48.0052 + 1.6021302244 * d],
    Mars: d => [49.5574 + 2.11081e-5 * d, 1.8497 - 1.78e-8 * d, 286.5016 + 2.92961e-5 * d, 1.523688, 0.093405 + 2.516e-9 * d, 18.6021 + 0.5240207766 * d],
    Jupiter: d => [100.4542 + 2.76854e-5 * d, 1.303 - 1.557e-7 * d, 273.8777 + 1.64505e-5 * d, 5.20256, 0.048498 + 4.469e-9 * d, 19.895 + 0.0830853001 * d],
    Saturn: d => [113.6634 + 2.3898e-5 * d, 2.4886 - 1.081e-7 * d, 339.3939 + 2.97661e-5 * d, 9.55475, 0.055546 - 9.499e-9 * d, 316.967 + 0.0334442282 * d],
  };
  function sunPos(d) {
    const w = 282.9404 + 4.70935e-5 * d, e = 0.016709 - 1.151e-9 * d, M = n360(356.047 + 0.9856002585 * d), E = kepler(M, e);
    const xv = cos(E) - e, yv = Math.sqrt(1 - e * e) * sin(E), v = Math.atan2(yv, xv) * D, r = Math.hypot(xv, yv), lon = n360(v + w);
    return { lon, r, x: r * cos(lon), y: r * sin(lon), M, L: n360(M + w) };
  }
  function planetLon(name, d, sun) {
    const [N, i, w, a, e, M0] = EL[name](d), M = n360(M0), E = kepler(M, e);
    const xv = a * (cos(E) - e), yv = a * Math.sqrt(1 - e * e) * sin(E), v = Math.atan2(yv, xv) * D, r = Math.hypot(xv, yv);
    const xh = r * (cos(N) * cos(v + w) - sin(N) * sin(v + w) * cos(i)), yh = r * (sin(N) * cos(v + w) + cos(N) * sin(v + w) * cos(i));
    let lonH = Math.atan2(yh, xh) * D;
    const Mj = n360(19.895 + 0.0830853001 * d), Ms = n360(316.967 + 0.0334442282 * d);
    if (name === 'Jupiter') lonH += -0.332 * sin(2 * Mj - 5 * Ms - 67.6) - 0.056 * sin(2 * Mj - 2 * Ms + 21) + 0.042 * sin(3 * Mj - 5 * Ms + 21) - 0.036 * sin(Mj - 2 * Ms) + 0.022 * cos(Mj - Ms) + 0.023 * sin(2 * Mj - 3 * Ms + 52) - 0.016 * sin(Mj - 5 * Ms - 69);
    if (name === 'Saturn') lonH += 0.812 * sin(2 * Mj - 5 * Ms - 67.6) - 0.229 * cos(2 * Mj - 4 * Ms - 2) + 0.119 * sin(Mj - 2 * Ms - 3) + 0.046 * sin(2 * Mj - 6 * Ms - 69) + 0.014 * sin(Mj - 3 * Ms + 32);
    const rr = Math.hypot(xh, yh), xg = rr * cos(lonH) + sun.x, yg = rr * sin(lonH) + sun.y;
    return n360(Math.atan2(yg, xg) * D);
  }
  function moonPos(d, sun) {
    const N = n360(125.1228 - 0.0529538083 * d), w = n360(318.0634 + 0.1643573223 * d), e = 0.0549, i = 5.1454, M = n360(115.3654 + 13.0649929509 * d), E = kepler(M, e);
    const xv = cos(E) - e, yv = Math.sqrt(1 - e * e) * sin(E), v = Math.atan2(yv, xv) * D;
    const xh = cos(N) * cos(v + w) - sin(N) * sin(v + w) * cos(i), yh = sin(N) * cos(v + w) + cos(N) * sin(v + w) * cos(i), zh = sin(v + w) * sin(i);
    let lon = Math.atan2(yh, xh) * D, lat = Math.atan2(zh, Math.hypot(xh, yh)) * D;
    const Ms = sun.M, Lm = n360(N + w + M), Dm = Lm - sun.L, F = Lm - N;
    lon += -1.274 * sin(M - 2 * Dm) + 0.658 * sin(2 * Dm) - 0.186 * sin(Ms) - 0.059 * sin(2 * M - 2 * Dm) - 0.057 * sin(M - 2 * Dm + Ms) + 0.053 * sin(M + 2 * Dm) + 0.046 * sin(2 * Dm - Ms) + 0.041 * sin(M - Ms) - 0.035 * sin(Dm) - 0.031 * sin(M + Ms) - 0.015 * sin(2 * F - 2 * Dm) + 0.011 * sin(M - 4 * Dm);
    lat += -0.173 * sin(F - 2 * Dm) - 0.055 * sin(M - F - 2 * Dm) - 0.046 * sin(M + F - 2 * Dm) + 0.033 * sin(F + 2 * Dm) + 0.017 * sin(2 * M + F);
    return { lon: n360(lon), lat };
  }
  const dOf = jd => jd + 69 / 86400 - 2451543.5;
  function ayanamsa(jd) { const T = (jd - 2451545) / 36525; return 23.853056 + 1.396971 * T + 0.0003086 * T * T; }
  const PL = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  /* सभी ग्रह — निरयन (sidereal) */
  let planets = function (jd) {
    const d = dOf(jd), sun = sunPos(d), ay = ayanamsa(jd), T = (jd - 2451545) / 36525, mp = moonPos(d, sun);
    const o = { Sun: sun.lon, Moon: mp.lon };
    for (const p of ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']) o[p] = planetLon(p, d, sun);
    o.Rahu = n360(125.04452 - 1934.136261 * T); o.Ketu = n360(o.Rahu + 180);
    for (const p of PL) o[p] = n360(o[p] - ay);
    o.moonLat = mp.lat;
    return o;
  }
  /* सिर्फ़ सूर्य-चंद्र (तेज़) */
  let sunMoon = function (jd) { const d = dOf(jd), s = sunPos(d), m = moonPos(d, s), ay = ayanamsa(jd); return { sun: n360(s.lon - ay), moon: n360(m.lon - ay), moonLat: m.lat, sunTrop: s.lon, moonTrop: m.lon }; }
  /* ===== ऋषिकेश (काशी) पंचांग पद्धति — सूर्य सिद्धान्त ===== डिफ़ॉल्ट; "दृक्" चुनने पर आधुनिक गणना */
  const SSD = 1577917828, KALI = 588465.5 - 75.766 / 360, fr = x => x - Math.floor(x);
  const SREV = { Sun: 4320000, Moon: 57753336, MoonApo: 488203, Mars: 2296832, Jupiter: 364220 }, SAPO = { Sun: 77.2833, Mars: 130.0333, Jupiter: 171.30 };
  const SMP = { Sun: [14, 13 + 40 / 60], Moon: [32, 31 + 40 / 60], Mars: [75, 72], Jupiter: [33, 32] }, SSP = { Mars: [235, 232], Jupiter: [70, 72] };
  const smean = (rev, d) => n360(fr(rev * d / SSD) * 360);
  const mandaEq = (m, apo, P) => { const s = sin(n360(m - apo)), p = P[1] + (P[0] - P[1]) * Math.abs(s); return Math.asin(p / 360 * s) * D; };
  const shighraEq = (pl, sh, P) => { const k = n360(sh - pl), r = (P[1] + (P[0] - P[1]) * Math.abs(sin(k))) / 360; return Math.atan2(r * sin(k), 1 + r * cos(k)) * D; };
  function ssStar(nm, d, ms) { const m = smean(SREV[nm], d), P = SMP[nm], S = SSP[nm], apo = SAPO[nm]; let x = m + shighraEq(m, ms, S) / 2; x = x - mandaEq(x, apo, P) / 2; const mm = m - mandaEq(x, apo, P); return n360(mm + shighraEq(mm, ms, S)); }
  function ssSunMoon(jd) { const d = jd - KALI, ms = smean(SREV.Sun, d), mm = smean(SREV.Moon, d), ma = n360(90 + smean(SREV.MoonApo, d)); return { sun: n360(ms - mandaEq(ms, SAPO.Sun, SMP.Sun)), moon: n360(mm - mandaEq(mm, ma, SMP.Moon)), d, ms }; }
  let MODE = 'rk'; try { MODE = JSON.parse(localStorage.getItem('av_mode') || '"rk"') === 'drik' ? 'drik' : 'rk'; } catch (e) { }
  const sunMoonDrik = sunMoon, planetsDrik = planets;
  sunMoon = function (jd) { const o = sunMoonDrik(jd); if (MODE !== 'rk') return o; const s = ssSunMoon(jd); o.sun = s.sun; o.moon = s.moon; return o; };
  planets = function (jd) { const o = planetsDrik(jd); if (MODE !== 'rk') return o; const s = ssSunMoon(jd); o.Sun = s.sun; o.Moon = s.moon; o.Jupiter = ssStar('Jupiter', s.d, s.ms); o.Mars = ssStar('Mars', s.d, s.ms); o.Saturn = n360(o.Saturn - 3); return o; };
  const mode = () => MODE, setMode = m => { MODE = m === 'drik' ? 'drik' : 'rk'; try { localStorage.setItem('av_mode', JSON.stringify(MODE)); } catch (e) { } };
  function retro(p, jd) { if (p === 'Rahu' || p === 'Ketu') return true; if (p === 'Sun' || p === 'Moon') return false; const a = planets(jd - 0.5)[p], b = planets(jd + 0.5)[p]; return ((b - a + 540) % 360) - 180 < 0; }
  function ascendant(jd, lat, lonE) {
    const T = (jd - 2451545) / 36525, gmst = n360(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T), lst = n360(gmst + lonE), eps = 23.439291 - 0.0130042 * T;
    return n360(Math.atan2(cos(lst), -(sin(lst) * cos(eps) + Math.tan(lat * R) * sin(eps))) * D - ayanamsa(jd));
  }
  /* खगोलीय ऊँचाई (डिग्री) — उष्णकटिबंधीय देशांतर/अक्षांश से */
  function altitude(jd, lonTrop, latEcl, lat, lonE) {
    const T = (jd - 2451545) / 36525, eps = 23.439291 - 0.0130042 * T;
    const ra = Math.atan2(sin(lonTrop) * cos(eps) - Math.tan(latEcl * R) * sin(eps), cos(lonTrop)) * D;
    const dec = Math.asin(sin(latEcl) * cos(eps) + cos(latEcl) * sin(eps) * sin(lonTrop)) * D;
    const lst = n360(280.46061837 + 360.98564736629 * (jd - 2451545) + lonE), ha = n360(lst - ra);
    return Math.asin(sin(lat) * sin(dec) + cos(lat) * cos(dec) * cos(ha)) * D;
  }
  /* सूर्योदय / सूर्यास्त (NOAA) — स्थानीय घंटे में; y,m,d स्थानीय तारीख */
  function sunTimes(y, m, d, lat, lon, tz) {
    const calc = rise => {
      let h = rise ? 6 : 18;
      for (let k = 0; k < 4; k++) {
        const jd = jdOf(y, m, d, h - tz), T = (jd - 2451545) / 36525;
        const L0 = n360(280.46646 + T * (36000.76983 + 0.0003032 * T)), M = 357.52911 + T * (35999.05029 - 0.0001537 * T), e = 0.016708634 - T * (0.000042037 + 1.267e-7 * T);
        const C = sin(M) * (1.914602 - T * (0.004817 + 1.4e-5 * T)) + sin(2 * M) * (0.019993 - 0.000101 * T) + sin(3 * M) * 0.000289;
        const om = 125.04 - 1934.136 * T, lam = L0 + C - 0.00569 - 0.00478 * sin(om), eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * cos(om);
        const dec = Math.asin(sin(eps) * sin(lam)) * D, yv = Math.tan(eps / 2 * R) ** 2;
        const eqt = 4 * D * (yv * sin(2 * L0) - 2 * e * sin(M) + 4 * e * yv * sin(M) * cos(2 * L0) - 0.5 * yv * yv * sin(4 * L0) - 1.25 * e * e * sin(2 * M));
        const cosH = (cos(90.833) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec)); if (cosH > 1 || cosH < -1) return null;
        const H = Math.acos(cosH) * D, noon = 720 - 4 * lon - eqt + tz * 60;
        h = (rise ? noon - 4 * H : noon + 4 * H) / 60;
      }
      return h;
    };
    return { rise: calc(true), set: calc(false) };
  }
  /* पंचांग अंग */
  const tithiAng = jd => { const s = sunMoon(jd); return n360(s.moon - s.sun); };
  const tithiNo = jd => Math.floor(tithiAng(jd) / 12) + 1;                // 1-30
  const nakNo = jd => Math.floor(sunMoon(jd).moon / (360 / 27));           // 0-26
  const yogaNo = jd => { const s = sunMoon(jd); return Math.floor(n360(s.sun + s.moon) / (360 / 27)); };
  const karanaNo = jd => Math.floor(tithiAng(jd) / 6) + 1;                 // 1-60
  /* fn(jd) का खंड (segment) बदलने का अगला समय */
  function nextChange(jd0, fn, step) {
    step = step || 0.05; const s0 = fn(jd0); let a = jd0;
    for (let i = 1; i < 2000; i++) { const b = jd0 + i * step; if (fn(b) !== s0) { let lo = a, hi = b; for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (fn(mid) === s0) lo = mid; else hi = mid; } return hi; } a = b; }
    return null;
  }
  /* स्थानीय समय टेक्स्ट */
  function fmtH(h) { if (h == null || isNaN(h)) return '—'; h = ((h % 24) + 24) % 24; let hh = Math.floor(h), mm = Math.round((h - hh) * 60); if (mm === 60) { mm = 0; hh = (hh + 1) % 24; } const p = hh < 12 ? 'AM' : 'PM', h12 = hh % 12 || 12; return h12 + ':' + String(mm).padStart(2, '0') + ' ' + p; }
  function localOf(jd, tz) { const t = dateFromJd(jd + tz / 24); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours() + t.getUTCMinutes() / 60 + t.getUTCSeconds() / 3600 }; }
  const MON = ['जन', 'फर', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'];
  function fmtJd(jd, tz, withDate) { const l = localOf(jd, tz); return (withDate !== false ? l.d + ' ' + MON[l.m - 1] + ' ' + l.y + ', ' : '') + fmtH(l.h); }
  function fmtDate(y, m, d) { return d + ' ' + MON[m - 1] + ' ' + y; }
  /* नाम */
  const N = {
    SIGN: ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'],
    SIGN_EN: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    SIGN_IC: ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'],
    NAK: ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वाफाल्गुनी', 'उत्तराफाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वाभाद्रपद', 'उत्तराभाद्रपद', 'रेवती'],
    TITHI: ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा', 'अमावस्या'],
    VAAR: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
    MAAS: ['चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ़', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन'],
    P: { Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु' },
    PIC: { Sun: '☀️', Moon: '🌙', Mars: '🔴', Mercury: '🟢', Jupiter: '🟡', Venus: '💎', Saturn: '🪐', Rahu: '🌑', Ketu: '☄️' },
    LORD: ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'],
    NAK_LORD: ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'],
  };
  const tithiName = t => (t <= 15 ? 'शुक्ल ' : 'कृष्ण ') + (t === 30 ? N.TITHI[15] : N.TITHI[(t - 1) % 15]);
  /* अमांत चंद्र मास: jd किस मास में (अधिक मास सहित) */
  function lunarMonth(jd) {
    const ang = tithiAng(jd);
    const nmPrev = findNewMoon(jd - ang / 12.19 - 2, jd), nmNext = findNewMoon(nmPrev + 25, nmPrev + 35);
    const s1 = Math.floor(sunMoon(nmPrev).sun / 30), s2 = Math.floor(sunMoon(nmNext).sun / 30);
    return { maas: (s1 + 1) % 12, adhik: s1 === s2, start: nmPrev, end: nmNext };
  }
  function findNewMoon(a, b) { // a..b में अमावस्या (tithi कोण 360→0)
    let prev = tithiAng(a), t = a;
    for (let x = a + 0.25; x <= b + 0.26; x += 0.25) { const c = tithiAng(x); if (c < prev - 180) { let lo = t, hi = x; for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (tithiAng(mid) > 180) lo = mid; else hi = mid; } return hi; } prev = c; t = x; }
    return b;
  }
  /* किसी तारीख का दैनिक पंचांग (सूर्योदय पर) */
  function dayInfo(y, m, d, L) {
    const st = sunTimes(y, m, d, L.lat, L.lon, L.tz), rise = st.rise == null ? 6 : st.rise, set = st.set == null ? 18 : st.set;
    const jdR = jdOf(y, m, d, rise - L.tz), jdS = jdOf(y, m, d, set - L.tz);
    const sm = sunMoon(jdR);
    return { y, m, d, rise, set, jdRise: jdR, jdSet: jdS, vaar: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), tithi: tithiNo(jdR), tithiSet: tithiNo(jdS), nak: nakNo(jdR), yoga: yogaNo(jdR), karana: karanaNo(jdR), sun: sm.sun, moon: sm.moon };
  }
  /* पद्धति चयन पट्टी — हर टूल में ऊपर */
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('avModeBar') || /[?&]nomode/.test(location.search)) return;
    const b = document.createElement('div'); b.id = 'avModeBar';
    b.style.cssText = 'display:flex;gap:6px;justify-content:center;align-items:center;flex-wrap:wrap;margin:10px auto 0;max-width:760px;padding:0 14px;font:600 13px "Noto Sans Devanagari",sans-serif';
    const btn = (m, t) => `<button type="button" data-m="${m}" style="border:1.5px solid ${MODE === m ? '#6b1418' : '#e6cf9f'};background:${MODE === m ? '#6b1418' : '#fff'};color:${MODE === m ? '#fff' : '#6b1418'};border-radius:999px;padding:6px 12px;font:inherit;cursor:pointer">${t}</button>`;
    b.innerHTML = '<span style="color:#86664f">गणना:</span>' + btn('rk', '📖 ऋषिकेश पंचांग (काशी)') + btn('drik', '🔭 दृक् (आधुनिक)');
    b.onclick = e => { const x = e.target.closest('button'); if (!x || x.dataset.m === MODE) return; setMode(x.dataset.m); location.reload(); };
    const h = document.querySelector('.av-head, header'); if (h && h.parentNode) h.parentNode.insertBefore(b, h.nextSibling); else document.body.insertBefore(b, document.body.firstChild);
  });
  window.AVAstro = { mode, setMode, sunMoonDrik, planetsDrik, ssSunMoon, n360, jdOf, jdFromDate, dateFromJd, planets, sunMoon, retro, ascendant, altitude, sunTimes, tithiAng, tithiNo, nakNo, yogaNo, karanaNo, nextChange, fmtH, fmtJd, fmtDate, localOf, N, tithiName, lunarMonth, findNewMoon, dayInfo, ayanamsa, PL };
})();
