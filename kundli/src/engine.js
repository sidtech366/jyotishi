/* ===== ज्योतिष गणना इंजन (पूरी तरह ब्राउज़र में, बिना किसी API) =====
   ग्रह स्थिति: Paul Schlyter की खगोलीय विधि + चंद्र/गुरु/शनि संशोधन
   अयनांश: लाहिरी | भाव: पूर्ण राशि (लाल किताब शैली) | दशा: विंशोत्तरी */
const Astro = (() => {
  const R = Math.PI / 180, D = 180 / Math.PI;
  const n360 = x => ((x % 360) + 360) % 360;
  const sin = x => Math.sin(x * R), cos = x => Math.cos(x * R);

  function julianDay(y, m, d, hourUT) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + hourUT / 24;
  }

  function kepler(M, e) {
    let E = M + e * D * sin(M) * (1 + e * cos(M));
    for (let k = 0; k < 30; k++) {
      const dE = (E - e * D * sin(E) - M) / (1 - e * cos(E));
      E -= dE; if (Math.abs(dE) < 1e-7) break;
    }
    return E;
  }

  const EL = {
    Mercury: d => [48.3313 + 3.24587e-5 * d, 7.0047 + 5e-8 * d, 29.1241 + 1.01444e-5 * d, 0.387098, 0.205635 + 5.59e-10 * d, 168.6562 + 4.0923344368 * d],
    Venus: d => [76.6799 + 2.4659e-5 * d, 3.3946 + 2.75e-8 * d, 54.891 + 1.38374e-5 * d, 0.72333, 0.006773 - 1.302e-9 * d, 48.0052 + 1.6021302244 * d],
    Mars: d => [49.5574 + 2.11081e-5 * d, 1.8497 - 1.78e-8 * d, 286.5016 + 2.92961e-5 * d, 1.523688, 0.093405 + 2.516e-9 * d, 18.6021 + 0.5240207766 * d],
    Jupiter: d => [100.4542 + 2.76854e-5 * d, 1.303 - 1.557e-7 * d, 273.8777 + 1.64505e-5 * d, 5.20256, 0.048498 + 4.469e-9 * d, 19.895 + 0.0830853001 * d],
    Saturn: d => [113.6634 + 2.3898e-5 * d, 2.4886 - 1.081e-7 * d, 339.3939 + 2.97661e-5 * d, 9.55475, 0.055546 - 9.499e-9 * d, 316.967 + 0.0334442282 * d],
  };

  function sunPos(d) {
    const w = 282.9404 + 4.70935e-5 * d, e = 0.016709 - 1.151e-9 * d, M = n360(356.047 + 0.9856002585 * d);
    const E = kepler(M, e);
    const xv = cos(E) - e, yv = Math.sqrt(1 - e * e) * sin(E);
    const v = Math.atan2(yv, xv) * D, r = Math.hypot(xv, yv);
    const lon = n360(v + w);
    return { lon, r, x: r * cos(lon), y: r * sin(lon), M, L: n360(M + w) };
  }

  function planetLon(name, d, sun) {
    const [N, i, w, a, e, M0] = EL[name](d);
    const M = n360(M0), E = kepler(M, e);
    const xv = a * (cos(E) - e), yv = a * Math.sqrt(1 - e * e) * sin(E);
    const v = Math.atan2(yv, xv) * D, r = Math.hypot(xv, yv);
    const xh = r * (cos(N) * cos(v + w) - sin(N) * sin(v + w) * cos(i));
    const yh = r * (sin(N) * cos(v + w) + cos(N) * sin(v + w) * cos(i));
    let lonH = Math.atan2(yh, xh) * D;
    const Mj = n360(19.895 + 0.0830853001 * d), Ms = n360(316.967 + 0.0334442282 * d);
    if (name === 'Jupiter') lonH += -0.332 * sin(2 * Mj - 5 * Ms - 67.6) - 0.056 * sin(2 * Mj - 2 * Ms + 21) + 0.042 * sin(3 * Mj - 5 * Ms + 21) - 0.036 * sin(Mj - 2 * Ms) + 0.022 * cos(Mj - Ms) + 0.023 * sin(2 * Mj - 3 * Ms + 52) - 0.016 * sin(Mj - 5 * Ms - 69);
    if (name === 'Saturn') lonH += 0.812 * sin(2 * Mj - 5 * Ms - 67.6) - 0.229 * cos(2 * Mj - 4 * Ms - 2) + 0.119 * sin(Mj - 2 * Ms - 3) + 0.046 * sin(2 * Mj - 6 * Ms - 69) + 0.014 * sin(Mj - 3 * Ms + 32);
    const rr = Math.hypot(xh, yh);
    const xg = rr * cos(lonH) + sun.x, yg = rr * sin(lonH) + sun.y;
    return n360(Math.atan2(yg, xg) * D);
  }

  function moonLon(d, sun) {
    const N = n360(125.1228 - 0.0529538083 * d), w = n360(318.0634 + 0.1643573223 * d);
    const e = 0.0549, i = 5.1454, M = n360(115.3654 + 13.0649929509 * d);
    const E = kepler(M, e);
    const xv = cos(E) - e, yv = Math.sqrt(1 - e * e) * sin(E);
    const v = Math.atan2(yv, xv) * D;
    const xh = cos(N) * cos(v + w) - sin(N) * sin(v + w) * cos(i);
    const yh = sin(N) * cos(v + w) + cos(N) * sin(v + w) * cos(i);
    let lon = Math.atan2(yh, xh) * D;
    const Ls = sun.L, Ms = sun.M, Lm = n360(N + w + M), Dm = Lm - Ls, F = Lm - N;
    lon += -1.274 * sin(M - 2 * Dm) + 0.658 * sin(2 * Dm) - 0.186 * sin(Ms) - 0.059 * sin(2 * M - 2 * Dm) - 0.057 * sin(M - 2 * Dm + Ms)
      + 0.053 * sin(M + 2 * Dm) + 0.046 * sin(2 * Dm - Ms) + 0.041 * sin(M - Ms) - 0.035 * sin(Dm) - 0.031 * sin(M + Ms)
      - 0.015 * sin(2 * F - 2 * Dm) + 0.011 * sin(M - 4 * Dm);
    return n360(lon);
  }

  function ayanamsa(jd) { const T = (jd - 2451545) / 36525; return 23.853056 + 1.396971 * T + 0.0003086 * T * T; }

  function tropical(jd) {
    const d = jd + 69 / 86400 - 2451543.5; // ΔT लगभग
    const sun = sunPos(d);
    const out = { Sun: sun.lon, Moon: moonLon(d, sun) };
    for (const p of ['Mars', 'Mercury', 'Jupiter', 'Saturn', 'Venus']) out[p] = planetLon(p, d, sun);
    const T = (jd - 2451545) / 36525;
    out.Rahu = n360(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
    out.Ketu = n360(out.Rahu + 180);
    return out;
  }

  function ascendant(jd, lat, lonE) {
    const T = (jd - 2451545) / 36525;
    const gmst = n360(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T);
    const lst = n360(gmst + lonE), eps = 23.439291 - 0.0130042 * T;
    const asc = Math.atan2(cos(lst), -(sin(lst) * cos(eps) + Math.tan(lat * R) * sin(eps))) * D;
    return n360(asc);
  }

  const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const DASHA = [['Ketu', 7], ['Venus', 20], ['Sun', 6], ['Moon', 10], ['Mars', 7], ['Rahu', 18], ['Jupiter', 16], ['Saturn', 19], ['Mercury', 17]];
  const SIGN_LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
  const EXALT = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6, Rahu: 1, Ketu: 7 };
  const OWN = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10], Rahu: [10], Ketu: [7] };
  const FRIEND = { Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'], Mars: ['Sun', 'Moon', 'Jupiter'], Mercury: ['Sun', 'Venus'], Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'], Saturn: ['Mercury', 'Venus'], Rahu: ['Mercury', 'Venus', 'Saturn'], Ketu: ['Mars', 'Jupiter'] };
  const ENEMY = { Sun: ['Venus', 'Saturn'], Moon: [], Mars: ['Mercury'], Mercury: ['Moon'], Jupiter: ['Mercury', 'Venus'], Venus: ['Sun', 'Moon'], Saturn: ['Sun', 'Moon', 'Mars'], Rahu: ['Sun', 'Moon', 'Mars'], Ketu: ['Moon', 'Venus'] };
  const COMBUST = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };

  function dignity(p, sign) {
    if (EXALT[p] === sign) return 'uchch';
    if ((EXALT[p] + 6) % 12 === sign) return 'neech';
    if (OWN[p].includes(sign)) return 'swa';
    const lord = SIGN_LORD[sign];
    if (lord === p) return 'swa';
    if (FRIEND[p].includes(lord)) return 'mitra';
    if (ENEMY[p].includes(lord)) return 'shatru';
    return 'sam';
  }

  function avastha(sign, deg) {
    const names = ['बाल', 'कुमार', 'युवा', 'वृद्ध', 'मृत'];
    let k = Math.min(4, Math.floor(deg / 6));
    if (sign % 2 === 1) k = 4 - k; // सम राशि में उल्टा क्रम
    return names[k];
  }

  function addYears(date, yrs) { return new Date(date.getTime() + yrs * 365.25 * 86400000); }

  function dashas(moonSid, birth) {
    const span = 360 / 27, idx = Math.floor(moonSid / span), frac = (moonSid % span) / span;
    let k = idx % 9;
    let start = addYears(birth, -frac * DASHA[k][1]);
    const list = [];
    for (let n = 0; n < 9; n++) {
      const [lord, yrs] = DASHA[(k + n) % 9];
      const end = addYears(start, yrs);
      const antar = [];
      let as = start;
      for (let j = 0; j < 9; j++) {
        const [al, ay] = DASHA[(k + n + j) % 9];
        const ae = addYears(as, yrs * ay / 120);
        antar.push({ lord: al, start: as, end: ae });
        as = ae;
      }
      list.push({ lord, years: yrs, start, end, antar });
      start = end;
    }
    return { list, balanceYears: (1 - frac) * DASHA[k][1] };
  }

  /* inp: {y,m,d,hh,mm,lat,lon,tz} */
  function kundli(inp) {
    const ut = inp.hh + inp.mm / 60 - inp.tz;
    const jd = julianDay(inp.y, inp.m, inp.d, ut);
    const ay = ayanamsa(jd);
    const t0 = tropical(jd), tm = tropical(jd - 0.5), tp = tropical(jd + 0.5);
    const asc = n360(ascendant(jd, inp.lat, inp.lon) - ay);
    const lagnaSign = Math.floor(asc / 30);
    const planets = {};
    const sunSid = n360(t0.Sun - ay);
    for (const p of PLANETS) {
      const lon = n360(t0[p] - ay), sign = Math.floor(lon / 30), deg = lon % 30;
      let speed = ((tp[p] - tm[p] + 540) % 360) - 180;
      const retro = p === 'Rahu' || p === 'Ketu' ? true : (p === 'Sun' || p === 'Moon' ? false : speed < 0);
      const nak = Math.floor(lon / (360 / 27)), pada = Math.floor((lon % (360 / 27)) / (360 / 108)) + 1;
      const house = ((sign - lagnaSign + 12) % 12) + 1;
      let sep = Math.abs(((lon - sunSid + 540) % 360) - 180);
      const lim = COMBUST[p] ? (retro && (p === 'Mercury' || p === 'Venus') ? COMBUST[p] - 2 : COMBUST[p]) : 0;
      planets[p] = { lon, sign, deg, retro, nak, pada, house, dignity: dignity(p, sign), avastha: avastha(sign, deg), combust: lim > 0 && sep < lim };
    }
    const birth = new Date(Date.UTC(inp.y, inp.m - 1, inp.d, 0, 0) + ut * 3600000);
    const ds = dashas(planets.Moon.lon, birth);
    return { jd, ayanamsa: ay, asc, lagnaSign, lagnaDeg: asc % 30, lagnaNak: Math.floor(asc / (360 / 27)), planets, dasha: ds, birth };
  }

  function transitSaturnSign(date) {
    const jd = date.getTime() / 86400000 + 2440587.5;
    return Math.floor(n360(tropical(jd).Saturn - ayanamsa(jd)) / 30);
  }
  function transit(date) {
    const jd = date.getTime() / 86400000 + 2440587.5, ay = ayanamsa(jd), t = tropical(jd), o = {};
    for (const p of PLANETS) o[p] = Math.floor(n360(t[p] - ay) / 30);
    return o;
  }

  return { kundli, transit, transitSaturnSign, PLANETS, SIGN_LORD, DASHA, EXALT, OWN };
})();
if (typeof module !== 'undefined') module.exports = Astro;
