/* Client-side name preview uses the admin-defined mapping (cached). Official results come from the server. */
const NUM_DEFAULT = {
  letters: { A:1,I:1,J:1,Q:1,Y:1,B:2,K:2,R:2,C:3,G:3,L:3,S:3,D:4,M:4,T:4,E:5,H:5,N:5,X:5,U:6,V:6,W:6,O:7,Z:7,F:8,P:8 },
  planets: { 1:'Sun',2:'Moon',3:'Jupiter',4:'Rahu',5:'Mercury',6:'Venus',7:'Ketu',8:'Saturn',9:'Mars' }
};
let NUM_MAP = NUM_DEFAULT;
const digitSum = n => String(Math.abs(n)).split('').reduce((a, d) => a + (+d || 0), 0);
const reduce = n => { n = Math.abs(n); while (n > 9) n = digitSum(n); return n; };

function previewName(name, map = NUM_MAP) {
  const letters = [];
  for (const ch of String(name).toUpperCase()) { const v = map.letters[ch]; if (v !== undefined) letters.push({ ch, v }); }
  const compound = letters.reduce((a, l) => a + l.v, 0), root = compound ? reduce(compound) : 0;
  return { letters, compound, root, planet: map.planets[root] || '' };
}

/** Draws letter tiles + "13 / 4" into container. */
function renderNameCard(box, r) {
  if (!r.letters.length) { box.innerHTML = '<p class="empty-note">Type a name to see each letter&rsquo;s number.</p>'; return; }
  const tiles = r.letters.map(l => `<div class="tile"><i>${esc(l.ch)}</i><b>${l.v}</b></div>`).join('');
  box.innerHTML = `<div class="tiles" aria-hidden="true">${tiles}</div>
    <div class="total"><div class="num">${r.compound}<small> / </small>${r.root}</div>
    <div class="meta">Ruling number <b>${r.root}</b>${r.planet ? ', planet <b>' + esc(r.planet) + '</b>' : ''}</div></div>`;
}
