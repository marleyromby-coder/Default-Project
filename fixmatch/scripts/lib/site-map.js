/**
 * The map on the website's front page: Denmark with the app's price pins and clusters, like the
 * map tab of the app. It shows the demo businesses and says so. The land comes from
 * website/map-land.json (npm run website:map), so the page loads nothing from other servers.
 * Pan with the mouse, zoom with the buttons or by choosing a cluster, filter by trade.
 */
const fs = require('node:fs');
const path = require('node:path');

const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Map units per degree of latitude. Longitudes are squeezed by cos(56°), as on a map of Denmark. */
const UNITS = 100;
const SQUEEZE = Math.cos((56 * Math.PI) / 180);
/** What the map shows when it opens: Denmark without Bornholm, where no demo business is. */
const DENMARK = { west: 7.9, east: 12.95, south: 54.5, north: 57.8 };

const TEXT = {
  da: {
    kicker: 'Kortet fra appen',
    title: 'Se, hvem der er tæt på – med prisen på',
    lead: 'I appen ligger virksomhederne på et kort med deres timepris. Prøv det her: vælg et fag, og tryk på en by for at zoome ind.',
    all: 'Alle fag',
    trades: 'Vis fag på kortet',
    map: 'Kort over Danmark med virksomheder og timepriser',
    zoomIn: 'Zoom ind',
    zoomOut: 'Zoom ud',
    reset: 'Hele Danmark',
    cluster: '{count} virksomheder. Zoom ind',
    pin: '{name}, {trade}, fra {price} i timen',
    from: 'fra',
    perHour: 'pr. time',
    verified: 'Verificeret',
    demo: 'Demo',
    more: '{count} virksomheder ligger her. Den billigste vises.',
    hint: 'Vælg en virksomhed på kortet for at se den.',
    note: 'Kortet viser fiktive eksempler fra testversionen. I appen ser du de rigtige virksomheder og hele vejnettet. Kystlinje: Natural Earth.',
    noscript: 'Slå JavaScript til for at se virksomhederne på kortet.',
  },
  en: {
    kicker: 'The map from the app',
    title: 'See who is nearby – with the price on',
    lead: 'In the app the businesses are on a map with their hourly rate. Try it here: choose a trade, and tap a town to zoom in.',
    all: 'All trades',
    trades: 'Show trades on the map',
    map: 'Map of Denmark with businesses and hourly rates',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    reset: 'All of Denmark',
    cluster: '{count} businesses. Zoom in',
    pin: '{name}, {trade}, from {price} an hour',
    from: 'from',
    perHour: 'per hour',
    verified: 'Verified',
    demo: 'Demo',
    more: '{count} businesses are here. The cheapest is shown.',
    hint: 'Choose a business on the map to see it.',
    note: 'The map shows fictional examples from the test version. In the app you see the real businesses and every street. Coastline: Natural Earth.',
    noscript: 'Turn on JavaScript to see the businesses on the map.',
  },
};

const project = (lon, lat, bounds) => [
  Math.round((lon - bounds.west) * SQUEEZE * UNITS * 10) / 10,
  Math.round((bounds.north - lat) * UNITS * 10) / 10,
];

/**
 * The map section and its script. `trades` is readJobs(root) and `art` tradeArt(root), so the
 * chips and pins use the app's names, tiles and colours.
 */
function siteMap(lang, { root, trades, art }) {
  const t = TEXT[lang];
  const land = JSON.parse(fs.readFileSync(path.join(root, 'website/map-land.json'), 'utf8'));
  const { bounds } = land;
  const d = land.rings
    .map((ring) => `M${ring.map(([lon, lat]) => project(lon, lat, bounds).join(',')).join('L')}Z`)
    .join('');
  const world = project(bounds.east, bounds.south, bounds);
  const [west, north] = project(DENMARK.west, DENMARK.north, bounds);
  const [east, south] = project(DENMARK.east, DENMARK.south, bounds);

  // Demo businesses only: real ones have agreed to be shown in the app, not on a public page.
  const tradeIds = Object.keys(trades);
  const businesses = JSON.parse(fs.readFileSync(path.join(root, 'src/data/demo-businesses.json'), 'utf8'))
    .filter((b) => (b.country ?? 'DK') === 'DK' && tradeIds.includes(b.categories[0]))
    .map((b) => {
      const [x, y] = project(b.coords.lon, b.coords.lat, bounds);
      return [b.name, tradeIds.indexOf(b.categories[0]), x, y, b.pricing.hourlyMin, b.address.city, b.verified ? 1 : 0];
    });

  const config = {
    home: { x: (west + east) / 2, y: (north + south) / 2, w: east - west, h: south - north },
    world: { w: world[0], h: world[1] },
    businesses,
    trades: tradeIds.map((id) => ({
      name: trades[id].name[lang],
      color: art.colors[id].tile,
      tile: art.tile(id, { size: 22, radius: 0.3 }),
    })),
    price: lang === 'da' ? '{n} kr.' : 'DKK {n}',
    thousands: lang === 'da' ? '.' : ',',
    text: {
      cluster: t.cluster,
      pin: t.pin,
      from: t.from,
      perHour: t.perHour,
      verified: t.verified,
      demo: t.demo,
      more: t.more,
    },
  };

  const html = `<section class="mapsec" id="${lang === 'da' ? 'kort' : 'map'}">
<div class="section-head">
<p class="eyebrow">${escape(t.kicker)}</p>
<h2>${escape(t.title)}</h2>
<p class="lead">${escape(t.lead)}</p>
</div>
<div class="map-chips" role="group" aria-label="${escape(t.trades)}" data-map-chips>
<button type="button" class="map-chip" aria-pressed="true" data-trade="-1">${escape(t.all)}</button>
${tradeIds
  .map(
    (id, index) =>
      `<button type="button" class="map-chip" aria-pressed="false" data-trade="${index}">${art.tile(id, { size: 24, radius: 0.3 })}${escape(trades[id].name[lang])}</button>`,
  )
  .join('\n')}
</div>
<div class="map" data-map>
<svg class="map-land" viewBox="${west} ${north} ${east - west} ${south - north}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escape(t.map)}"><path d="${d}"/></svg>
<div class="map-pins" data-map-pins></div>
<div class="map-tools">
<button type="button" data-map-zoom="in" aria-label="${escape(t.zoomIn)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
<button type="button" data-map-zoom="out" aria-label="${escape(t.zoomOut)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button>
</div>
<button type="button" class="map-reset" data-map-reset hidden>${escape(t.reset)}</button>
<div class="map-card" data-map-card aria-live="polite"><p class="map-hint">${escape(t.hint)}</p></div>
<noscript><p class="map-noscript">${escape(t.noscript)}</p></noscript>
</div>
<p class="note">${escape(t.note)}</p>
</section>`;

  const script = `<script>
(() => {
  const config = ${JSON.stringify(config).replace(/</g, '\\u003c')};
  const map = document.querySelector('[data-map]');
  if (!map) return;
  const svg = map.querySelector('svg');
  const layer = map.querySelector('[data-map-pins]');
  const card = map.querySelector('[data-map-card]');
  const reset = map.querySelector('[data-map-reset]');
  const chips = [...document.querySelectorAll('[data-map-chips] button')];
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const price = (n) => config.price.replace('{n}', String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, config.thousands));
  const fill = (text, values) => text.replace(/\\{(\\w+)\\}/g, (_, key) => values[key]);
  let width = 0, height = 0, trade = -1, selected = null, frame = 0;
  // The view: the map point in the middle, and pixels per map unit.
  let view = { x: config.home.x, y: config.home.y, s: 1 };
  const fit = () => Math.min(width / config.home.w, height / config.home.h);
  // No closer than about 70 km across: the coastline is too coarse for street level.
  const limits = () => ({ min: fit() * 0.85, max: width / 40 });
  const clampView = (v) => {
    const { min, max } = limits();
    const s = Math.min(max, Math.max(min, v.s));
    return {
      s,
      x: Math.min(config.world.w - 20, Math.max(20, v.x)),
      y: Math.min(config.world.h - 20, Math.max(20, v.y)),
    };
  };
  const shown = () => config.businesses.filter((b) => trade < 0 || b[1] === trade);
  // Businesses that would overlap as pins share a bubble, as in the app. Cheapest first, so the
  // price that stays visible when pins merge is the lowest one.
  const clusters = (v) => {
    const out = [];
    for (const b of shown().slice().sort((a, z) => a[4] - z[4])) {
      const near = out.find((c) => Math.abs(c.x - b[2]) * v.s < 96 && Math.abs(c.y - b[3]) * v.s < 46);
      if (near) near.items.push(b);
      else out.push({ items: [b], x: b[2], y: b[3] });
    }
    for (const c of out) {
      c.x = c.items.reduce((sum, b) => sum + b[2], 0) / c.items.length;
      c.y = c.items.reduce((sum, b) => sum + b[3], 0) / c.items.length;
    }
    return out;
  };
  const place = (v) => {
    svg.setAttribute('viewBox', [v.x - width / (2 * v.s), v.y - height / (2 * v.s), width / v.s, height / v.s].join(' '));
    for (const pin of layer.children) {
      pin.style.transform = 'translate(' + ((pin._x - v.x) * v.s + width / 2).toFixed(1) + 'px,' + ((pin._y - v.y) * v.s + height / 2).toFixed(1) + 'px) translate(-50%,-50%)';
    }
  };
  const hint = card.innerHTML;
  const clear = () => {
    selected = null;
    card.innerHTML = hint;
    card.classList.remove('on');
  };
  const show = (items) => {
    const b = items.slice().sort((a, z) => a[4] - z[4])[0];
    selected = b;
    const t = config.trades[b[1]];
    const initials = b[0].split(/[\\s&]+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
    card.textContent = '';
    const mark = document.createElement('span');
    mark.className = 'map-mark';
    mark.style.background = t.color;
    mark.textContent = initials;
    const body = document.createElement('div');
    body.className = 'map-body';
    const name = document.createElement('strong');
    name.textContent = b[0];
    const where = document.createElement('span');
    where.textContent = t.name + ' · ' + b[5];
    const badges = document.createElement('span');
    badges.className = 'map-badges';
    if (b[6]) {
      const verified = document.createElement('em');
      verified.className = 'verified';
      verified.textContent = config.text.verified;
      badges.append(verified);
    }
    const demo = document.createElement('em');
    demo.textContent = config.text.demo;
    badges.append(demo);
    body.append(name, where, badges);
    const cost = document.createElement('div');
    cost.className = 'map-price';
    const from = document.createElement('small');
    from.textContent = config.text.from;
    const amount = document.createElement('b');
    amount.textContent = price(b[4]);
    const per = document.createElement('small');
    per.textContent = config.text.perHour;
    cost.append(from, amount, per);
    card.append(mark, body, cost);
    if (items.length > 1) {
      const more = document.createElement('p');
      more.className = 'map-more';
      more.textContent = fill(config.text.more, { count: items.length });
      card.append(more);
    }
    card.classList.add('on');
    for (const pin of layer.children) pin.classList.toggle('on', pin._items && pin._items.includes(b));
  };
  const draw = (v) => {
    layer.textContent = '';
    for (const cluster of clusters(v)) {
      const pin = document.createElement('button');
      pin.type = 'button';
      pin._x = cluster.x;
      pin._y = cluster.y;
      pin._items = cluster.items;
      if (cluster.items.length === 1) {
        const b = cluster.items[0];
        pin.className = 'map-pin' + (b === selected ? ' on' : '');
        // The trade's tile is markup made by the website builder from the app's own drawings, never from a visitor.
        pin.innerHTML = config.trades[b[1]].tile;
        pin.append(price(b[4]));
        pin.setAttribute('aria-label', fill(config.text.pin, { name: b[0], trade: config.trades[b[1]].name, price: price(b[4]) }));
        pin.addEventListener('click', () => show([b]));
      } else {
        const count = cluster.items.length;
        pin.className = 'map-cluster' + (count >= 20 ? ' big' : count >= 8 ? ' mid' : '');
        pin.textContent = String(count);
        pin.setAttribute('aria-label', fill(config.text.cluster, { count }));
        pin.addEventListener('click', () => {
          const xs = cluster.items.map((b) => b[2]);
          const ys = cluster.items.map((b) => b[3]);
          const w = Math.max(8, (Math.max(...xs) - Math.min(...xs)) * 1.9);
          const h = Math.max(8, (Math.max(...ys) - Math.min(...ys)) * 1.9);
          const next = clampView({ x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2, s: Math.min(width / w, height / h) });
          // Already as close as the map goes: show the cheapest of them instead.
          if (next.s <= view.s * 1.05) show(cluster.items);
          else go(next);
        });
      }
      layer.append(pin);
    }
    place(v);
  };
  // Moves to a new view; the pins of the new view glide into place.
  const go = (target, instant) => {
    target = clampView(target);
    cancelAnimationFrame(frame);
    const from = view;
    reset.hidden = Math.abs(target.s - fit()) < 0.01 * fit() && Math.abs(target.x - config.home.x) < 1 && Math.abs(target.y - config.home.y) < 1;
    draw(target);
    if (instant || calm.matches) {
      view = target;
      place(view);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - start) / 380);
      const e = 1 - Math.pow(1 - k, 3);
      view = { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, s: from.s * Math.pow(target.s / from.s, e) };
      place(view);
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  };
  const resize = () => {
    const first = width === 0;
    width = map.clientWidth;
    height = map.clientHeight;
    if (!width) return;
    go(first ? { x: config.home.x, y: config.home.y, s: fit() } : view, true);
  };
  new ResizeObserver(resize).observe(map);
  map.querySelector('[data-map-zoom="in"]').addEventListener('click', () => go({ ...view, s: view.s * 1.8 }));
  map.querySelector('[data-map-zoom="out"]').addEventListener('click', () => go({ ...view, s: view.s / 1.8 }));
  reset.addEventListener('click', () => go({ x: config.home.x, y: config.home.y, s: fit() }));
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      trade = Number(chip.dataset.trade);
      for (const other of chips) other.setAttribute('aria-pressed', String(other === chip));
      if (selected && trade >= 0 && selected[1] !== trade) clear();
      draw(view);
    });
  }
  // Drag with the mouse to move the map. Touch scrolls the page as usual.
  let drag = null;
  map.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.target.closest('button')) return;
    drag = { x: event.clientX, y: event.clientY, view, moved: false };
    map.setPointerCapture(event.pointerId);
  });
  map.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    drag.moved = true;
    map.classList.add('dragging');
    cancelAnimationFrame(frame);
    view = clampView({ ...drag.view, x: drag.view.x - dx / view.s, y: drag.view.y - dy / view.s });
    reset.hidden = false;
    place(view);
  });
  const drop = () => {
    if (drag && drag.moved) draw(view);
    drag = null;
    map.classList.remove('dragging');
  };
  map.addEventListener('pointerup', drop);
  map.addEventListener('pointercancel', drop);
})();
</script>`;

  return { html, script };
}

const MAP_STYLE = `
/* The map from the app: Denmark with price pins and clusters. */
.map-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin-bottom: 18px; }
.map-chip { display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 0 13px 0 9px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--text); font: inherit; font-weight: 600; font-size: 15px; white-space: nowrap; cursor: pointer; }
.map-chip:first-child { padding-left: 14px; }
.map-chip .trade-tile { width: 24px; height: 24px; }
.map-chip[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: var(--on-ink); }
.map { position: relative; aspect-ratio: 16 / 9; min-height: 420px; overflow: hidden; border-radius: 28px; border: 1px solid var(--border); background: #D6E4E8; box-shadow: var(--shadow-raised); cursor: grab; user-select: none; -webkit-user-select: none; }
.map.dragging { cursor: grabbing; }
.map-land { position: absolute; inset: 0; width: 100%; height: 100%; }
.map-land path { fill: #F6F9F7; stroke: #C5D2CC; stroke-width: 1; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
.map-pins { position: absolute; inset: 0; }
.map-pins button { position: absolute; left: 0; top: 0; border: 0; cursor: pointer; font-family: var(--display); will-change: transform; }
.map-pin { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px 0 5px; border-radius: 999px; background: #FFFFFF; color: #0B1A15; box-shadow: 0 0 0 1px rgba(11, 26, 21, 0.1), 0 4px 10px rgba(11, 26, 21, 0.22); font-weight: 700; font-size: 15px; letter-spacing: -0.01em; white-space: nowrap; }
.map-pin .trade-tile { width: 24px; height: 24px; border-radius: 50%; }
.map-pin.on { background: #0B1A15; color: #FFFFFF; z-index: 3; height: 38px; font-size: 16px; box-shadow: 0 0 0 2px #FFFFFF, 0 6px 14px rgba(11, 26, 21, 0.35); }
.map-cluster { width: 42px; height: 42px; border-radius: 50%; background: #0B1A15; color: #FFFFFF; box-shadow: 0 0 0 2px #FFFFFF, 0 4px 10px rgba(11, 26, 21, 0.3); font-weight: 700; font-size: 17px; z-index: 2; }
.map-cluster.mid { width: 48px; height: 48px; font-size: 18px; }
.map-cluster.big { width: 56px; height: 56px; font-size: 20px; }
.map-pins button:hover { filter: brightness(1.08); }
.map-pins button:focus-visible, .map-tools button:focus-visible, .map-reset:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.map-tools { position: absolute; right: 14px; bottom: 14px; display: grid; gap: 8px; }
.map-tools button { width: 46px; height: 46px; border: 0; border-radius: 50%; background: #FFFFFF; color: #0B1A15; box-shadow: 0 2px 8px rgba(11, 26, 21, 0.25); cursor: pointer; }
.map-tools svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; vertical-align: middle; }
.map-reset { position: absolute; right: 14px; top: 14px; min-height: 40px; padding: 0 16px; border: 0; border-radius: 999px; background: #FFFFFF; color: #0B1A15; box-shadow: 0 2px 8px rgba(11, 26, 21, 0.25); font: inherit; font-weight: 600; font-size: 15px; cursor: pointer; }
.map-card { position: absolute; left: 14px; bottom: 14px; width: min(380px, calc(100% - 88px)); display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 4px 12px; padding: 14px 16px; border-radius: 20px; background: var(--surface); color: var(--text); box-shadow: 0 8px 24px rgba(11, 26, 21, 0.28); cursor: default; }
.map-card:not(.on) { display: block; width: auto; padding: 10px 16px; border-radius: 999px; }
.map-hint { margin: 0; color: var(--muted); font-size: 14px; }
.map-mark { display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 14px; color: #FFFFFF; font-family: var(--display); font-weight: 800; font-size: 17px; }
.map-body { display: grid; gap: 1px; min-width: 0; }
.map-body strong { font-family: var(--display); font-weight: 800; font-size: 18px; line-height: 1.2; letter-spacing: -0.02em; }
.map-body span { color: var(--muted); font-size: 14px; line-height: 1.35; }
.map-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px; }
.map-badges em { font-style: normal; font-weight: 700; font-size: 12px; line-height: 1; padding: 5px 8px; border-radius: 999px; background: var(--fill); color: var(--muted); }
.map-badges em.verified { background: var(--brand-soft); color: var(--brand-text); }
.map-price { display: grid; justify-items: end; line-height: 1.15; }
.map-price small { color: var(--muted); font-size: 12px; }
.map-price b { font-family: var(--display); font-weight: 800; font-size: 22px; letter-spacing: -0.035em; white-space: nowrap; }
.map-more { grid-column: 1 / -1; margin: 6px 0 0 !important; color: var(--muted); font-size: 13px; }
.map-noscript { position: absolute; left: 14px; top: 14px; margin: 0; padding: 10px 16px; border-radius: 999px; background: var(--surface); font-size: 14px; }
@media (prefers-color-scheme: dark) {
  .map { background: #0F1A1C; }
  .map-land path { fill: #1A2622; stroke: #2E423A; }
}
@media (max-width: 700px) {
  .map-chips { flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto; margin: 0 -12px 14px; padding: 2px 12px; scrollbar-width: none; }
  .map-chip { flex: none; font-size: 15px; }
  .map { aspect-ratio: 4 / 5; min-height: 0; border-radius: 22px; cursor: default; }
  .map-card { left: 10px; right: 10px; bottom: 10px; width: auto; }
  .map-card:not(.on) { right: auto; max-width: calc(100% - 76px); }
  .map-tools { right: 10px; bottom: auto; top: 10px; }
  .map-reset { right: auto; left: 10px; top: 10px; }
}
`;

module.exports = { siteMap, MAP_STYLE };
