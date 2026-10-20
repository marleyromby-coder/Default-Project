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
const ORANGE_DARK = '#D9420C';

// Direction of the check mark's long stroke, used to align the wrench jaw.
const ANGLE = (Math.atan2(-21.5, 17.5) * 180) / Math.PI;

/** White glyph on a 64-unit grid: a check mark whose end is an open-end wrench head. */
function glyph(fill = '#FFFFFF') {
  return `
    <defs>
      <mask id="jaw" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
        <rect x="0" y="0" width="64" height="64" fill="white"/>
        <rect x="0" y="-3.6" width="16" height="7.2" rx="1.2" fill="black"
          transform="translate(49.4 18.6) rotate(${ANGLE.toFixed(2)})"/>
      </mask>
    </defs>
    <path d="M15.5 34.5 L27.5 46 L45.4 23.6" stroke="${fill}" stroke-width="7.6"
      stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="47.9" cy="20.5" r="9.2" fill="${fill}" mask="url(#jaw)"/>`;
}

/** Centres the glyph (bounding box ≈ x 11.7–57, y 11.3–49.8) in a canvas. */
function placed(canvas, coverage, fill) {
  const scale = (canvas * coverage) / 45.3;
  return `<g transform="translate(${canvas / 2} ${canvas / 2}) scale(${scale}) translate(-34.35 -30.55)">${glyph(fill)}</g>`;
}

function svg(size, body, background = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${ORANGE_LIGHT}"/>
        <stop offset="0.55" stop-color="${ORANGE}"/>
        <stop offset="1" stop-color="${ORANGE_DARK}"/>
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
  { file: 'assets/images/icon.png', size: 1024, svg: (s) => svg(s, placed(s, 0.6), fullBleed(s)), opaque: true },
  // iOS 26 Icon Composer layer: white glyph on transparent background.
  { file: 'assets/fixmatch.icon/Assets/glyph.png', size: 1024, svg: (s) => svg(s, placed(s, 0.6)) },
  // Android adaptive icon: content kept inside the 66 % safe zone.
  { file: 'assets/images/android-icon-foreground.png', size: 1024, svg: (s) => svg(s, placed(s, 0.4)) },
  { file: 'assets/images/android-icon-background.png', size: 1024, svg: (s) => svg(s, '', fullBleed(s)), opaque: true },
  { file: 'assets/images/android-icon-monochrome.png', size: 1024, svg: (s) => svg(s, placed(s, 0.4)) },
  // Splash screen logo and web favicon: rounded tile.
  { file: 'assets/images/splash-icon.png', size: 512, svg: (s) => svg(s, placed(s, 0.6), rounded(s)) },
  { file: 'assets/images/favicon.png', size: 96, svg: (s) => svg(s, placed(s, 0.62), rounded(s)) },
  // Square logo for the website, press and App Store Connect.
  { file: 'assets/brand/fixmatch-logo.png', size: 1024, svg: (s) => svg(s, placed(s, 0.6), rounded(s)) },
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
  fs.writeFileSync(path.join(root, 'assets/brand/fixmatch-mark.svg'), svg(64, glyph(), rounded(64)));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
