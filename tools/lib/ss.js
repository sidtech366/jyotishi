/* ===== सूर्य सिद्धान्त गणना — ऋषिकेश (काशी) पंचांग पद्धति =====
   ऋषिकेश हिंदी पंचांग (श्रीकाशी विश्वनाथ) तिथि-नक्षत्र-योग सूर्य सिद्धान्त से निकालता है, इसलिए समय आधुनिक (दृक्) पंचांग से 1-3 घंटे भिन्न हो सकते हैं।
   यहाँ सूर्य-चंद्र सूर्य सिद्धान्त (मध्यम + मंद संस्कार) से; गुरु-मंगल भी सूर्य सिद्धान्त से (मंद-शीघ्र); शेष ग्रह दृक् गणना से (शनि में ऋषिकेश से मिलान हेतु -3° संशोधन)।
   2083 संवत् के ऋषिकेश पंचांग के 87 विवाह-दिनों से जाँचा गया — 95% दिन मेल। */
window.AVSS = (function () {
  const D = 1577917828, KALI = 588465.5 - 75.766 / 360;            // महायुग सावन दिन; कलियुगारंभ (उज्जैन मध्यरात्रि)
  const n360 = x => ((x % 360) + 360) % 360, fr = x => x - Math.floor(x), R = Math.PI / 180;
  const REV = { Sun: 4320000, Moon: 57753336, MoonApo: 488203, Node: -232238, Mars: 2296832, Jupiter: 364220 };
  const APO = { Sun: 77.2833, Mars: 130.0333, Jupiter: 171.30 };
  const MP = { Sun: [14, 13 + 40 / 60], Moon: [32, 31 + 40 / 60], Mars: [75, 72], Jupiter: [33, 32] };
  const SP = { Mars: [235, 232], Jupiter: [70, 72] };
  const mean = (rev, d) => n360(fr(rev * d / D) * 360);
  const sinD = x => Math.sin(x * R), cosD = x => Math.cos(x * R);
  function mandaEq(m, apo, P) { const s = sinD(n360(m - apo)), p = P[1] + (P[0] - P[1]) * Math.abs(s); return Math.asin(p / 360 * s) / R; }
  function shighraEq(pl, sh, P) { const k = n360(sh - pl), p = P[1] + (P[0] - P[1]) * Math.abs(sinD(k)), r = p / 360; return Math.atan2(r * sinD(k), 1 + r * cosD(k)) / R; }
  function star(name, d, ms) {
    const m = mean(REV[name], d), P = MP[name], S = SP[name], apo = APO[name];
    let x = m + shighraEq(m, ms, S) / 2; x = x - mandaEq(x, apo, P) / 2;
    const mm = m - mandaEq(x, apo, P); return n360(mm + shighraEq(mm, ms, S));
  }
  function sunMoon(jd) {
    const d = jd - KALI, ms = mean(REV.Sun, d), mm = mean(REV.Moon, d), ma = n360(90 + mean(REV.MoonApo, d));
    return { sun: n360(ms - mandaEq(ms, APO.Sun, MP.Sun)), moon: n360(mm - mandaEq(mm, ma, MP.Moon)), d, ms };
  }
  /* ऋषिकेश-मिलान ग्रह स्पष्ट (निरयण) */
  function planets(jd) {
    const s = sunMoon(jd), P = Object.assign({}, AVAstro.planets(jd));
    P.Sun = s.sun; P.Moon = s.moon; P.Jupiter = star('Jupiter', s.d, s.ms); P.Mars = star('Mars', s.d, s.ms); P.Saturn = n360(P.Saturn - 3);
    return P;
  }
  return { sunMoon, planets };
})();
