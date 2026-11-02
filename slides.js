// HashSmash slides. Every figure is drawn from DATA (data.js, built by build_data.py).
'use strict';

const NS = 'http://www.w3.org/2000/svg';
const COLOR = { 'SHA-256': '#9d8cf0', 'SHA3-256': '#8dd3ac', 'BLAKE3': '#efb46e' };
const ROUND_COLORS = ['#e8e6e3', '#c8bdf5', '#7f8cf0', '#f1cfa0', '#8dd3ac'];
const HS = '#ff6565', DIM = '#8b8d93', FAINT = '#3a3c42', INK = '#e8e6e3', PENDING = '#8b8d93';
const FAMILIES = [
  { hash: 'SHA-256', rounds: [24, 32, 37, 38] },
  { hash: 'SHA3-256', rounds: [5, 6] },
  { hash: 'BLAKE3', rounds: [2] },
];
const LIT = DATA.literature;
// ?attacks=all also shows attacks other than reduced-round full collisions.
const MODE = new URLSearchParams(location.search).get('attacks') === 'all' ? 'all' : 'collisions';
// ?metric=time scores by time alone (HashSmash's own scale). Default: Zooko's time × memory, log2 T + log2 bytes.
const METRIC = new URLSearchParams(location.search).get('metric') === 'time' ? 'time' : 'tm';
const litCost = a => a.log2T === null ? null : METRIC === 'time' ? a.log2T : a.log2T + (typeof a.mem === 'number' ? a.mem : 0);
const hsBest = t => METRIC === 'time' ? t.best : t.bestTM;
const hsSteps = t => METRIC === 'time' ? t.steps : t.stepsTM;
const hsPoints = t => t.points.map(([ts, T, m]) => [ts, METRIC === 'time' ? T : T + m]);
const METRIC_LABEL = METRIC === 'time' ? 'log₂ time' : 'log₂ (time × memory)';
const COST_MODEL_ONLY = t => t.hash === 'SHA3-256' && t.rounds === 6;  // gain from per-digest pricing, ~2^128 digests
// display name: 'Cyberaxe (Jbenisek)'; short form 'Cyberaxe' where space is tight
const name = h => LIT.aliases && LIT.aliases[h] ? `${LIT.aliases[h]} (${h})` : h;
const shortName = h => LIT.aliases && LIT.aliases[h] ? LIT.aliases[h] : h;
const trackOf = (hash, rounds) => Object.values(DATA.tracks).find(t => t.hash === hash && t.rounds === rounds);
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
const t2ms = s => Date.parse(s.length === 16 ? s + ':00Z' : s);

// Strength of one target over time, from the literature: steps [year, level, kind].
// kind: 'start' | 'known' | 'practical' (real collision, no stated cost) | 'unknown' (no figure).
// After 'practical' or 'unknown' the level is only an upper bound, drawn dashed.
function litSteps(hash, rounds) {
  const steps = [[LIT.hashes[hash].published, 128, 'start']];
  const attacks = LIT.attacks.filter(a => a.hash === hash && a.rounds === rounds && !a.none)
    .sort((a, b) => a.year - b.year);
  for (const a of attacks) {
    const prev = steps[steps.length - 1][1];
    const c = litCost(a);
    if (c === null || a.mem === 'unknown') steps.push([a.year, prev, a.practical ? 'practical' : 'unknown', a]);
    else if (c < prev) steps.push([a.year, c, 'known', a]);
  }
  return steps;
}

// ---------------------------------------------------------------- title
function drawTitle() {
  const s = svg('f-title', 1600, 860);
  el('image', { href: 'HashSmash.png', x: 400, y: 10, width: 780, height: 780 }, s);
  el('text', { x: 800, y: 840, 'text-anchor': 'middle', 'font-size': 36, fill: INK }, s, 'https://HashSma.sh');
}

// ---------------------------------------------------------------- timeline
function drawTimeline() {
  document.getElementById('foot-timeline').textContent = `${METRIC_LABEL} · each line: one round count, from the generic 2^128 at publication. ◆ published collision attack · ◇ real collision, cost not stated · ● HashSmash · dashed: at most this level`
    + (MODE === 'all' ? ' · • other attacks (not collisions)' : '');
  const W = 1600, H = 900, s = svg('f-timeline', W, H);
  const L = 90, yearsW = 980, gap = 40, bandW = 330, R = L + yearsW + gap + bandW;
  const Y0 = 2000, Y1 = 2026.8;
  const B0 = t2ms('2026-10-04T00:00'), B1 = t2ms('2026-10-11T12:00');
  const xYear = y => L + (y - Y0) / (Y1 - Y0) * yearsW;
  const xBand = ms => L + yearsW + gap + (ms - B0) / (B1 - B0) * bandW;
  const panelH = 270, top0 = 20;

  FAMILIES.forEach((fam, fi) => {
    const top = top0 + fi * (panelH + 22), bot = top + panelH - 40;
    const yv = v => bot - Math.max(0, Math.min(140, v)) / 140 * (bot - top);
    const g = el('g', {}, s);
    el('rect', { x: L - 80, y: top - 22, width: R - L + 310, height: panelH + 6, rx: 14, fill: '#16171b' }, g);
    // grid and axes
    for (const v of [0, 32, 64, 96, 128]) {
      el('line', { x1: L, x2: R, y1: yv(v), y2: yv(v), stroke: v === 128 ? DIM : FAINT,
        'stroke-dasharray': v === 128 ? '5 6' : '', 'stroke-width': 1 }, g);
      el('text', { x: L - 10, y: yv(v) + 6, 'text-anchor': 'end', 'font-size': 16, fill: DIM }, g, v);
    }
    el('text', { x: L - 60, y: (top + bot) / 2, transform: `rotate(-90 ${L - 60} ${(top + bot) / 2})`,
      'text-anchor': 'middle', 'font-size': 16, fill: DIM }, g, METRIC === 'time' ? 'log₂(T)' : 'log₂(T·M)');
    el('rect', { x: L + yearsW + gap, y: top, width: bandW, height: bot - top, fill: HS, opacity: 0.06 }, g);
    for (const y of [2000, 2005, 2010, 2015, 2020, 2025]) {
      el('text', { x: xYear(y), y: bot + 24, 'text-anchor': 'middle', 'font-size': 16, fill: DIM }, g, y);
    }
    for (const d of [5, 7, 9, 11]) {
      el('text', { x: xBand(t2ms(`2026-10-${String(d).padStart(2, '0')}T00:00`)), y: bot + 24,
        'text-anchor': 'middle', 'font-size': 16, fill: HS }, g, `Oct ${d}`);
    }
    // axis break
    const bx = L + yearsW + gap / 2;
    el('path', { d: `M${bx - 9},${bot + 8} l8,-16 M${bx + 1},${bot + 8} l8,-16`, stroke: DIM, 'stroke-width': 2 }, g);
    el('text', { x: L + yearsW + gap + bandW / 2, y: top + 14, 'text-anchor': 'middle', 'font-size': 17, fill: HS }, g, 'HashSmash week');
    // family label and publication marker
    el('text', { x: L - 60, y: top + 14, 'font-size': 24, 'font-weight': 700, fill: COLOR[fam.hash] }, g, LIT.hashes[fam.hash].title || fam.hash);
    const H = LIT.hashes[fam.hash];
    for (const [yr, label] of H.milestones) {
      el('line', { x1: xYear(yr), x2: xYear(yr), y1: top + 24, y2: bot, stroke: COLOR[fam.hash], 'stroke-width': 2, opacity: 0.55 }, g);
      el('text', { x: xYear(yr) + 6, y: bot - 8, 'font-size': 15, fill: COLOR[fam.hash] }, g, label);
    }
    (MODE === 'all' ? LIT.otherAttacks : []).filter(o => o.hash === fam.hash).forEach((o, k) => {
      const yy = yv(128) + 26 + (k % 2) * 22;
      el('circle', { cx: xYear(o.year), cy: yy - 5, r: 3.5, fill: DIM }, g);
      el('text', { x: xYear(o.year) + 7, y: yy, 'font-size': 14, fill: DIM }, g, o.label);
      el('title', {}, g.lastChild, o.ref);
    });

    fam.rounds.forEach((r, ri) => {
      const col = ROUND_COLORS[ri % ROUND_COLORS.length];
      const steps = litSteps(fam.hash, r);
      const track = trackOf(fam.hash, r);
      // literature part, years axis
      let [px, py, pendingSince] = [xYear(steps[0][0]), steps[0][1], false];
      const seg = (x1, y1, x2, y2, dashed) => el('path', { d: `M${x1},${yv(y1)} H${x2} V${yv(y2)}`, fill: 'none',
        stroke: col, 'stroke-width': 2.5, 'stroke-dasharray': dashed ? '3 5' : '', opacity: 0.9 }, g);
      for (const [yr, lv, kind, a] of steps.slice(1)) {
        seg(px, py, xYear(yr), lv, pendingSince);
        if (kind === 'known') {
          el('path', { d: `M${xYear(yr)},${yv(lv) - 8} l8,8 l-8,8 l-8,-8 z`, fill: col }, g);
          el('title', {}, g.lastChild, `${a.ref}: 2^${litCost(a)}`);
        } else if (kind === 'practical') {
          el('path', { d: `M${xYear(yr)},${yv(lv) - 8} l8,8 l-8,8 l-8,-8 z`, fill: '#16171b', stroke: col, 'stroke-width': 2 }, g);
          el('title', {}, g.lastChild, a.ref);
          pendingSince = true;
        } else {
          el('text', { x: xYear(yr), y: yv(lv) - 8, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: PENDING }, g, '?');
          el('title', {}, g.lastChild, a.ref);
          pendingSince = true;
        }
        [px, py] = [xYear(yr), lv];
      }
      // carry across the break into the band
      const bandStart = L + yearsW + gap;
      seg(px, py, bandStart, py, pendingSince);
      let level = py, x = bandStart;
      const hsCol = track && COST_MODEL_ONLY(track) ? DIM : HS, hsDash = track && COST_MODEL_ONLY(track) ? '6 5' : '';
      if (track) {
        for (const [ts, best] of hsSteps(track)) {
          if (best >= level) continue;
          const nx = xBand(t2ms(ts));
          el('path', { d: `M${x},${yv(level)} H${nx} V${yv(best)}`, fill: 'none', stroke: hsCol, 'stroke-width': 2.5, 'stroke-dasharray': hsDash }, g);
          el('circle', { cx: nx, cy: yv(best), r: 4.5, fill: col, stroke: hsCol, 'stroke-width': 1.5 }, g);
          [x, level] = [nx, best];
        }
      }
      el('line', { x1: x, x2: R, y1: yv(level), y2: yv(level), stroke: track && hsBest(track) < py ? hsCol : col, 'stroke-width': 2.5, 'stroke-dasharray': hsDash }, g);
      const hsWon = track && hsBest(track) < py;
      el('text', { x: R + 12, y: yv(level) + 6, 'font-size': 17, fill: col }, g,
        `${r}r  ${hsWon ? '2^' + fmt(level) : pendingSince ? '≤2^' + fmt(level) : '2^' + fmt(level)}`);
    });
  });
}

// Spread overlapping right-edge labels is left to the reader's eye for now (values differ enough).

// ---------------------------------------------------------------- security margin
function drawMargin() {
  const W = 1600, H = 700, s = svg('f-margin', W, H), L = 260, Wbar = 1200, barH = 70;
  FAMILIES.forEach((fam, i) => {
    const total = LIT.hashes[fam.hash].rounds, y = 90 + i * 200, xr = r => L + r / total * Wbar;
    const pub = Math.max(0, ...LIT.attacks.filter(a => a.hash === fam.hash && !a.none).map(a => a.rounds));
    const hsRounds = Object.values(DATA.tracks).filter(t => t.hash === fam.hash && hsBest(t) < 128);
    const hsReal = Math.max(0, ...hsRounds.filter(t => !COST_MODEL_ONLY(t)).map(t => t.rounds));
    const hsCost = Math.max(0, ...hsRounds.filter(COST_MODEL_ONLY).map(t => t.rounds));
    el('text', { x: L - 30, y: y + 46, 'text-anchor': 'end', 'font-size': 32, 'font-weight': 700, fill: COLOR[fam.hash] }, s, fam.hash);
    el('rect', { x: L, y, width: Wbar, height: barH, fill: '#1d1e23', stroke: FAINT }, s);
    for (let r = 1; r < total; r++) el('line', { x1: xr(r), x2: xr(r), y1: y, y2: y + barH, stroke: '#0e0f12', 'stroke-width': total > 30 ? 1 : 3 }, s);
    if (pub) el('rect', { x: L, y, width: xr(pub) - L, height: barH, fill: DIM, opacity: 0.75 }, s);
    if (hsReal > pub) el('rect', { x: xr(pub), y, width: xr(hsReal) - xr(pub), height: barH, fill: HS }, s);
    if (hsCost > Math.max(pub, hsReal)) el('rect', { x: xr(Math.max(pub, hsReal)), y, width: xr(hsCost) - xr(Math.max(pub, hsReal)), height: barH,
      fill: 'none', stroke: DIM, 'stroke-width': 3, 'stroke-dasharray': '8 6' }, s);
    const reach = Math.max(pub, hsReal);
    el('text', { x: xr(reach), y: y - 14, 'text-anchor': 'middle', 'font-size': 22, fill: hsReal > pub ? HS : DIM }, s, `${reach}`);
    el('text', { x: L + Wbar + 16, y: y + 46, 'font-size': 24, fill: DIM }, s, `/ ${total}`);
  });
  const lg = (x, fill, stroke, t) => { el('rect', { x, y: 640, width: 36, height: 24, fill, stroke: stroke || 'none', 'stroke-width': 2, 'stroke-dasharray': stroke ? '6 4' : '' }, s);
    el('text', { x: x + 46, y: 659, 'font-size': 20, fill: DIM }, s, t); };
  lg(L, DIM, null, 'published before HashSmash');
  lg(L + 420, HS, null, 'new from HashSmash');
  lg(L + 780, 'none', DIM, 'HashSmash, cost model only');
}

// ---------------------------------------------------------------- before / after
function drawBeforeAfter() {
  const rows = [['SHA-256', 37], ['SHA-256', 38], ['SHA3-256', 5], ['SHA3-256', 6], ['BLAKE3', 2]];
  const W = 1600, H = 820, s = svg('f-before-after', W, H);
  const L = 330, R = 1300, top = 70, rowH = Math.floor(660 / rows.length);
  const xv = v => L + v / 130 * (R - L);
  for (const v of [0, 32, 64, 96, 128]) {
    el('line', { x1: xv(v), x2: xv(v), y1: top - 20, y2: top + rows.length * rowH - 30, stroke: v === 128 ? DIM : FAINT, 'stroke-dasharray': v === 128 ? '5 6' : '' }, s);
    el('text', { x: xv(v), y: top - 30, 'text-anchor': 'middle', 'font-size': 18, fill: DIM }, s, v === 128 ? '128 generic' : v);
  }
  el('text', { x: L, y: top + rows.length * rowH + 5, 'font-size': 18, fill: DIM }, s, 'log₂(T) · ← cheaper attack');
  // legend
  const lg = (y, col, dash, t) => { el('line', { x1: R + 60, x2: R + 110, y1: y, y2: y, stroke: col, 'stroke-width': 5, 'stroke-dasharray': dash }, s);
    el('text', { x: R + 120, y: y + 6, 'font-size': 18, fill: DIM }, s, t); };
  lg(top + rows.length * rowH - 40, HS, '', 'new result');
  lg(top + rows.length * rowH, DIM, '8 6', 'gain unconfirmed');
  rows.forEach(([hash, r], i) => {
    const y = top + i * rowH + 30, steps = litSteps(hash, r), last = steps[steps.length - 1];
    const known = steps.filter(st => st[2] === 'known' || st[2] === 'start'), lastKnown = known[known.length - 1];
    const before = lastKnown[1], approx = lastKnown[3] && lastKnown[3].approx;
    const pending = last[2] === 'practical' || last[2] === 'unknown' || approx, after = hsBest(trackOf(hash, r));
    const grey = pending || COST_MODEL_ONLY({ hash, rounds: r }), col = grey ? DIM : HS;
    el('text', { x: L - 30, y: y + 8, 'text-anchor': 'end', 'font-size': 26, fill: COLOR[hash] }, s, `${hash} · ${r}`);
    el('line', { x1: xv(before), x2: xv(after) + 12, y1: y, y2: y, stroke: col, 'stroke-width': 5, 'stroke-dasharray': grey ? '8 6' : '' }, s);
    el('path', { d: `M${xv(after)},${y} l16,-11 v22 z`, fill: col }, s);
    el('circle', { cx: xv(before), cy: y, r: 9, fill: DIM }, s);
    const bl = steps.length === 1 ? 'none published'
      : `${approx ? '≈' : ''}2^${fmt(before)}` + (last[2] === 'practical' ? ' · then a real pair' : last[2] === 'unknown' ? ' · newer: ?' : approx ? ' real pair' : '');
    el('text', { x: xv(before), y: y - 18, 'text-anchor': 'middle', 'font-size': 18, fill: DIM }, s, bl);
    el('text', { x: xv(after), y: y + 38, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, fill: col }, s,
      `2^${fmt(after)}` + (COST_MODEL_ONLY({ hash, rounds: r }) ? ' (cost model)' : ''));
  });
}

// ---------------------------------------------------------------- SHA-256 38 rounds anatomy
function drawAnatomy() {
  const W = 1600, H = 800, s = svg('f-anatomy', W, H);
  const hs = trackOf('SHA-256', 38).best;
  const bars = [
    { v: 128, label: 'generic birthday attack', who: 'any hash with a 256-bit output', col: DIM },
    { v: 104.3, label: 'first 38-step attack', who: 'Li et al., ePrint 2026/1120 · negligible memory', col: COLOR['SHA-256'] },
    { v: 80.5, label: 'HashSmash: dense-part variants', who: '2^37.5 variants per first block · small tables', col: HS },
    { v: hs, label: 'HashSmash: plus 2^80-byte tables', who: 'unscored memory, 1 operation per lookup', col: '#ff9a9a' },
  ];
  const L = 80, top = 80, barH = 110, gapY = 50, xv = v => L + v / 130 * 700;
  bars.forEach((b, i) => {
    const y = top + i * (barH + gapY);
    el('rect', { x: L, y, width: xv(b.v) - L, height: barH, rx: 6, fill: b.col, opacity: i === 0 ? 0.35 : 0.85 }, s);
    el('text', { x: xv(b.v) + 18, y: y + 68, 'font-size': 44, 'font-weight': 700, fill: b.col }, s, `2^${fmt(b.v)}`);
    el('text', { x: 980, y: y + 48, 'font-size': 28, 'font-weight': 700, fill: b.col }, s, b.label);
    el('text', { x: 980, y: y + 82, 'font-size': 19, fill: DIM }, s, b.who);
    if (i > 0) {
      const d = bars[i - 1].v - b.v, ym = y - gapY / 2;
      el('text', { x: xv(b.v) + 18, y: ym + 8, 'font-size': 22, fill: i === 2 ? HS : DIM }, s,
        `−${fmt(d)} bits${i === 2 ? '  new idea' : i === 3 ? '  memory priced free' : ''}`);
    }
  });
}

// ---------------------------------------------------------------- the week
function drawWeek() {
  const W = 1600, H = 900, s = svg('f-week', W, H);
  const L = 100, R = 1500, B0 = t2ms('2026-10-04T12:00'), B1 = t2ms('2026-10-11T12:00');
  const xt = ms => L + (ms - B0) / (B1 - B0) * (R - L);
  FAMILIES.forEach((fam, fi) => {
    const top = 20 + fi * 292, bot = top + 240, yv = v => bot - Math.min(140, v) / 140 * (bot - top);
    el('rect', { x: 20, y: top - 14, width: W - 40, height: 280, rx: 14, fill: '#16171b' }, s);
    for (const v of [0, 32, 64, 96, 128]) {
      el('line', { x1: L, x2: R, y1: yv(v), y2: yv(v), stroke: v === 128 ? DIM : FAINT, 'stroke-dasharray': v === 128 ? '5 6' : '' }, s);
      el('text', { x: L - 12, y: yv(v) + 6, 'text-anchor': 'end', 'font-size': 16, fill: DIM }, s, v);
    }
    for (let d = 5; d <= 11; d++) el('text', { x: xt(t2ms(`2026-10-${String(d).padStart(2, '0')}T00:00`)), y: bot + 24, 'text-anchor': 'middle', 'font-size': 16, fill: DIM }, s, `Oct ${d}`);
    el('text', { x: L + 10, y: top + 18, 'font-size': 24, 'font-weight': 700, fill: COLOR[fam.hash] }, s, fam.hash);
    const rs = fam.rounds.filter(r => trackOf(fam.hash, r));
    rs.forEach((r, ri) => {
      const t = trackOf(fam.hash, r), col = ROUND_COLORS[(fam.rounds.indexOf(r)) % ROUND_COLORS.length];
      for (const [ts, v] of hsPoints(t)) el('circle', { cx: xt(t2ms(ts)), cy: yv(v), r: 4, fill: 'none', stroke: col, 'stroke-width': 1.3, opacity: 0.55 }, s);
      let d = '', lv = null;
      for (const [ts, v] of hsSteps(t)) { const x = xt(t2ms(ts)); d += lv === null ? `M${x},${yv(v)}` : ` H${x} V${yv(v)}`; lv = v; }
      d += ` H${R}`;
      el('path', { d, fill: 'none', stroke: col, 'stroke-width': 2.5 }, s);
      el('text', { x: R + 10, y: yv(lv) + 6, 'font-size': 17, fill: col }, s, `${r}r ${fmt(lv)}`);
    });
  });
}

// ---------------------------------------------------------------- who
function drawWho() {
  const W = 1600, H = 800, s = svg('f-who', W, H), st = DATA.stats;
  // outcomes
  const passed = (st.statuses.review || 0) + (st.statuses.accepted || 0);
  const parts = [['passed AI review', passed, HS], ['failed checks', st.statuses.failed || 0, '#5a5c63'],
    ['rejected', st.statuses.rejected || 0, '#3f4046'], ['cancelled', st.statuses.cancelled || 0, '#2c2d32']];
  const total = parts.reduce((a, p) => a + p[1], 0);
  let x = 100;
  el('text', { x: 100, y: 60, 'font-size': 28, 'font-weight': 700 }, s, `${total} submissions · ${st.solvers} solvers`);
  for (const [k, v, c] of parts) {
    const w = v / total * 1400;
    el('rect', { x, y: 85, width: w, height: 56, fill: c }, s);
    if (w > 90) el('text', { x: x + 12, y: 122, 'font-size': 20, fill: INK }, s, `${k} ${v}`);
    x += w;
  }
  // models (top 10, labels as solvers wrote them)
  el('text', { x: 100, y: 220, 'font-size': 24, fill: DIM }, s, 'model named by the solver (top 10)');
  const top = st.models.slice(0, 10), max = top[0][1];
  top.forEach(([m, n], i) => {
    const y = 245 + i * 52;
    el('rect', { x: 520, y, width: n / max * 900, height: 38, rx: 4, fill: COLOR['SHA-256'], opacity: 0.8 }, s);
    el('text', { x: 500, y: y + 27, 'text-anchor': 'end', 'font-size': 20 }, s, m.length > 32 ? m.slice(0, 31) + '…' : m);
    el('text', { x: 530 + n / max * 900, y: y + 27, 'font-size': 20, fill: DIM }, s, n);
  });
}

// ---------------------------------------------------------------- sources
function drawSources() {
  const box = document.getElementById('f-sources');
  const rows = LIT.attacks.map(a => `<tr><td>${a.hash}</td><td>${a.rounds}</td><td>${a.year.toFixed(1)}</td>
    <td>${a.none ? 'none' : a.log2T === null ? '?' : '2^' + a.log2T}</td><td>${a.ref}</td>
    <td style="color:${a.source === 'pending' ? '#ff6565' : '#8b8d93'}">${a.source}</td></tr>`).join('');
  const none = LIT.noPriorAttack.map(n => `<li>${LIT.hashes[n.hash].title || n.hash}: ${n.note}</li>`).join('')
    + (LIT.otherAttacks || []).map(o => `<li>${LIT.hashes[o.hash].title || o.hash}, not collisions: ${o.ref}</li>`).join('');
  box.innerHTML = `<table style="border-collapse:collapse;font-size:1.45vh;line-height:1.35">
    <tr style="color:#8b8d93;text-align:left"><th>hash</th><th>rounds</th><th>year</th><th>log₂T</th><th>reference</th><th>number read from</th></tr>
    ${rows}</table><ul style="font-size:1.45vh;color:#8b8d93;margin-top:1vh">${none}
    <li>HashSmash numbers: Yukon submissions that passed AI review (status review or accepted); human review pending. Their unit is log₂ of total charged computation in target-compression equivalents (cost model collision-frontier-v5, memory reported but unscored); papers count calls to the reduced hash.</li></ul>`;
  box.querySelectorAll('td,th').forEach((c, i) => { c.style.padding = '0.3vh 1vw'; if (c.cellIndex !== 4) c.style.whiteSpace = 'nowrap'; });
}

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

// ---------------------------------------------------------------- 4. credits helper: bits taken off the record, below a level
function credits(track, from, steps) {
  const out = []; let level = from;
  for (const [, best, who] of (steps || hsSteps(track))) {
    if (best >= level) continue;
    const last = out[out.length - 1];
    if (last && last[0] === who) last[1] += level - best; else out.push([who, level - best]);
    level = best;
  }
  return out;
}
const HANDLE_COLORS = ['#ff6565', '#efb46e', '#9d8cf0', '#8dd3ac', '#7fc4f0', '#f08cc8', '#c8bdf5', '#e8e6e3'];
function creditBar(s, x0, y, xv, from, track, colorOf) {
  let x = xv(from);
  const parts = credits(track, from);
  parts.forEach(([who, bits], k) => {
    const x2 = xv(Math.max(0, xv.inv(x) - bits));
    el('rect', { x: x2, y, width: x - x2, height: 34, fill: colorOf(who) }, s);
    if (x - x2 > 70) el('text', { x: (x + x2) / 2, y: y + 24, 'text-anchor': 'middle', 'font-size': 16, fill: '#0e0f12', 'font-weight': 700 }, s, shortName(who));
    x = x2;
  });
  return parts;
}
function colorMap() { const m = new Map(); return h => { if (!m.has(h)) m.set(h, HANDLE_COLORS[m.size % HANDLE_COLORS.length]); return m.get(h); }; }

// ---------------------------------------------------------------- 4b. SHA-256 37 and 38
function drawShaCredits() {
  const W = 1600, H = 800, s = svg('f-sha256', W, H), L = 340, R = 1380;
  const xv = v => L + v / 130 * (R - L); xv.inv = x => (x - L) / (R - L) * 130;
  const col = colorMap();
  for (const v of [0, 32, 64, 96, 128]) {
    el('line', { x1: xv(v), x2: xv(v), y1: 60, y2: 520, stroke: v === 128 ? DIM : FAINT, 'stroke-dasharray': v === 128 ? '5 6' : '' }, s);
    el('text', { x: xv(v), y: 50, 'text-anchor': 'middle', 'font-size': 18, fill: DIM }, s, v === 128 ? '128 generic' : v);
  }
  const rows = [
    { r: 37, paper: 79.1, paperRef: 'Li et al. 2026/1120 · negligible memory', mem: 52.1, idea: 'idea: Step-1 variants (itseasypop, qkniep)' },
    { r: 38, paper: 104.3, paperRef: 'Li et al. 2026/1120 · negligible memory', mem: 80.42, small: 80.5, idea: 'idea: dense-part variants (qkniep, 0xshikhar)' },
  ];
  rows.forEach((row, i) => {
    const y = 110 + i * 210, t = trackOf('SHA-256', row.r), best = t.best;
    el('text', { x: L - 30, y: y + 30, 'text-anchor': 'end', 'font-size': 30, 'font-weight': 700, fill: COLOR['SHA-256'] }, s, `${row.r} rounds`);
    el('circle', { cx: xv(row.paper), cy: y + 17, r: 10, fill: DIM }, s);
    el('text', { x: xv(row.paper) + 16, y: y + 24, 'font-size': 20, fill: DIM }, s, `2^${row.paper} paper`);
    creditBar(s, L, y, xv, row.paper, t, col);
    el('text', { x: xv(best) - 12, y: y + 26, 'text-anchor': 'end', 'font-size': 30, 'font-weight': 700, fill: HS }, s, `2^${fmt(best)}`);
    const tm = best + row.mem;
    el('text', { x: xv(row.paper) + 16, y: y + 50, 'font-size': 17, fill: tm < 128 ? '#8dd3ac' : DIM }, s,
      `time × memory 2^${fmt(tm)} ${tm < 128 ? '< 2^128 ✓' : '> 2^128'}` + (row.small ? `; small tables ≈2^${row.small}` : ''));
    const parts = credits(t, row.paper).reduce((m, [w, b]) => m.set(w, (m.get(w) || 0) + b), new Map());
    const list = [...parts.entries()].sort((a, b) => b[1] - a[1]).filter(([, b]) => b >= 0.05);
    let lx = xv(best) - 12;
    const line = el('text', { x: L, y: y + 100, 'font-size': 18 }, s);
    list.forEach(([w, b], k) => {
      el('tspan', { fill: col(w), 'font-weight': 700 }, line, name(w));
      el('tspan', { fill: DIM }, line, ` ${fmt(b)}${k < list.length - 1 ? '  ·  ' : ''}`);
    });
    el('text', { x: L, y: y + 126, 'font-size': 16, fill: DIM }, s, row.idea);
  });
  // bottleneck: tries per first block
  const by = 600;
  el('text', { x: L - 30, y: by + 10, 'text-anchor': 'end', 'font-size': 22, fill: DIM }, s, 'tries per');
  el('text', { x: L - 30, y: by + 38, 'text-anchor': 'end', 'font-size': 22, fill: DIM }, s, 'first block');
  const bw = v => v / 40 * 900;
  el('rect', { x: L, y: by - 18, width: bw(2), height: 34, fill: DIM }, s);
  el('text', { x: L + bw(2) + 12, y: by + 8, 'font-size': 22, fill: DIM }, s, '2^2  paper: the bottleneck');
  el('rect', { x: L, y: by + 34, width: bw(37.5), height: 34, fill: HS }, s);
  el('text', { x: L + bw(37.5) + 12, y: by + 60, 'font-size': 22, fill: HS }, s, '2^37.5  HashSmash');
  el('text', { x: L, y: by + 120, 'font-size': 17, fill: DIM }, s, 'coloured bars: bits each solver took off the record below the paper · passed AI review; human review pending');
}

// ---------------------------------------------------------------- 4c. BLAKE week
function drawBlake() {
  const W = 1600, H = 800, s = svg('f-blake', W, H), t = trackOf('BLAKE3', 2);
  const L = 120, R = 980, B0 = t2ms('2026-10-05T12:00'), B1 = t2ms('2026-10-11T12:00');
  const xt = ms => L + (ms - B0) / (B1 - B0) * (R - L), top = 60, bot = 640, yv = v => bot - v / 135 * (bot - top);
  const col = colorMap();
  for (const v of [0, 32, 64, 96, 128]) {
    el('line', { x1: L, x2: R, y1: yv(v), y2: yv(v), stroke: v === 128 ? DIM : FAINT, 'stroke-dasharray': v === 128 ? '5 6' : '' }, s);
    el('text', { x: L - 12, y: yv(v) + 6, 'text-anchor': 'end', 'font-size': 18, fill: DIM }, s, v);
  }
  el('text', { x: L - 60, y: top - 20, 'font-size': 16, fill: DIM }, s, METRIC_LABEL);
  for (let d = 6; d <= 11; d++) el('text', { x: xt(t2ms(`2026-10-${String(d).padStart(2, '0')}T00:00`)), y: bot + 30, 'text-anchor': 'middle', 'font-size': 18, fill: DIM }, s, `Oct ${d}`);
  el('text', { x: L + 10, y: yv(128) - 12, 'font-size': 18, fill: DIM }, s, 'BLAKE · BLAKE2 · BLAKE3, 2008–2026: no published collision attack at any round count');
  let px = null, py = 128;
  for (const [ts, v, who] of hsSteps(t)) {
    const x = xt(Math.max(B0, t2ms(ts)));
    if (px !== null) el('path', { d: `M${px},${yv(py)} H${x} V${yv(v)}`, fill: 'none', stroke: col(who), 'stroke-width': 3 }, s);
    el('circle', { cx: x, cy: yv(v), r: 5, fill: col(who) }, s);
    [px, py] = [x, v];
  }
  el('line', { x1: px, x2: R, y1: yv(py), y2: yv(py), stroke: HS, 'stroke-width': 3 }, s);
  el('text', { x: R + 10, y: yv(py) + 8, 'font-size': 30, 'font-weight': 700, fill: HS }, s, `2^${fmt(py)}`);
  el('text', { x: R + 10, y: yv(py) + 38, 'font-size': 18, fill: DIM }, s, '2 of 7 rounds');
  // contributions, largest first
  const parts = credits(t, 128).reduce((m, [w, b]) => m.set(w, (m.get(w) || 0) + b), new Map());
  const list = [...parts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 9);
  const bx = 1330, bmax = list[0][1], bw = 180;
  el('text', { x: bx, y: 90, 'font-size': 20, fill: DIM }, s, 'bits off the record');
  list.forEach(([w, b], i) => {
    const y = 120 + i * 50;
    el('rect', { x: bx, y, width: b / bmax * bw, height: 32, fill: col(w) }, s);
    el('text', { x: bx - 10, y: y + 23, 'text-anchor': 'end', 'font-size': 18 }, s, name(w));
    el('text', { x: bx + 8 + b / bmax * bw, y: y + 23, 'font-size': 18, fill: DIM }, s, fmt(b));
  });
  el('text', { x: L, y: 730, 'font-size': 18, fill: DIM }, s, `${METRIC_LABEL} · ${py < 128 ? 'below generic 2^128 ✓' : ''} · passed AI review; human review pending`);
}

// ---------------------------------------------------------------- 4d. Poseidon
function drawPoseidon() {
  const W = 1600, H = 760, s = svg('f-poseidon', W, H), P = LIT.poseidon;
  const L = 160, R = 900, top = 100, bot = 560, yv = v => bot - v / 140 * (bot - top);
  el('rect', { x: L - 60, y: top - 50, width: R - L + 120, height: bot - top + 110, rx: 16, fill: '#16171b' }, s);
  for (const v of [0, 32, 64, 96, 128]) {
    el('line', { x1: L, x2: R, y1: yv(v), y2: yv(v), stroke: v === 128 ? DIM : FAINT, 'stroke-dasharray': v === 128 ? '5 6' : '' }, s);
    el('text', { x: L - 12, y: yv(v) + 6, 'text-anchor': 'end', 'font-size': 18, fill: DIM }, s, v);
  }
  el('text', { x: (L + R) / 2, y: yv(64), 'text-anchor': 'middle', 'font-size': 140, 'font-weight': 700, fill: FAINT }, s, '?');
  el('text', { x: (L + R) / 2, y: bot + 40, 'text-anchor': 'middle', 'font-size': 20, fill: DIM }, s, 'rounds attacked →');
  const x = 1000;
  el('text', { x, y: 170, 'font-size': 52, 'font-weight': 700 }, s, 'Poseidon');
  el('text', { x, y: 230, 'font-size': 26, fill: HS }, s, 'coming soon');
  ['Zcash Orchard instance', 'Pallas field · width 3 · x^5', 'sponge mode', `first track ${P.firstRounds}`].forEach((t, i) =>
    el('text', { x, y: 320 + i * 44, 'font-size': 24, fill: i ? DIM : INK }, s, t));
  el('text', { x, y: 530, 'font-size': 20, fill: DIM }, s, `proposed by ${P.proposer} (Discussion #${P.discussion})`);
  el('text', { x, y: 560, 'font-size': 20, fill: DIM }, s, 'the hash securing real savings in zero-knowledge');
}

// ---------------------------------------------------------------- 5. negative results
function drawNegativeData() {
  const W = 1600, H = 780, s = svg('f-negative-data', W, H);
  const past = (hash, r) => { const st = litSteps(hash, r); return Math.max(0, st[st.length - 1][1] - hsBest(trackOf(hash, r))); };
  const rows = [
    { label: 'SHA-256 · 37', t: trackOf('SHA-256', 37), real: past('SHA-256', 37) },
    { label: 'SHA-256 · 38', t: trackOf('SHA-256', 38), real: past('SHA-256', 38) },
    { label: 'BLAKE3 · 2', t: trackOf('BLAKE3', 2), real: past('BLAKE3', 2) },
    { label: 'SHA3-256 · 6', t: trackOf('SHA3-256', 6), real: past('SHA3-256', 6) },
  ];
  // left: published record = what is visible
  
  const L = 420, aw = 420, gx = 1000, gw = 420, top = 180, rh = 120;
  el('text', { x: L, y: top - 30, 'font-size': 22, fill: DIM }, s, 'attempts');
  el('text', { x: gx, y: top - 30, 'font-size': 22, fill: DIM }, s, 'bits past the literature');
  rows.forEach((r, i) => {
    const y = top + i * rh, n = r.t.n, ok = r.t.points.length;
    el('text', { x: L - 30, y: y + 30, 'text-anchor': 'end', 'font-size': 28, 'font-weight': 700, fill: COLOR[r.t.hash] }, s, r.label);
    el('rect', { x: L, y, width: n / 170 * aw, height: 40, fill: DIM, opacity: 0.45 }, s);
    el('rect', { x: L, y, width: ok / 170 * aw, height: 40, fill: DIM }, s);
    el('text', { x: L + n / 170 * aw + 10, y: y + 28, 'font-size': 20, fill: DIM }, s, `${n}`);
    if (r.real > 0) {
      el('rect', { x: gx, y, width: r.real / 70 * gw, height: 40, fill: HS }, s);
      el('text', { x: gx + r.real / 70 * gw + 10, y: y + 28, 'font-size': 22, fill: HS, 'font-weight': 700 }, s, fmt(r.real));
    } else {
      el('text', { x: gx, y: y + 30, 'font-size': 24, fill: INK, 'font-weight': 700 }, s, '0');
    }
  });
  el('text', { x: gx, y: top + 4 * rh + 25, 'font-size': 20, fill: DIM }, s, '0 = a measured negative result');
  el('rect', { x: L, y: top + 4 * rh + 10, width: 24, height: 18, fill: DIM }, s);
  el('text', { x: L + 32, y: top + 4 * rh + 25, 'font-size': 18, fill: DIM }, s, 'passed AI review');
  el('rect', { x: L + 230, y: top + 4 * rh + 10, width: 24, height: 18, fill: DIM, opacity: 0.45 }, s);
  el('text', { x: L + 262, y: top + 4 * rh + 25, 'font-size': 18, fill: DIM }, s, 'failed or rejected');
}

// ---------------------------------------------------------------- end
function drawEnd() {
  const s = svg('f-end', 1600, 860);
  el('image', { href: 'HashSmash.png', x: 540, y: 20, width: 520, height: 520 }, s);
  el('text', { x: 800, y: 640, 'text-anchor': 'middle', 'font-size': 72, 'font-weight': 700 }, s, 'Questions');
  ['https://HashSma.sh', 'https://x.com/shieldedlabs', 'https://x.com/zooko'].forEach((t, i) =>
    el('text', { x: 800, y: 710 + i * 44, 'text-anchor': 'middle', 'font-size': 26, fill: DIM }, s, t));
}

// ---------------------------------------------------------------- main 2: hashes + legs
function drawHashes2() {
  const s = svg('f-hashes2', 1600, 800), cx = 560, cy = 400, GREEN = '#8dd3ac';
  const users = ['RSA', 'ECDSA', 'Ed25519', 'ML-DSA', 'TLS', 'git', 'Bitcoin'];
  el('text', { x: 60, y: 70, 'font-size': 24, fill: DIM }, s, 'necessary');
  users.forEach((u, i) => {
    const x = 120 + i * 150;
    chip(s, x, 130, u, DIM, { w: 128, size: 20 });
    el('line', { x1: x, y1: 156, x2: cx + (x - cx) * 0.25, y2: cy - 120, stroke: FAINT, 'stroke-width': 2 }, s);
  });
  el('circle', { cx, cy, r: 110, fill: '#1d1e23', stroke: INK, 'stroke-width': 3 }, s);
  el('text', { x: cx, y: cy - 6, 'text-anchor': 'middle', 'font-size': 32, 'font-weight': 700 }, s, 'secure');
  el('text', { x: cx, y: cy + 32, 'text-anchor': 'middle', 'font-size': 32, 'font-weight': 700 }, s, 'hash');
  el('text', { x: 60, y: 600, 'font-size': 24, fill: GREEN }, s, 'sufficient');
  const built = [['signatures', 'SLH-DSA'], ['MACs', 'HMAC'], ['KDFs', 'HKDF'], ['random bits', 'DRBG'], ['encryption', ''], ['commitments', 'Merkle'], ['proofs', 'STARKs']];
  built.forEach(([a, b], i) => {
    const x = 120 + i * 150, y = 680;
    el('line', { x1: cx + (x - cx) * 0.3, y1: cy + 105, x2: x, y2: y - 36, stroke: '#2f5c45', 'stroke-width': 2 }, s);
    el('rect', { x: x - 68, y: y - 36, width: 136, height: 78, rx: 12, fill: '#16171b', stroke: GREEN, 'stroke-width': 2 }, s);
    el('text', { x, y: y - 4, 'text-anchor': 'middle', 'font-size': 18, fill: GREEN, 'font-weight': 700 }, s, a);
    el('text', { x, y: y + 24, 'text-anchor': 'middle', 'font-size': 16, fill: DIM }, s, b);
  });
  el('text', { x: cx + 130, y: cy + 8, 'font-size': 18, fill: DIM }, s, '✗ public-key encryption');
  // right: one leg or two
  const rx = 1310, top = 330, floor = 530;
  el('text', { x: rx, y: 250, 'text-anchor': 'middle', 'font-size': 24, fill: DIM }, s, 'strictly safer');
  const leg = (x, label, col) => { el('rect', { x: x - 11, y: top + 16, width: 22, height: floor - top - 16, fill: col }, s);
    el('text', { x, y: floor + 30, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: col }, s, label); };
  el('line', { x1: rx - 240, x2: rx + 240, y1: floor, y2: floor, stroke: FAINT, 'stroke-width': 3 }, s);
  el('rect', { x: rx - 230, y: top, width: 180, height: 16, rx: 4, fill: INK }, s); leg(rx - 140, 'hash', GREEN);
  el('rect', { x: rx - 190, y: floor - 10, width: 100, height: 10, rx: 3, fill: GREEN }, s);
  el('rect', { x: rx + 30, y: top, width: 200, height: 16, rx: 4, fill: INK }, s); leg(rx + 60, 'hash', GREEN); leg(rx + 200, 'lattice', HS);
  
}

// ---------------------------------------------------------------- main 4: one week
function drawWeek2() {
  const W = 1600, H = 800, s = svg('f-week2', W, H), col = colorMap();
  // left: BLAKE record line
  const t = trackOf('BLAKE3', 2), L = 90, R = 640, B0 = t2ms('2026-10-05T12:00'), B1 = t2ms('2026-10-11T12:00');
  const xt = ms => L + (ms - B0) / (B1 - B0) * (R - L), top = 110, bot = 560, yv = v => bot - v / 135 * (bot - top);
  el('text', { x: L, y: 60, 'font-size': 26, 'font-weight': 700, fill: COLOR['BLAKE3'] }, s, 'BLAKE3, 2 of 7 rounds');
  el('text', { x: L, y: 90, 'font-size': 18, fill: DIM }, s, 'first collision attack on any BLAKE');
  for (const v of [0, 32, 64, 96, 128]) {
    el('line', { x1: L, x2: R, y1: yv(v), y2: yv(v), stroke: v === 128 ? DIM : FAINT, 'stroke-dasharray': v === 128 ? '5 6' : '' }, s);
    el('text', { x: L - 10, y: yv(v) + 6, 'text-anchor': 'end', 'font-size': 16, fill: DIM }, s, v);
  }
  for (const d of [6, 8, 10]) el('text', { x: xt(t2ms(`2026-10-${String(d).padStart(2, '0')}T00:00`)), y: bot + 26, 'text-anchor': 'middle', 'font-size': 16, fill: DIM }, s, `Oct ${d}`);
  let px = L, py = 128;
  for (const [ts, v, who] of hsSteps(t)) {
    if (v >= 128) continue;
    const x = xt(Math.max(B0, t2ms(ts)));
    el('path', { d: `M${px},${yv(py)} H${x} V${yv(v)}`, fill: 'none', stroke: col(who), 'stroke-width': 3 }, s);
    el('circle', { cx: x, cy: yv(v), r: 4.5, fill: col(who) }, s);
    [px, py] = [x, v];
  }
  el('line', { x1: px, x2: R, y1: yv(py), y2: yv(py), stroke: HS, 'stroke-width': 3 }, s);
  el('text', { x: R + 10, y: yv(py) + 9, 'font-size': 30, 'font-weight': 700, fill: HS }, s, `2^${fmt(py)}`);
  const parts = credits(t, 128).reduce((m, [w, b]) => m.set(w, (m.get(w) || 0) + b), new Map());
  const list = [...parts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const line = el('text', { x: L, y: bot + 70, 'font-size': 18 }, s);
  list.forEach(([w, b], k) => { el('tspan', { fill: col(w), 'font-weight': 700 }, line, name(w)); el('tspan', { fill: DIM }, line, ` ${fmt(b)}${k < list.length - 1 ? ' · ' : ''}`); });
  el('text', { x: L, y: bot + 98, 'font-size': 16, fill: DIM }, s, 'bits off the record');
  // right: SHA-256 under both metrics
  const X0 = 900, X1 = 1400, xv = v => X0 + v / 130 * (X1 - X0);
  el('text', { x: X0, y: 60, 'font-size': 26, 'font-weight': 700, fill: COLOR['SHA-256'] }, s, 'SHA-256, 37 and 38 of 64 rounds');
  
  for (const v of [0, 64, 128]) {
    el('line', { x1: xv(v), x2: xv(v), y1: 120, y2: 520, stroke: v === 128 ? DIM : FAINT, 'stroke-dasharray': v === 128 ? '5 6' : '' }, s);
    el('text', { x: xv(v), y: 112, 'text-anchor': 'middle', 'font-size': 16, fill: DIM }, s, v === 128 ? '128 generic' : v);
  }
  const rows = [{ r: 37, paper: 79.1 }, { r: 38, paper: 104.3 }];
  rows.forEach((row, i) => {
    const tr = trackOf('SHA-256', row.r), y0 = 160 + i * 190;
    el('text', { x: X0 - 20, y: y0 + 40, 'text-anchor': 'end', 'font-size': 24, 'font-weight': 700, fill: COLOR['SHA-256'] }, s, `${row.r}`);
    [['time', tr.best, tr.steps], ['time × memory', tr.bestTM, tr.stepsTM]].forEach(([lab, hs, steps], k) => {
      const y = y0 + k * 60, win = hs < row.paper, c = win ? HS : DIM;
      el('text', { x: X0 + 4, y: y - 10, 'font-size': 15, fill: DIM }, s, lab);
      el('line', { x1: xv(row.paper), x2: xv(hs), y1: y + 12, y2: y + 12, stroke: c, 'stroke-width': 4, 'stroke-dasharray': win ? '' : '6 5' }, s);
      el('circle', { cx: xv(row.paper), cy: y + 12, r: 7, fill: DIM }, s);
      el('circle', { cx: xv(hs), cy: y + 12, r: 7, fill: c }, s);
      el('text', { x: xv(Math.min(hs, row.paper)) - 10, y: y + 18, 'text-anchor': 'end', 'font-size': 17, fill: c }, s, `2^${fmt(hs)}`);
      el('text', { x: xv(Math.max(hs, row.paper)) + 12, y: y + 18, 'font-size': 17, fill: DIM }, s, `paper 2^${row.paper}`);
    });
    const who = [...credits(tr, row.paper, tr.steps).reduce((m, [w, b]) => m.set(w, (m.get(w) || 0) + b), new Map()).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const ln = el('text', { x: X0, y: y0 + 150, 'font-size': 16 }, s);
    
    who.forEach(([w, b], k) => { el('tspan', { fill: col(w), 'font-weight': 700 }, ln, name(w)); el('tspan', { fill: DIM }, ln, ` ${fmt(b)}${k < who.length - 1 ? ' · ' : ''}`); });
  });
  el('text', { x: X0, y: 580, 'font-size': 16, fill: DIM }, s, 'idea: qkniep, 0xshikhar, itseasypop · tables of 2^52 and 2^80 bytes');
  el('text', { x: X0, y: 606, 'font-size': 16, fill: HS }, s, '38 rounds: 2^87.18 time, 2^28 bytes (score 95.28, HashSmash best)');
  // Poseidon badge
  el('rect', { x: 900, y: 640, width: 620, height: 70, rx: 14, fill: '#16171b', stroke: FAINT }, s);
  el('text', { x: 925, y: 684, 'font-size': 24, 'font-weight': 700 }, s, 'next: Poseidon');
  el('text', { x: 1130, y: 684, 'font-size': 18, fill: DIM }, s, 'Zcash Orchard · Ankita Singh');
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
    if (hash === 'SHA-256') {  // memory-light 38-step attack, estimated, not yet reviewed
      el('circle', { cx: xHS, cy: yv(r), r: 7, fill: HS }, s);
      el('text', { x: xHS - 12, y: yv(r) - 12, 'text-anchor': 'end', 'font-size': 18, fill: HS }, s, '38: 2^104 → ≈2^97, little memory');
    }
    if (hash === 'BLAKE3') {
      el('text', { x: xHS - 12, y: yv(finalR) - 12, 'text-anchor': 'end', 'font-size': 18, fill: HS }, s, 'Cyberaxe (Jbenisek) · 2^62.7 time · 2^106.7 time × memory');
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
const draw = { 's-title': drawTitle, 's-activity': drawActivity, 's-rounds': drawRounds, 's-hashes2': drawHashes2, 's-week2': drawWeek2, 's-hashes': drawHashes, 's-hopwood': drawHopwood, 's-sigtable': drawSigTable, 's-history': drawHistory,
  's-timeline': drawTimeline, 's-sha256': drawShaCredits, 's-blake': drawBlake, 's-poseidon': drawPoseidon, 's-negative': drawNegative, 's-negative-data': drawNegativeData, 's-end': drawEnd,
  's-margin': drawMargin, 's-before-after': drawBeforeAfter, 's-anatomy': drawAnatomy,
  's-week': drawWeek, 's-who': drawWho, 's-sources': drawSources };
let cur = Math.max(0, Math.min(sections.length - 1, parseInt(location.hash.slice(1) || '1', 10) - 1));
function show(i) {
  cur = Math.max(0, Math.min(sections.length - 1, i));
  sections.forEach((s, j) => s.classList.toggle('on', j === cur));
  draw[sections[cur].id]();
  document.getElementById('nav').textContent = `${cur + 1} / ${sections.length}` + (MODE === 'all' ? ' · all attacks' : '') + (METRIC === 'time' ? ' · time only' : '');
  history.replaceState(null, '', location.search + '#' + (cur + 1));
}
// ?print=main or ?print=backup: lay out every slide of that set, one per page, for PDF export.
const PRINT = new URLSearchParams(location.search).get('print');
if (PRINT) {
  const css = document.createElement('style');
  css.textContent = `@page { size: 1600px 900px; margin: 0 }
    html, body { height: auto } .nav { display: none }
    section.on { position: relative; inset: auto; width: 1600px; height: 900px; page-break-after: always; break-after: page }`;
  document.head.appendChild(css);
  sections.forEach(sec => { const keep = (PRINT === 'backup') === sec.classList.contains('backup');
    sec.classList.toggle('on', keep); if (keep) draw[sec.id](); });
}
document.addEventListener('keydown', e => {
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) show(cur + 1);
  if (['ArrowLeft', 'PageUp'].includes(e.key)) show(cur - 1);
});
document.addEventListener('click', e => show(cur + (e.clientX > innerWidth / 3 ? 1 : -1)));
window.addEventListener('hashchange', () => { const i = parseInt(location.hash.slice(1), 10) - 1; if (i !== cur) show(i); });
if (!PRINT) show(cur);
