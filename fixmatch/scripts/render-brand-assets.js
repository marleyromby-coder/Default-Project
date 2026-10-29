#!/usr/bin/env node
/**
 * Renders the FixMatch icon, splash and favicon PNGs from the vector logo.
 * Needs Playwright with Chromium (`npx playwright install chromium` once).
 *
 * Usage: node scripts/render-brand-assets.js
 *
 * The mark – a lowercase "f" from Fraunces ExtraBold with the ochre dot over its hook –
 * lives in assets/brand/mark.json on a 64-unit tile, so the app's LogoMark
 * (src/components/logo.tsx), every icon and the widget images are drawn from the same outline.
 */
const fs = require('node:fs');
const path = require('node:path');

const { chromium } = require('playwright');

const MARK = require('../assets/brand/mark.json');

const { tileTop, tile, letter, dot } = MARK.colors;

/**
 * The letter and the dot on the 64-unit grid. `parts` picks what to draw, `color` draws both
 * in one colour. With only the letter, the dot is cut out of it, so the two iOS 26 icon
 * layers look right whichever order Liquid Glass stacks them in.
 */
function glyph({ parts = ['f', 'dot'], color } = {}) {
  const circle = (fill, grow = 0) =>
    `<circle cx="${MARK.dot.cx}" cy="${MARK.dot.cy}" r="${MARK.dot.r + grow}" fill="${fill}"/>`;
  // In one colour the dot would melt into the hook, so a thin gap is cut around it.
  const knockout = !parts.includes('dot') || color !== undefined;
  const gap = color !== undefined ? 1.3 : 0;
  return [
    knockout
      ? `<mask id="no-dot" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64"><rect width="64" height="64" fill="white"/>${circle('black', gap)}</mask>`
      : '',
    parts.includes('f')
      ? `<path d="${MARK.f}" fill="${color ?? letter}"${knockout ? ' mask="url(#no-dot)"' : ''}/>`
      : '',
    parts.includes('dot') ? circle(color ?? dot) : '',
  ].join('');
}

/** Just the letter and dot, cropped to their bounds, for the widgets (src/widgets/). */
function cropped(height, options) {
  const { x, y, width, height: h } = MARK.bounds;
  const scale = height / h;
  const canvasWidth = Math.ceil(width * scale);
  return {
    width: canvasWidth,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${height}" viewBox="${x} ${y} ${width} ${h}">${glyph(options)}</svg>`,
  };
}

/** Scales the 64-unit drawing to the canvas; `zoom` < 1 shrinks it around the centre (Android safe zone). */
function placed(canvas, options, zoom = 1) {
  const scale = (canvas / MARK.size) * zoom;
  const offset = (canvas - MARK.size * scale) / 2;
  return `<g transform="translate(${offset} ${offset}) scale(${scale})">${glyph(options)}</g>`;
}

function svg(size, body, background = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${tileTop}"/>
        <stop offset="1" stop-color="${tile}"/>
      </linearGradient>
    </defs>
    ${background}
    ${body}
  </svg>`;
}

const fullBleed = (size) => `<rect width="${size}" height="${size}" fill="url(#bg)"/>`;
const rounded = (size) => `<rect width="${size}" height="${size}" rx="${size * 0.234}" fill="url(#bg)"/>`;
// Android shows the inner 72 of 108 dp of an adaptive icon.
const SAFE_ZONE = 72 / 108;

const ASSETS = [
  // iOS App Store icon: full bleed, no transparency (iOS applies the mask).
  { file: 'assets/images/icon.png', size: 1024, svg: (s) => svg(s, placed(s), fullBleed(s)), opaque: true },
  // iOS 26 Icon Composer layers on a transparent background (the pine fill is in icon.json),
  // so Liquid Glass lifts the letter and the dot separately.
  { file: 'assets/fixmatch.icon/Assets/letter.png', size: 1024, svg: (s) => svg(s, placed(s, { parts: ['f'] })) },
  { file: 'assets/fixmatch.icon/Assets/dot.png', size: 1024, svg: (s) => svg(s, placed(s, { parts: ['dot'] })) },
  // Android adaptive icon: content kept inside the safe zone.
  {
    file: 'assets/images/android-icon-foreground.png',
    size: 1024,
    svg: (s) => svg(s, placed(s, {}, SAFE_ZONE)),
  },
  { file: 'assets/images/android-icon-background.png', size: 1024, svg: (s) => svg(s, '', fullBleed(s)), opaque: true },
  {
    file: 'assets/images/android-icon-monochrome.png',
    size: 1024,
    svg: (s) => svg(s, placed(s, { color: '#FFFFFF' }, SAFE_ZONE)),
  },
  // Splash screen logo and web favicon: rounded tile.
  { file: 'assets/images/splash-icon.png', size: 512, svg: (s) => svg(s, placed(s), rounded(s)) },
  { file: 'assets/images/favicon.png', size: 96, svg: (s) => svg(s, placed(s), rounded(s)) },
  // Square logo for the website, press and App Store Connect.
  { file: 'assets/brand/fixmatch-logo.png', size: 1024, svg: (s) => svg(s, placed(s), rounded(s)) },
];

/**
 * Images for the widget extension's asset catalog (plugins/with-fixmatch-widgets.js): the
 * mark on its tile, the letter and dot for the pine widget, and a one-colour version that
 * iOS tints on the lock screen. Rendered at @2x and @3x of the point size.
 */
const WIDGET_IMAGES = [
  { name: 'FixMatchMark', points: 60, square: true },
  { name: 'FixMatchGlyph', points: 60 },
  { name: 'FixMatchGlyphMono', points: 60, color: '#FFFFFF' },
];

async function renderWidgetImages(page, root) {
  for (const image of WIDGET_IMAGES) {
    for (const scale of [2, 3]) {
      const size = image.points * scale;
      const { svg: markup, width } = image.square
        ? { svg: svg(size, placed(size), rounded(size)), width: size }
        : cropped(size, { color: image.color });
      const file = `assets/brand/widget/${image.name}@${scale}x.png`;
      fs.mkdirSync(path.join(root, path.dirname(file)), { recursive: true });
      await page.setViewportSize({ width, height: size });
      await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
      await page.locator('svg').screenshot({ path: path.join(root, file), omitBackground: true });
      console.log(`✓ ${file} (${width}×${size})`);
    }
  }
}

async function main() {
  const root = path.join(__dirname, '..');
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const asset of ASSETS) {
    const markup = asset.svg(asset.size);
    const out = path.join(root, asset.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.setViewportSize({ width: asset.size, height: asset.size });
    await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
    await page.locator('svg').screenshot({ path: out, omitBackground: !asset.opaque });
    if (asset.file === 'assets/images/icon.png') {
      fs.writeFileSync(path.join(root, 'assets/brand/fixmatch-icon.svg'), markup);
    }
    console.log(`✓ ${asset.file} (${asset.size}×${asset.size})`);
  }
  await renderWidgetImages(page, root);
  fs.writeFileSync(path.join(root, 'assets/brand/fixmatch-mark.svg'), svg(64, placed(64), rounded(64)));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
