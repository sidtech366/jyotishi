/* अवकहड़ा चक्र — हर नक्षत्र के 4 चरणों के नामाक्षर */
window.AVAkshar = (function () {
  const SYL = [['चू','चे','चो','ला'],['ली','लू','ले','लो'],['अ','ई','उ','ए'],['ओ','वा','वी','वू'],['वे','वो','का','की'],['कू','घ','ङ','छ'],['के','को','हा','ही'],['हू','हे','हो','डा'],['डी','डू','डे','डो'],['मा','मी','मू','मे'],['मो','टा','टी','टू'],['टे','टो','पा','पी'],['पू','ष','ण','ठ'],['पे','पो','रा','री'],['रू','रे','रो','ता'],['ती','तू','ते','तो'],['ना','नी','नू','ने'],['नो','या','यी','यू'],['ये','यो','भा','भी'],['भू','धा','फा','ढा'],['भे','भो','जा','जी'],['खी','खू','खे','खो'],['गा','गी','गू','गे'],['गो','सा','सी','सू'],['से','सो','दा','दी'],['दू','थ','झ','ञ'],['दे','दो','चा','ची']];
  const signOf = (n, p) => Math.floor((n * 4 + p) / 9);           // p: 0-3
  /* नाम के पहले अक्षर से नक्षत्र-चरण-राशि खोजें */
  /* रोमन / हिंग्लिश नाम → देवनागरी (पहले 1-2 अक्षर पर्याप्त) — Vikas → विकास, Priya → प्रिया, Shreya → श्रेया */
  const CON = [['ksh', 'क्ष'], ['chh', 'छ'], ['shr', 'श्र'], ['gy', 'ज्ञ'], ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['jh', 'झ'], ['th', 'थ'], ['dh', 'ध'], ['ph', 'फ'], ['bh', 'भ'], ['sh', 'श'],
    ['k', 'क'], ['g', 'ग'], ['c', 'क'], ['j', 'ज'], ['t', 'त'], ['d', 'द'], ['n', 'न'], ['p', 'प'], ['f', 'फ'], ['b', 'ब'], ['m', 'म'], ['y', 'य'], ['r', 'र'], ['l', 'ल'], ['v', 'व'], ['w', 'व'], ['s', 'स'], ['h', 'ह'], ['z', 'ज'], ['q', 'क'], ['x', 'क्स']];
  const MAT = [['aa', 'ा'], ['ai', 'ै'], ['au', 'ौ'], ['ou', 'ौ'], ['ee', 'ी'], ['ii', 'ी'], ['oo', 'ू'], ['a', ''], ['i', 'ि'], ['u', 'ु'], ['e', 'े'], ['o', 'ो']];
  const IV = [['aa', 'आ'], ['ai', 'ऐ'], ['au', 'औ'], ['ee', 'ई'], ['oo', 'ऊ'], ['a', 'अ'], ['i', 'इ'], ['u', 'उ'], ['e', 'ए'], ['o', 'ओ']];
  function toDev(w) {
    w = String(w || '').toLowerCase().replace(/[^a-z]/g, ''); let out = '', i = 0, syl = 0;
    const take = L => { for (const [k, v] of L) if (w.startsWith(k, i)) { i += k.length; return v; } return null; };
    while (i < w.length && syl < 3) {
      const c = take(CON);
      if (c == null) { const v = take(IV); if (v == null) { i++; continue; } out += v; syl++; continue; }
      const m = take(MAT); if (m == null) { out += c + '्'; continue; }   // संयुक्त: Priya → प्रि
      out += c + m; syl++;
    }
    return out.replace(/्$/, '');
  }
  function fromName(name) {
    name = String(name || '').trim(); if (!name) return null;
    if (/^[a-z]/i.test(name)) name = toDev(name);
    if (name[1] === '\u094D') name = name[0] + name.slice(3);           // संयुक्त अक्षर: प्रिया → पिया
    name = name.replace(/^(.)ि/, '$1ी').replace(/^(.)ु/, '$1ू').replace(/^(.)ै/, '$1े').replace(/^(.)ौ/, '$1ो').replace(/^(.)ृ/, '$1ी').replace(/^ऐ/, 'ए').replace(/^औ/, 'ओ').replace(/^आ/, 'अ').replace(/^इ/, 'ई').replace(/^ऊ/, 'उ').replace(/^श/, 'स').replace(/^क्ष/, 'क').replace(/^ज्ञ/, 'ज');
    let best = null;
    SYL.forEach((row, n) => row.forEach((s, p) => { if (name.startsWith(s) && (!best || s.length > best.s.length)) best = { s, n, p, sign: signOf(n, p) }; }));
    if (!best) { // सिर्फ़ व्यंजन मिलाएं (जैसे "विकास" → वि ≈ वी)
      const c = name[0];
      SYL.forEach((row, n) => row.forEach((s, p) => { if (!best && s[0] === c) best = { s, n, p, sign: signOf(n, p), approx: true }; }));
    }
    return best;
  }
  /* आम अंग्रेज़ी अक्षर → संभावित हिंदी (सरल) */
  return { SYL, signOf, fromName, toDev };
})();
