/* ===== हिंदू कैलेंडर इंजन: मास, तिथि (क्षय सहित), व्रत-त्योहार ===== */
window.AVCal = (function () {
  const A = AVAstro, N = A.N;
  const EK_S = ['कामदा', 'मोहिनी', 'निर्जला', 'देवशयनी', 'श्रावण पुत्रदा', 'परिवर्तिनी', 'पापांकुशा', 'देवउठनी (प्रबोधिनी)', 'मोक्षदा', 'पौष पुत्रदा', 'जया', 'आमलकी'];
  const EK_PK = ['पापमोचनी', 'वरूथिनी', 'अपरा', 'योगिनी', 'कामिका', 'अजा', 'इंदिरा', 'रमा', 'उत्पन्ना', 'सफला', 'षटतिला', 'विजया'];
  // [अमांत मास, तिथि 1-30, नाम, प्रकार] प्रकार: s=सूर्योदय, p=प्रदोष(सूर्यास्त), a=अपराह्न, n=निशीथ(मध्यरात्रि)
  const FEST = [[0, 1, 'चैत्र नवरात्रि आरंभ • हिंदू नववर्ष', 's'], [0, 9, 'श्री राम नवमी', 'm'], [0, 15, 'हनुमान जयंती', 's'], [1, 3, 'अक्षय तृतीया', 's'], [1, 15, 'बुद्ध पूर्णिमा', 's'], [1, 30, 'वट सावित्री व्रत', 's'], [2, 10, 'गंगा दशहरा', 's'], [3, 2, 'जगन्नाथ रथ यात्रा', 's'], [3, 15, 'गुरु पूर्णिमा', 's'], [4, 3, 'हरियाली तीज', 's'], [4, 5, 'नाग पंचमी', 's'], [4, 15, 'रक्षाबंधन', 'a'], [4, 23, 'श्री कृष्ण जन्माष्टमी', 'n'], [5, 3, 'हरतालिका तीज', 's'], [5, 4, 'गणेश चतुर्थी', 'm'], [5, 5, 'ऋषि पंचमी', 's'], [5, 14, 'अनंत चतुर्दशी', 's'], [5, 16, 'पितृ पक्ष आरंभ', 's'], [5, 30, 'सर्वपितृ अमावस्या', 's'], [6, 1, 'शारदीय नवरात्रि आरंभ • घटस्थापना', 's'], [6, 8, 'दुर्गा अष्टमी', 's'], [6, 9, 'महानवमी', 's'], [6, 10, 'विजयादशमी (दशहरा)', 'a'], [6, 15, 'शरद पूर्णिमा', 'n'], [6, 19, 'करवा चौथ', 'c'], [6, 23, 'अहोई अष्टमी', 'p'], [6, 28, 'धनतेरस', 'p'], [6, 29, 'नरक चतुर्दशी (छोटी दिवाली)', 's'], [6, 30, 'दीपावली • लक्ष्मी पूजा', 'p'], [7, 1, 'गोवर्धन पूजा', 's'], [7, 2, 'भाई दूज', 'a'], [7, 6, 'छठ पूजा', 's'], [7, 11, 'भीष्म पंचक आरंभ (पूर्णिमा तक)', 's'], [7, 15, 'कार्तिक पूर्णिमा • देव दीपावली • भीष्म पंचक समाप्त', 's'], [8, 5, 'विवाह पंचमी', 's'], [8, 11, 'गीता जयंती', 's'], [10, 5, 'वसंत पंचमी', 's'], [10, 29, 'महाशिवरात्रि', 'n'], [11, 15, 'होलिका दहन', 'p']];
  const SANK = ['मेष संक्रांति', 'वृषभ संक्रांति', 'मिथुन संक्रांति', 'कर्क संक्रांति', 'सिंह संक्रांति', 'कन्या संक्रांति', 'तुला संक्रांति', 'वृश्चिक संक्रांति', 'धनु संक्रांति (खरमास आरंभ)', 'मकर संक्रांति', 'कुंभ संक्रांति', 'मीन संक्रांति (खरमास आरंभ)'];
  function newMoons(j0, j1) { const out = []; let prev = A.tithiAng(j0), t = j0; for (let x = j0 + 0.5; x <= j1; x += 0.5) { const c = A.tithiAng(x); if (c < prev - 180) { let lo = t, hi = x; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (A.tithiAng(m) > 180) lo = m; else hi = m; } out.push(hi); } prev = c; t = x; } return out; }
  /* महीने के सभी दिन (y,m ग्रेगोरियन), L = {lat,lon,tz} */
  function month(y, m, L) {
    const nd = new Date(Date.UTC(y, m, 0)).getUTCDate(), j0 = A.jdOf(y, m, 1, 0), nms = newMoons(j0 - 70, j0 + 75);
    const nmSign = nms.map(j => Math.floor(A.sunMoon(j).sun / 30));
    const maasOf = jd => { let i = nms.length - 1; while (i > 0 && nms[i] > jd) i--; const s1 = nmSign[i], s2 = nmSign[i + 1]; return { maas: (s1 + 1) % 12, adhik: s1 === s2 }; };
    const days = []; let prevT = null;
    const pd = new Date(Date.UTC(y, m - 1, 0)), pinfo = A.dayInfo(pd.getUTCFullYear(), pd.getUTCMonth() + 1, pd.getUTCDate(), L); prevT = pinfo.tithi;
    for (let d = 1; d <= nd; d++) {
      const I = A.dayInfo(y, m, d, L), ms = maasOf(I.jdRise), tithis = [I.tithi];
      // क्षय तिथि: पिछले दिन से बीच में छूटी तिथि इस दिन से पहले वाले दिन में जोड़ें
      let gap = ((I.tithi - prevT + 30) % 30); if (gap > 1 && days.length) { for (let k = 1; k < gap; k++) days[days.length - 1].tithis.push(((prevT - 1 + k) % 30) + 1); }
      prevT = I.tithi;
      const s1 = Math.floor(A.sunMoon(I.jdRise).sun / 30), s2 = Math.floor(A.sunMoon(I.jdRise + 1).sun / 30); I.sank = s1 !== s2 ? s2 : null;
      Object.assign(I, ms, { tithis, moonriseT: A.tithiNo(I.jdSet + 2.5 / 24), tithiMid: A.tithiNo(I.jdSet + (24 - (I.set - I.rise)) / 48), tithiAp: A.tithiNo(I.jdRise + (I.set - I.rise) * 0.7 / 24) });
      days.push(I);
    }
    days.forEach((I, i) => { I.events = events(I, days[i - 1]); });
    // होली = होलिका दहन का अगला दिन; एक ही व्रत लगातार दो दिन हो तो पहला दिन रखें
    days.forEach((I, i) => { if (i && days[i - 1].events.some(e => e[1] === 'होलिका दहन')) I.events.push(['🎨', 'होली (रंगोत्सव)', 'fest']); });
    for (let i = days.length - 1; i > 0; i--) days[i].events = days[i].events.filter(e => e[2] === 'sank' || !days[i - 1].events.some(x => x[1] === e[1]));
    return days;
  }
  function events(I, prev) {
    const ev = [], has = t => I.tithis.includes(t), mo = I.maas;
    if (has(11)) ev.push(['🙏', (I.adhik ? 'पद्मिनी' : EK_S[mo]) + ' एकादशी', 'vrat']);
    if (has(26)) ev.push(['🙏', (I.adhik ? 'परमा' : EK_PK[(mo + 1) % 12]) + ' एकादशी', 'vrat']);
    if (has(15)) ev.push(['🌕', 'पूर्णिमा', 'vrat']);
    if (has(30)) ev.push(['🌑', 'अमावस्या', 'vrat']);
    if (I.tithiSet === 13 || I.tithiSet === 28) ev.push(['🔱', 'प्रदोष व्रत', 'vrat']);
    if (I.moonriseT === 19 && !(prev && prev.moonriseT === 19)) ev.push(['🐘', 'संकष्टी चतुर्थी', 'vrat']);
    if (has(4)) ev.push(['🐘', 'विनायक चतुर्थी', 'vrat']);
    if (I.tithiMid === 29 && mo !== 10) ev.push(['🔱', 'मासिक शिवरात्रि', 'vrat']);
    if (I.sank != null) ev.push(['☀️', SANK[I.sank], 'sank']);
    if (!I.adhik) FEST.forEach(([fm, ft, nm, ty]) => { if (fm !== mo) return; const ok = ty === 'p' ? (I.tithiSet === ft || (has(ft) && !(prev && prev.tithiSet === ft))) : ty === 'n' ? I.tithiMid === ft : ty === 'a' ? (I.tithiAp === ft && !(prev && prev.tithiAp === ft)) || (has(ft) && I.tithiAp !== ft && !(prev && prev.tithiAp === ft) && !(prev && prev.tithis.includes(ft))) : ty === 'c' ? I.moonriseT === ft && !(prev && prev.moonriseT === ft) : ty === 'm' ? A.tithiNo(I.jdRise + (I.set - I.rise) * 0.5 / 24) === ft : has(ft); if (ok && !ev.some(e => e[1] === nm)) ev.push(['🪔', nm, 'fest']); });
    return ev;
  }
  return { month, newMoons, FEST };
})();
