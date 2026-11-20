/* Astro Vikass — तेज़ लोडिंग कैश (Service Worker)
   होमपेज व cards.json: पहले इंटरनेट से ताज़ा (2.5 सेकंड में न आए तो कैश से)
   टूल्स, कुंडली, फॉन्ट: तुरंत कैश से, पीछे से अपडेट (अगली बार नया) */
const V = 'av-v15';
const PRE = ["./", "index.html", "cards.json", "tools/lib/places.js", "tools/lib/astro.js", "tools/lib/ui.js", "tools/lib/ui.css", "tools/lib/akshar.js", "tools/lib/calendar.js", "tools/panchang.html", "tools/shivvas.html", "tools/dhyan.html", "tools/jaap.html", "tools/prem.html", "tools/rashifal.html", "tools/milan.html", "tools/muhurat.html", "tools/vrat.html", "tools/sadesati.html", "tools/gochar.html", "tools/lagna.html", "tools/hora.html", "tools/bhadra.html", "tools/grahan.html", "tools/namakshar.html", "tools/ratna.html", "tools/mulank.html", "tools/stuti.html", "tools/sankalp.html", "tools/vratnirnay.html", "tools/mala.html", "tools/dakshina.html", "tools/vastu.html", "tools/upay.html", "tools/swapna.html", "kundli/"];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(PRE.map(u => c.add(u).catch(() => { })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
function netFirst(req) {
  return caches.open(V).then(c => new Promise(res => {
    let done = false;
    const t = setTimeout(() => c.match(req).then(r => { if (r && !done) { done = true; res(r); } }), 2500);
    fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); clearTimeout(t); if (!done) { done = true; res(r); } })
      .catch(() => c.match(req).then(r => { clearTimeout(t); if (!done) { done = true; res(r || Response.error()); } }));
  }));
}
function swr(req) {
  return caches.open(V).then(c => c.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    const p = u.pathname.replace(/^.*\/jyotishi/, '');
    if (p === '/' || p === '' || p === '/index.html' || p === '/cards.json') return e.respondWith(netFirst(req));
    return e.respondWith(swr(req));
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return e.respondWith(swr(req));
});
