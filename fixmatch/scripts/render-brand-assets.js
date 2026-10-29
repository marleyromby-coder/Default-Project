#!/usr/bin/env node
/**
 * Renders the FixMatch icon, splash and favicon PNGs from the vector logo.
 * Needs Playwright with Chromium (`npx playwright install chromium` once).
 *
 * Usage: node scripts/render-brand-assets.js
 */
const fs = require('node:fs');
const path = require('node:path');

const { chromium } = require('playwright');

const ORANGE_LIGHT = '#FF7433';
const ORANGE = '#F2541B';
const INK_TOP = '#243250';
const INK = '#111A2B';
const STEEL = '#4B5E84';

/**
 * The FixMatch mark on a 64-unit grid: a spirit level with the bubble dead centre
 * between the two marks – "i vater", everything is right. `mono` draws a single-colour
 * silhouette (Android themed icons) with the bubble and marks cut out.
 */
function glyph({ mono = false } = {}) {
  if (mono) {
    return `
    <defs>
      <mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
        <rect width="64" height="64" fill="white"/>
        <line x1="25.6" y1="24.6" x2="25.6" y2="39.4" stroke="black" stroke-width="2.3" stroke-linecap="round"/>
        <line x1="38.4" y1="24.6" x2="38.4" y2="39.4" stroke="black" stroke-width="2.3" stroke-linecap="round"/>
        <ellipse cx="32" cy="32" rx="4.3" ry="3.9" fill="black"/>
      </mask>
    </defs>
    <g mask="url(#cut)" fill="#FFFFFF">
      <rect x="7" y="27.75" width="50" height="8.5" rx="2.5"/>
      <rect x="17.5" y="20.5" width="29" height="23" rx="11.5"/>
    </g>`;
  }
  return `
    <defs>
      <linearGradient id="vial" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${ORANGE_LIGHT}"/>
        <stop offset="1" stop-color="${ORANGE}"/>
      </linearGradient>
    </defs>
    <rect x="7" y="27.75" width="50" height="8.5" rx="2.5" fill="${STEEL}"/>
    <rect x="17.5" y="20.5" width="29" height="23" rx="11.5" fill="url(#vial)"/>
    <line x1="25.6" y1="24.6" x2="25.6" y2="39.4" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round"/>
    <line x1="38.4" y1="24.6" x2="38.4" y2="39.4" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round"/>
    <ellipse cx="32" cy="32" rx="4.3" ry="3.9" fill="#FFFFFF"/>`;
}

/** Centres the glyph (bounding box x 7–57, y 20.5–43.5) in a canvas. */
function placed(canvas, coverage, options) {
  const scale = (canvas * coverage) / 50;
  return `<g transform="translate(${canvas / 2} ${canvas / 2}) scale(${scale}) translate(-32 -32)">${glyph(options)}</g>`;
}

function svg(size, body, background = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${INK_TOP}"/>
        <stop offset="1" stop-color="${INK}"/>
      </linearGradient>
    </defs>
    ${background}
    ${body}
  </svg>`;
}

const fullBleed = (size) => `<rect width="${size}" height="${size}" fill="url(#bg)"/>`;
const rounded = (size) => `<rect width="${size}" height="${size}" rx="${size * 0.234}" fill="url(#bg)"/>`;

const ASSETS = [
  // iOS App Store icon: full bleed, no transparency (iOS applies the mask).
  { file: 'assets/images/icon.png', size: 1024, svg: (s) => svg(s, placed(s, 0.76), fullBleed(s)), opaque: true },
  // iOS 26 Icon Composer layer: the level on a transparent background (the fill is in icon.json).
  { file: 'assets/fixmatch.icon/Assets/glyph.png', size: 1024, svg: (s) => svg(s, placed(s, 0.76)) },
  // Android adaptive icon: content kept inside the 66 % safe zone.
  { file: 'assets/images/android-icon-foreground.png', size: 1024, svg: (s) => svg(s, placed(s, 0.4)) },
  { file: 'assets/images/android-icon-background.png', size: 1024, svg: (s) => svg(s, '', fullBleed(s)), opaque: true },
  { file: 'assets/images/android-icon-monochrome.png', size: 1024, svg: (s) => svg(s, placed(s, 0.4, { mono: true })) },
  // Splash screen logo and web favicon: rounded tile.
  { file: 'assets/images/splash-icon.png', size: 512, svg: (s) => svg(s, placed(s, 0.7), rounded(s)) },
  { file: 'assets/images/favicon.png', size: 96, svg: (s) => svg(s, placed(s, 0.82), rounded(s)) },
  // Square logo for the website, press and App Store Connect.
  { file: 'assets/brand/fixmatch-logo.png', size: 1024, svg: (s) => svg(s, placed(s, 0.7), rounded(s)) },
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
    if (asset.file.endsWith('icon.png') && asset.file.includes('images/icon')) {
      fs.writeFileSync(path.join(root, 'assets/brand/fixmatch-icon.svg'), markup);
    }
    console.log(`✓ ${asset.file} (${asset.size}×${asset.size})`);
  }
  fs.writeFileSync(path.join(root, 'assets/brand/fixmatch-mark.svg'), svg(64, placed(64, 0.76), rounded(64)));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
