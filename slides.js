// HashSmash slides. Every figure is drawn from DATA (data.js, built by build_data.py).
'use strict';

const NS = 'http://www.w3.org/2000/svg';
const COLOR = { 'SHA-256': '#9d8cf0', 'SHA3-256': '#8dd3ac', 'BLAKE3': '#efb46e' };
const HS = '#ff6565', DIM = '#8b8d93', FAINT = '#3a3c42', INK = '#e8e6e3';
const LIT = DATA.literature;
// ?attacks=all also shows attacks other than reduced-round full collisions.
const MODE = new URLSearchParams(location.search).get('attacks') === 'all' ? 'all' : 'collisions';
// ?metric=time scores by time alone (HashSmash's own scale). Default: Zooko's time × memory, log2 T + log2 bytes.
const METRIC = new URLSearchParams(location.search).get('metric') === 'time' ? 'time' : 'tm';
// HashSmash prices generic collision search for the full hash below 2^128 (DATA.generic: its best
// passed entry there, where no shortcut exists); its results are shifted so that this level is 2^128.
const asTime = (t, v) => v - DATA.generic[t.hash].time + 128;
const asTM = (t, v) => v - DATA.generic[t.hash].tm + 128;
const hsBest = t => METRIC === 'time' ? asTime(t, t.best) : asTM(t, t.bestTM);
const hsSteps = t => METRIC === 'time' ? t.steps.map(([ts, v, who]) => [ts, asTime(t, v), who]) : t.stepsTM.map(([ts, v, who]) => [ts, asTM(t, v), who]);
const COST_MODEL_ONLY = t => t.hash === 'SHA3-256' && t.rounds === 6;  // gain from per-digest pricing, ~2^128 digests
// display name: 'Cyberaxe (Jbenisek)'; short form 'Cyberaxe' where space is tight
const name = h => LIT.aliases && LIT.aliases[h] ? `${LIT.aliases[h]} (${h})` : h;
const fmt = v => (Math.round(v * 10) / 10).toString();

function el(tag, attrs, parent, text) {
  const e = document.createElementNS(NS, tag);
  if (tag === 'text') e.setAttribute('fill', INK);
  for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
function svg(id, w, h) {
  const box = document.getElementById(id);
  box.innerHTML = '';
  return el('svg', { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: 'xMidYMid meet' }, box);
}

// ---------------------------------------------------------------- title
function drawTitle() {
  const s = svg('f-title', 1600, 900);
  el('image', { href: 'HashSmash.png', x: 400, y: 10, width: 780, height: 780 }, s);
  el('text', { x: 800, y: 840, 'text-anchor': 'middle', 'font-size': 36, fill: INK }, s, 'https://HashSma.sh');
  el('text', { x: 800, y: 888, 'text-anchor': 'middle', 'font-size': 22, fill: DIM }, s, DATA.updated);
}

// Spread overlapping right-edge labels is left to the reader's eye for now (values differ enough).

// ---------------------------------------------------------------- 1. necessary and sufficient
function chip(s, x, y, text, col, opts = {}) {
  const w = opts.w || text.length * 13 + 36, h = opts.h || 48;
  el('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 24, fill: opts.fill || '#16171b', stroke: col, 'stroke-width': 2, 'stroke-dasharray': opts.dash || '' }, s);
  el('text', { x, y: y + 8, 'text-anchor': 'middle', 'font-size': opts.size || 22, fill: opts.ink || INK }, s, text);
  return w;
}
function drawHashes() {
  const s = svg('f-hashes', 1600, 800), cx = 800, cy = 420;
  el('text', { x: 80, y: 70, 'font-size': 26, fill: DIM }, s, 'necessary');
  const users = ['RSA', 'ECDSA', 'Ed25519', 'ML-DSA', 'TLS', 'git', 'Bitcoin'];
  users.forEach((u, i) => {
    const x = 260 + i * 180;
    chip(s, x, 130, u, DIM, { w: 150 });
    el('line', { x1: x, y1: 156, x2: cx + (x - cx) * 0.25, y2: cy - 130, stroke: FAINT, 'stroke-width': 2 }, s);
  });
  el('circle', { cx, cy, r: 120, fill: '#1d1e23', stroke: INK, 'stroke-width': 3 }, s);
  el('text', { x: cx, y: cy - 6, 'text-anchor': 'middle', 'font-size': 34, 'font-weight': 700 }, s, 'secure');
  el('text', { x: cx, y: cy + 34, 'text-anchor': 'middle', 'font-size': 34, 'font-weight': 700 }, s, 'hash');
  el('text', { x: 80, y: 600, 'font-size': 26, fill: '#8dd3ac' }, s, 'sufficient');
  const built = [['signatures', 'SLH-DSA · XMSS'], ['MACs', 'HMAC'], ['key derivation', 'HKDF'], ['random bits', 'Hash_DRBG'],
    ['encryption', 'symmetric'], ['commitments', 'Merkle trees'], ['proofs', 'STARKs']];
  built.forEach(([a, b], i) => {
    const x = 170 + i * 210, y = 680;
    el('line', { x1: cx + (x - cx) * 0.3, y1: cy + 115, x2: x, y2: y - 40, stroke: '#2f5c45', 'stroke-width': 2 }, s);
    el('rect', { x: x - 95, y: y - 40, width: 190, height: 86, rx: 14, fill: '#16171b', stroke: '#8dd3ac', 'stroke-width': 2 }, s);
    el('text', { x, y: y - 4, 'text-anchor': 'middle', 'font-size': 22, fill: '#8dd3ac', 'font-weight': 700 }, s, a);
    el('text', { x, y: y + 28, 'text-anchor': 'middle', 'font-size': 18, fill: DIM }, s, b);
  });
  const xx = 1300;
  el('rect', { x: xx - 150, y: cy - 50, width: 300, height: 100, rx: 14, fill: 'none', stroke: DIM, 'stroke-width': 2, 'stroke-dasharray': '7 6' }, s);
  el('text', { x: xx, y: cy + 8, 'text-anchor': 'middle', 'font-size': 22, fill: DIM }, s, '✗ public-key encryption');
}

// ---------------------------------------------------------------- 2. Hopwood: one leg or two
function drawHopwood() {
  const s = svg('f-hopwood', 1600, 760), GREEN = '#8dd3ac', top = 250, floor = 560;
  const leg = (x, label, col) => {
    el('rect', { x: x - 18, y: top + 24, width: 36, height: floor - top - 24, fill: col }, s);
    el('text', { x, y: floor + 44, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 700, fill: col }, s, label);
  };
  const tabletop = (cx, w) => el('rect', { x: cx - w / 2, y: top, width: w, height: 26, rx: 6, fill: INK }, s);
  el('line', { x1: 80, x2: 1520, y1: floor, y2: floor, stroke: FAINT, 'stroke-width': 3 }, s);
  // left: one leg
  const lx = 430;
  el('text', { x: lx, y: 120, 'text-anchor': 'middle', 'font-size': 32, 'font-weight': 700, fill: GREEN }, s, 'hash-based system');
  tabletop(lx, 360); leg(lx, 'hash', GREEN);
  el('rect', { x: lx - 90, y: floor - 16, width: 180, height: 16, rx: 4, fill: GREEN }, s);
  el('text', { x: lx, y: 680, 'text-anchor': 'middle', 'font-size': 26, fill: DIM }, s, 'falls if the hash breaks');
  // right: two legs, both needed
  const rx = 1170;
  el('text', { x: rx, y: 120, 'text-anchor': 'middle', 'font-size': 32, 'font-weight': 700, fill: HS }, s, 'anything else');
  tabletop(rx, 420); leg(rx - 170, 'hash', GREEN); leg(rx + 170, 'lattices, curves, McEliece, etc.', HS);
  el('text', { x: rx, y: 680, 'text-anchor': 'middle', 'font-size': 26, fill: DIM }, s, 'falls if the hash breaks');
  el('text', { x: rx, y: 718, 'text-anchor': 'middle', 'font-size': 26, fill: HS }, s, 'or if the other leg does');
}

// ---------------------------------------------------------------- 2b. signature table (Zooko 2017, Figure 0)
function drawSigTable() {
  const s = svg('f-sigtable', 1600, 700);
  const cols = [['today'], ['quantum', 'computer'], ['structured crypto', 'breakthrough'], ['hash', 'preimages']];
  const rows = [['hash-based (SPHINCS)', [1, 1, 1, 0]], ['other post-quantum (lattices, McEliece, etc.)', [1, 1, 0, 0]], ['pre-quantum (RSA, ECDSA, Ed25519)', [1, 0, 0, 0]]];
  const L = 700, cw = 215, top = 150, rh = 150;
  cols.forEach((lines, j) => lines.forEach((ln, k) =>
    el('text', { x: L + j * cw + cw / 2, y: top - 40 + k * 30 - (lines.length - 1) * 15, 'text-anchor': 'middle', 'font-size': 24, fill: DIM }, s, ln)));
  rows.forEach(([name, safe], i) => {
    const y = top + i * rh + rh / 2;
    el('text', { x: L - 30, y: y + 8, 'text-anchor': 'end', 'font-size': 22, 'font-weight': i === 0 ? 700 : 400 }, s, name);
    safe.forEach((ok, j) => el('circle', { cx: L + j * cw + cw / 2, cy: y, r: 42, fill: ok ? '#8dd3ac' : HS, opacity: 0.9 }, s));
  });
  el('circle', { cx: 600, cy: 650, r: 12, fill: '#8dd3ac' }, s); el('text', { x: 622, y: 658, 'font-size': 22, fill: DIM }, s, 'safe');
  el('circle', { cx: 760, cy: 650, r: 12, fill: HS }, s); el('text', { x: 782, y: 658, 'font-size': 22, fill: DIM }, s, 'you can be exploited');
}

// ---------------------------------------------------------------- 3. history of full hash functions
function drawHistory() {
  const Hh = LIT.history, W = 1600, Hgt = 760, s = svg('f-history', W, Hgt);
  document.getElementById('foot-history').textContent = 'green: no collision attack · red: collisions in practice · ◆ collision milestone'
    + (MODE === 'all' ? ' · • other attacks (not collisions)' : '');
  const L = 300, R = 1520, Y0 = 1989, Y1 = 2027, xv = y => L + (y - Y0) / (Y1 - Y0) * (R - L);
  const band = { g: '#2f6b4d', y: '#9a7a3c', r: '#a4403f' };
  for (let y = 1990; y <= 2025; y += 5) {
    el('line', { x1: xv(y), x2: xv(y), y1: 60, y2: 690, stroke: FAINT }, s);
    el('text', { x: xv(y), y: 720, 'text-anchor': 'middle', 'font-size': 18, fill: DIM }, s, y);
  }
  const laneH = 118, top = 80;
  Hh.lanes.forEach((ln, i) => {
    const y = top + i * laneH, h = 40;
    el('text', { x: L - 20, y: y + 28, 'text-anchor': 'end', 'font-size': 24, 'font-weight': 700 }, s, ln.name);
    ln.bands.forEach(([from, c], k) => {
      const to = k + 1 < ln.bands.length ? ln.bands[k + 1][0] : 2026.8;
      el('rect', { x: xv(from), y, width: xv(to) - xv(from), height: h, fill: band[c] }, s);
    });
    (ln.ranges || []).forEach(([from, to, label, detail]) => {
      const g = el('g', { style: 'cursor: help' }, s);
      el('line', { x1: xv(from), x2: xv(to), y1: y + h / 2, y2: y + h / 2, stroke: INK, 'stroke-width': 3, 'stroke-dasharray': '4 5' }, g);
      el('circle', { cx: xv(from), cy: y + h / 2, r: 6, fill: band.r, stroke: INK, 'stroke-width': 2 }, g);
      el('text', { x: xv(from) + 4, y: y - 10, 'font-size': 16, fill: INK }, g, `${label}, ≤${Math.floor(from)}`);
      if (detail) el('title', {}, g, detail);
    });
    const tag = (e, kind) => [e[0], e[1], kind, e[2]];
    const marks = ln.collisions.map(e => tag(e, 'c')).concat(MODE === 'all' ? ln.other.map(e => tag(e, 'o')) : []).concat((ln.events || []).map(e => tag(e, 'e')));
    marks.sort((a, b) => a[0] - b[0]).forEach(([yr, label, kind, detail], k) => {
      const x = xv(yr), ly = y + h + 22 + (k % 3) * 19, g = el('g', { style: 'cursor: help' }, s);
      if (kind === 'c') el('path', { d: `M${x},${y + h / 2 - 11} l11,11 l-11,11 l-11,-11 z`, fill: INK }, g);
      else if (kind === 'o') el('circle', { cx: x, cy: y + h / 2, r: 6, fill: '#16171b', stroke: INK, 'stroke-width': 2 }, g);
      else el('line', { x1: x, x2: x, y1: y, y2: y + h, stroke: INK, 'stroke-width': 3 }, g);
      el('rect', { x: x - 14, y: y - 4, width: 28, height: h + 8, fill: 'transparent' }, g);
      if (label) el('text', { x: x + 4, y: ly, 'font-size': 16, fill: kind === 'c' ? INK : DIM }, g, label);
      if (detail) el('title', {}, g, detail);
    });
  });
  const cx = xv(Hh.competition.year);
  el('line', { x1: cx, x2: cx, y1: 50, y2: 690, stroke: '#8dd3ac', 'stroke-width': 2, 'stroke-dasharray': '6 6' }, s);
  el('text', { x: cx - 8, y: 46, 'text-anchor': 'end', 'font-size': 20, fill: '#8dd3ac' }, s, Hh.competition.label);
}

// ---------------------------------------------------------------- end
function drawEnd() {
  const s = svg('f-end', 1600, 860);
  el('image', { href: 'HashSmash.png', x: 540, y: 20, width: 520, height: 520 }, s);
  el('text', { x: 800, y: 640, 'text-anchor': 'middle', 'font-size': 72, 'font-weight': 700 }, s, 'Questions');
  ['https://HashSma.sh', 'https://x.com/shieldedlabs', 'https://x.com/zooko'].forEach((t, i) =>
    el('text', { x: 800, y: 710 + i * 44, 'text-anchor': 'middle', 'font-size': 26, fill: DIM }, s, t));
}

// ---------------------------------------------------------------- main: designers cut rounds; attacks climb
function drawRounds() {
  const W = 1600, H = 820, s = svg('f-rounds', W, H), L = 110, R = 1400;
  const Y0 = 2000, Y1 = 2027.3, xv = y => L + (y - Y0) / (Y1 - Y0) * (R - L), xHS = xv(2026.77);
  const panels = [['SHA-256', 64, 20, 230], ['SHA3-256', 24, 290, 230], ['BLAKE3', 14, 560, 230]].map(p => [p[0], p[1] * 1.08, p[2], p[3]]);
  for (let y = 2000; y <= 2025; y += 5) el('text', { x: xv(y), y: 812, 'text-anchor': 'middle', 'font-size': 18, fill: DIM }, s, y);
  panels.forEach(([hash, maxR, top, h], pi) => {
    const col = COLOR[hash], bot = top + h - 30, yv = r => bot - r / maxR * (bot - top);
    const design = LIT.designs[hash];
    // design line: rounds chosen, stepping down
    let d = '', prev = null;
    design.forEach(([yr, r, nm], i) => {
      d += i ? ` H${xv(yr)} V${yv(r)}` : `M${xv(yr)},${yv(r)}`;
      el('text', { x: xv(yr) + 6, y: yv(r) - 8, 'font-size': 17, fill: col }, s, `${nm} · ${r}`);
      el('circle', { cx: xv(yr), cy: yv(r), r: 5, fill: col }, s);
    });
    d += ` H${R}`;
    // attack frontier: rounds with a published full collision, stepping up
    const pts = LIT.attacks.filter(a => a.hash === hash && !a.none).map(a => [a.year, a.rounds]).sort((a, b) => a[0] - b[0]);
    let ad = `M${xv(design[0][0])},${yv(0)}`, r = 0;
    for (const [yr, rounds] of pts) { if (rounds <= r) continue; ad += ` H${xv(yr)} V${yv(rounds)}`; r = rounds; }
    ad += ` H${xHS}`;
    const hsR = Math.max(0, ...Object.values(DATA.tracks).filter(t => t.hash === hash && !COST_MODEL_ONLY(t) && hsBest(t) < 128).map(t => t.rounds));
    // shaded margin between the two lines (polygon: design path forward, attack path back)
    const designPts = [], attackPts = [];
    { let cur = null; design.forEach(([yr, rr]) => { if (cur !== null) designPts.push([xv(yr), yv(cur)]); designPts.push([xv(yr), yv(rr)]); cur = rr; }); designPts.push([R, yv(cur)]); }
    { let cur = 0; attackPts.push([xv(design[0][0]), yv(0)]); for (const [yr, rounds] of pts) { if (rounds <= cur) continue; attackPts.push([xv(yr), yv(cur)]); attackPts.push([xv(yr), yv(rounds)]); cur = rounds; }
      attackPts.push([xHS, yv(cur)]); if (hsR > cur) { attackPts.push([xHS, yv(hsR)]); cur = hsR; } attackPts.push([R, yv(cur)]); }
    el('path', { d: 'M' + designPts.map(p => p.join(',')).join(' L') + ' L' + attackPts.slice().reverse().map(p => p.join(',')).join(' L') + ' Z', fill: col, opacity: 0.13 }, s);
    el('path', { d, fill: 'none', stroke: col, 'stroke-width': 3 }, s);
    el('path', { d: ad, fill: 'none', stroke: col, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, s);
    if (hsR > r) {
      el('path', { d: `M${xHS},${yv(r)} V${yv(hsR)} H${R}`, fill: 'none', stroke: HS, 'stroke-width': 3 }, s);
      el('circle', { cx: xHS, cy: yv(hsR), r: 6, fill: HS }, s);
    } else el('line', { x1: xHS, x2: R, y1: yv(r), y2: yv(r), stroke: col, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, s);
    const finalR = Math.max(r, hsR), lastDesign = design[design.length - 1][1];
    el('text', { x: R + 14, y: yv(lastDesign) + 6, 'font-size': 20, fill: col }, s, `${lastDesign} rounds`);
    el('text', { x: R + 14, y: yv(finalR) + 6, 'font-size': 20, fill: hsR > r ? HS : col }, s, `${finalR} attacked`);
    if (hsR > r) {  // HashSmash's attack beyond the published ones
      const tr = Object.values(DATA.tracks).find(t => t.hash === hash && t.rounds === hsR), who = tr.steps[tr.steps.length - 1][2];
      el('text', { x: xHS - 12, y: yv(hsR) - 12, 'text-anchor': 'end', 'font-size': 18, fill: HS }, s, hash === 'BLAKE3'
        ? `${name(who)} · 2^${fmt(asTime(tr, tr.best))} time · 2^${fmt(asTM(tr, tr.bestTM))} time × memory`
        : `${hsR}: first collision`);
    }
    el('line', { x1: L, x2: R, y1: yv(0), y2: yv(0), stroke: FAINT }, s);
    el('text', { x: L - 12, y: yv(0) + 6, 'text-anchor': 'end', 'font-size': 16, fill: DIM }, s, '0');
    el('text', { x: L - 12, y: top + 40, 'text-anchor': 'end', 'font-size': 22, 'font-weight': 700, fill: col }, s, hash === 'SHA3-256' ? 'Keccak' : hash === 'BLAKE3' ? 'BLAKE' : hash);
  });
}

// ---------------------------------------------------------------- main: the file drawer
function drawNegative() {
  const W = 1600, H = 860, s = svg('f-negative', W, H);
  // desk: the few published successes, lit
  const deskY = 250;
  el('rect', { x: 200, y: deskY, width: 1200, height: 14, rx: 4, fill: '#8b8d93' }, s);
  const papers = [[520, -40, -6], [600, -62, 4], [690, -44, -2], [1000, -58, 7], [1080, -40, -4]];
  papers.forEach(([x, dy, rot]) => {
    el('g', { transform: `rotate(${rot} ${x} ${deskY + dy})` }, s);
    const g = s.lastChild;
    el('rect', { x: x - 34, y: deskY + dy - 44, width: 68, height: 90, rx: 3, fill: '#e8e6e3' }, g);
    for (let k = 0; k < 5; k++) el('rect', { x: x - 24, y: deskY + dy - 30 + k * 14, width: 40 + (k % 2) * 8, height: 4, fill: '#8b8d93' }, g);
  });
  // lamp cone
  el('path', { d: `M800,40 L300,${deskY} L1300,${deskY} Z`, fill: '#e8e6e3', opacity: 0.06 }, s);
  el('circle', { cx: 800, cy: 40, r: 10, fill: '#e8e6e3' }, s);
  // drawers below, dark, deep
  const drawers = [[deskY + 40, 1], [deskY + 220, 0.75], [deskY + 400, 0.5]];
  drawers.forEach(([y, op], i) => {
    el('rect', { x: 200, y, width: 1200, height: 160, rx: 6, fill: '#121317', stroke: '#2a2b30', 'stroke-width': 2, opacity: op }, s);
    el('rect', { x: 760, y: y + 70, width: 80, height: 14, rx: 7, fill: '#3a3c42', opacity: op }, s);
    // crammed, unseen: many faint sheets
    for (let k = 0; k < 60; k++) {
      const x = 230 + k * 19.2;
      el('rect', { x, y: y + 18 + (k * 7) % 11, width: 14, height: 120, rx: 2, fill: '#1c1d22', stroke: '#26272c', opacity: op }, s);
    }
    if (i === 0) el('text', { x: 1300, y: y + 100, 'text-anchor': 'middle', 'font-size': 90, 'font-weight': 700, fill: '#3a3c42' }, s, '?');
  });
}

// ---------------------------------------------------------------- main: HashSmash, live
function drawActivity() {
  const s = svg('f-activity', 1700, 1352);
  el('image', { href: 'scrot.png', x: 0, y: 0, width: 1700, height: 1352 }, s);
}

// ---------------------------------------------------------------- navigation
const sections = [...document.querySelectorAll('section')];
const draw = { 's-title': drawTitle, 's-hashes': drawHashes, 's-hopwood': drawHopwood, 's-sigtable': drawSigTable, 's-history': drawHistory,
  's-activity': drawActivity, 's-rounds': drawRounds, 's-negative': drawNegative, 's-end': drawEnd };
let cur = Math.max(0, Math.min(sections.length - 1, parseInt(location.hash.slice(1) || '1', 10) - 1));
function show(i) {
  cur = Math.max(0, Math.min(sections.length - 1, i));
  sections.forEach((s, j) => s.classList.toggle('on', j === cur));
  draw[sections[cur].id]();
  document.getElementById('nav').textContent = `${cur + 1} / ${sections.length}` + (MODE === 'all' ? ' · all attacks' : '') + (METRIC === 'time' ? ' · time only' : '');
  history.replaceState(null, '', location.search + '#' + (cur + 1));
}
// ?print=1: lay out every slide, one per page, for PDF export.
const PRINT = new URLSearchParams(location.search).get('print');
if (PRINT) {
  const css = document.createElement('style');
  css.textContent = `@page { size: 1600px 900px; margin: 0 }
    html, body { height: auto } .nav { display: none }
    section.on { position: relative; inset: auto; width: 1600px; height: 900px; page-break-after: always; break-after: page }`;
  document.head.appendChild(css);
  sections.forEach(sec => { sec.classList.add('on'); draw[sec.id](); });
}
document.addEventListener('keydown', e => {
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) show(cur + 1);
  if (['ArrowLeft', 'PageUp'].includes(e.key)) show(cur - 1);
});
document.addEventListener('click', e => show(cur + (e.clientX > innerWidth / 3 ? 1 : -1)));
window.addEventListener('hashchange', () => { const i = parseInt(location.hash.slice(1), 10) - 1; if (i !== cur) show(i); });
if (!PRINT) show(cur);
