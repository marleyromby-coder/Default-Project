#!/usr/bin/env node
/**
 * Renders the FixMatch icon, splash and favicon PNGs from the vector logo.
 * Needs Playwright with Chromium (`npx playwright install chromium` once).
 *
 * Usage: node scripts/render-brand-assets.js
 *
 * The mark – a lowercase "f" from Fraunces ExtraBold with the ochre dot of the wordmark
 * "fixmatch." – lives in assets/brand/mark.json on a 64-unit tile, so the app's LogoMark
 * (src/components/logo.tsx) and every icon are drawn from the same outline.
 */
const fs = require('node:fs');
const path = require('node:path');

const { chromium } = require('playwright');

const MARK = require('../assets/brand/mark.json');

const { tileTop, tile, letter, dot } = MARK.colors;

/** The letter and the dot on the 64-unit grid. `parts` picks what to draw, `color` overrides both fills. */
function glyph({ parts = ['f', 'dot'], color } = {}) {
  return [
    parts.includes('f') ? `<path d="${MARK.f}" fill="${color ?? letter}"/>` : '',
    parts.includes('dot')
      ? `<circle cx="${MARK.dot.cx}" cy="${MARK.dot.cy}" r="${MARK.dot.r}" fill="${color ?? dot}"/>`
      : '',
  ].join('');
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
  fs.writeFileSync(path.join(root, 'assets/brand/fixmatch-mark.svg'), svg(64, placed(64), rounded(64)));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
