"""ज्ञान भंडार (kb.json) — टूल्स के डेटा से सीधे।  चलाएं: python3 tools/ai/build_kb.py (repo root पर 8765 सर्वर चालू हो)"""
import json, os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
X = {
 'tools/vratnirnay.html': """() => V.map(v => `व्रत: ${v.n}। तिथि: ${v.tithi}। कर्मकाल: ${v.kaal}। नियम: ${v.ni.join(' ')} दो दिन तिथि हो तो: ${v.dvi} प्रमाण: ${v.pr.map(p => (p.q || p.t) + ' — ' + p.s).join(' | ')}`)
   .concat(RULES.map(r => `व्रत-निर्णय सिद्धांत — ${r[0]}: ${r[1]}`), BOOKS.map(b => `निर्णय ग्रंथ — ${b[0]}: ${b[1]}`))""",
 'tools/dhyan.html': """() => ALL.map(d => `${d.n} के ध्यान/स्तुति मंत्र (${d.sec}): ` + d.m.filter(m => !m.pend).map(m => `${m.l}: ${m.t}${m.s ? ' [' + m.s + ']' : ''}`).join(' || '))""",
 'tools/vastu.html': """() => D.map(d => `वास्तु — ${d.n} दिशा: देवता ${d.dev}, तत्व ${d.tat}, ग्रह ${d.gr}, शुभ रंग ${d.rang}। यह दिशा देती है: ${d.gives}। यहाँ रखें: ${d.keep}। न रखें: ${d.avoid}। दोष: ${d.dosh} उपाय: ${d.upay} मुख्य द्वार: ${d.door}`)
   .concat(R.map(r => `वास्तु — ${r[0]}: सर्वश्रेष्ठ दिशा ${r[1]}; दूसरा विकल्प ${r[2]}; न बनाएं ${r[3]}। ${r[4]}`), Z.map(z => `वास्तु दोष — ${z[0]}: प्रभाव: ${z[1]} उपाय: ${z[2]}`), SH.map(s => `दुकान/ऑफिस वास्तु — ${s[0]}: ${s[1]}`), FQ.map(f => `वास्तु प्रश्न: ${f[0]} उत्तर: ${f[1]}`))""",
 'tools/upay.html': """() => U.map(u => `लाल किताब टोटके/उपाय — ${u[1]}: ` + u[2].join(' • '))""",
 'tools/swapna.html': """() => S.map(s => `स्वप्न फल — सपने में ${s[0]}: ${s[1]==='g'?'शुभ':s[1]==='b'?'अशुभ':'मिश्रित'} — ${s[2]}`).concat(K.map(k => `शकुन शास्त्र — ${k[0]}: ${k[1]==='g'?'शुभ':k[1]==='b'?'अशुभ':'मिश्रित'} — ${k[2]}`))""",
 'tools/stuti.html': """() => [].concat(...Object.keys(D).map(k => D[k].map(a => `${({aarti:'आरती',chalisa:'चालीसा',naam:'नामावली'})[k]||k} — ${a[0]} (${a[1]}): ${String(a[2]).replace(/\\s+/g,' ')}`)))""",
 'tools/shodash.html': """() => PRE.map((s,i) => `पूजा आरंभ ${i+1}. ${s[0]}: ${s[1]} ${s[2].map(m=>m[0]+': '+m[1]).join(' | ')}`).concat(SH.map((s,i) => `षोडशोपचार उपचार ${i+1} — ${s[0]}: ${s[1]} वैदिक मंत्र: ${s[2]} पौराणिक मंत्र: ${s[3]}`), HV.map((s,i) => `हवन पद्धति चरण ${i+1} — ${s[0]}: ${s[1]} ${s[2].map(m=>m[0]+': '+m[1]).join(' | ')}`))""",
 'tools/ratna.html': """() => Object.keys(GEM).map(p => { const g = GEM[p]; return `रत्न — ${({Sun:'सूर्य',Moon:'चंद्र',Mars:'मंगल',Mercury:'बुध',Jupiter:'गुरु (बृहस्पति)',Venus:'शुक्र',Saturn:'शनि',Rahu:'राहु',Ketu:'केतु'})[p]||p} ग्रह का रत्न ${g[0]}, उंगली ${g[2]}, धातु ${g[3]}, धारण समय ${g[4]}, मंत्र ${g[5]}, वजन ${g[6]}${UP[p]?', उपरत्न '+UP[p]:''}`; })""",
 'tools/muhurat.html': """() => Object.values(EV).map(e => e.info ? `मुहूर्त — ${e.t} (${e.al}): ${e.info} प्रमाण: ${e.pr.join('; ')}` : `मुहूर्त — ${e.t} (अन्य नाम: ${e.al}): नक्षत्र: ${e.nak === ALL ? 'कोई भी' : e.nakI.map(i => N.NAK[i]).join(', ')}। तिथि: ${e.tt.map(t => t === 15 ? 'पूर्णिमा' : N.TITHI[t - 1]).join(', ')}${e.k === 0 ? ' (केवल शुक्ल पक्ष)' : ''}। वार: ${e.vrI.map(v => N.VAAR[v]).join(', ')}।${e.maasI ? ' मास: ' + e.maasI.map(m => N.MAAS[m]).join(', ') + '।' : ''}${e.sun ? ' सूर्य: ' + e.sun.map(x => N.SIGN[x]).join(', ') + ' राशि में।' : ''}${e.age ? ' समय/आयु: ' + e.age + '।' : ''} ${(e.nt || []).join(' ')} प्रमाण: ${e.pr.join('; ')}`)""",
 'tools/garbh.html': """() => MO.map((m, i) => `गर्भ संस्कार — गर्भ का ${i + 1}वाँ मास (${m.bn}), मासाधिपति ग्रह ${m.g}: विकास: ${m.dev} आहार: ${m.ahar} दिनचर्या: ${m.vihar} पाठ: ${m.path} मंत्र: ${m.mantra} दान: ${m.daan}`).concat(N.MAAS.map((mm, i) => `जन्म मास फल — ${mm} मास में जन्म: ${JM[i]}`)).concat([...document.querySelectorAll('.kt,.av-card ul')].map(e => 'गर्भ संस्कार — ' + e.textContent))""",
 'tools/mulank.html': """() => M.slice(1).map((m,i) => `अंक ज्योतिष — मूलांक ${i+1} (स्वामी ${m[0]}): ${m[1]} मित्र अंक ${m[2]}, शत्रु अंक ${m[3]}, शुभ रंग ${m[4]}, शुभ दिन ${m[5]}`)""",
}
TITLES = {}
for c in json.load(open(os.path.join(ROOT, 'cards.json')))['cards']: TITLES.setdefault(c['path'].split('#')[0], c['title'])
KB = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    for path, js in X.items():
        pg.goto('http://localhost:8765/' + path); pg.wait_for_timeout(900)
        try: rows = pg.evaluate(js)
        except Exception as e: print('✗', path, str(e)[:150]); continue
        for r in rows:
            r = ' '.join(str(r).split()); t, pp = TITLES.get(path, path), path
            if r.startswith('शकुन शास्त्र'): t, pp = 'शकुन शास्त्र', 'tools/swapna.html#shakun'
            KB.append({'t': t, 'p': pp, 'x': r})
        print('✓', path, len(rows))
    pg.goto('http://localhost:8765/kundli/'); pg.wait_for_timeout(1200)
    lk = pg.evaluate("() => { const o = []; for (const p in K.LK) K.LK[p].forEach((r, i) => o.push(`लाल किताब — ${K.P[p].hi} ${i + 1}वें भाव (खाना ${i + 1}) में: फल: ${r[0]} उपाय: ${r[1]}`)); return o; }")
    for t in lk: KB.append({'t': 'लाल किताब ग्रह-भाव फल', 'p': 'kundli/', 'x': t})
    ds = pg.evaluate("""() => { const seen = {}, S = [[1996,1,22,20,0],[2024,1,11,17,30],[1995,8,15,10,30],[2026,12,8,2,10],[1990,5,5,6,15],[2001,3,9,23,40],[1985,10,25,14,5],[2010,7,7,4,50]];
      S.forEach(([y,m,d,hh,mm]) => { const inp = {y,m,d,hh,mm,lat:27.1,lon:84.09,tz:5.5}, k = Astro.kundli(inp), D = doshAll(k, inp); [...D.J, ...D.G, ...D.L, ...D.F].forEach(x => { if (x.f && !seen[x.n]) seen[x.n] = `दोष — ${x.n}: लक्षण/कारण: ${x.st === 'ask' ? x.how : ''} ${x.f} उपाय/शान्ति: ${x.u || ''} ${x.sh ? 'समय: ' + x.sh : ''} प्रमाण: ${(x.pr || []).join('; ')}`; }); });
      return Object.values(seen); }""")
    for t in ds: KB.append({'t': 'सम्पूर्ण दोष विचार', 'p': 'kundli/', 'x': t})
    print('✓ दोष', len(ds))
    b.close()
out = json.dumps({'v': len(KB), 'kb': KB}, ensure_ascii=False, separators=(',', ':'))
open(os.path.join(ROOT, 'tools/ai/kb.json'), 'w').write(out)
print(len(KB), 'खंड', len(out.encode()) // 1024, 'KB')
