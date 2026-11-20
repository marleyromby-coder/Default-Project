#!/usr/bin/env node
/**
 * Laver tryk-filerne til Business Minds: plakaten (A1 og A2, med og uden beskæring) og
 * PNG-forhåndsvisninger. Findes build-flyer.js i samme mappe, køres den bagefter, så
 * `node build.js` laver alle tryksager.
 *
 *   cd fixmatch/docs/business-minds/tryk
 *   node build.js            alt (plakat + flyer)
 *   node build.js plakat     kun plakaten
 *
 * Kræver Playwright med Chromium (require('playwright')). Navnene kommer fra ../team.json
 * (deltagere, underviser, skole, aarstal). Felter med <span class="ph">[…]</span> vises som
 * gule pladsholdere, til I har skrevet navnene ind. Kør scriptet igen bagefter.
 *
 * Resultat:
 *   pdf/FixMatch-plakat-A1-med-beskaering.pdf   600 × 847 mm  (A1 + 3 mm beskæring, til trykkeriet)
 *   pdf/FixMatch-plakat-A1-uden-beskaering.pdf  594 × 841 mm  (til skolens printer / copyshop)
 *   pdf/FixMatch-plakat-A2-med-beskaering.pdf   426 × 600 mm
 *   pdf/FixMatch-plakat-A2-uden-beskaering.pdf  420 × 594 mm
 *   preview/plakat-*.png                        1600 px høje
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const HERE = __dirname;
const PDF_DIR = path.join(HERE, 'pdf');
const PREVIEW_DIR = path.join(HERE, 'preview');
const PREVIEW_HEIGHT = 1600;
const MM_TO_PT = 72 / 25.4;
const MM_TO_PX = 96 / 25.4;

const POSTER = [
  { format: 'A1', trim: [594, 841], bleed: true },
  { format: 'A1', trim: [594, 841], bleed: false },
  { format: 'A2', trim: [420, 594], bleed: true },
  { format: 'A2', trim: [420, 594], bleed: false },
];

function readTeam() {
  const file = path.join(HERE, '..', 'team.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.warn(`! Kunne ikke læse ${file} (${error.message}). Pladsholderne bliver stående.`);
    return {};
  }
}

/**
 * Chromium runder sidestørrelsen til hele pixels (op til 0,2 mm for meget). Her får siden
 * præcis størrelse, og trykkeriet får en TrimBox (det færdige format) og en BleedBox
 * (med beskæring). Det sker som en tilføjelse sidst i filen (inkrementel opdatering), så
 * resten af PDF'en er uændret.
 */
function setPageBoxes(file, [wMm, hMm], bleedMm) {
  const buf = fs.readFileSync(file);
  const raw = buf.toString('latin1');
  const page = raw.match(/(\d+) 0 obj\s*(<<\s*\/Type\s*\/Page\b[\s\S]*?)\s*endobj/);
  const trailers = [...raw.matchAll(/trailer\s*<<([\s\S]*?)>>\s*startxref\s*(\d+)/g)];
  if (!page || !trailers.length) throw new Error(`${file}: uventet PDF-opbygning`);
  const [, trailer, prev] = trailers[trailers.length - 1];
  const field = (name) => (trailer.match(new RegExp(`/${name}\\s+(\\d+(?:\\s+\\d+\\s+R)?)`)) || [])[1];
  const pt = (mm) => Number((mm * MM_TO_PT).toFixed(3));
  const [W, H, b] = [pt(wMm), pt(hMm), pt(bleedMm)];
  const dict = page[2]
    .replace(/\/(TrimBox|BleedBox)\s*\[[^\]]*\]\s*/g, '')
    .replace(/\/MediaBox\s*\[[^\]]*\]/, `/MediaBox [0 0 ${W} ${H}]`)
    .replace(/>>\s*$/, `\n/BleedBox [0 0 ${W} ${H}]\n/TrimBox [${b} ${b} ${pt(wMm - bleedMm)} ${pt(hMm - bleedMm)}]>>`);
  const body = `\n${page[1]} 0 obj\n${dict}\nendobj\n`;
  const xrefAt = buf.length + Buffer.byteLength(body, 'latin1');
  const info = field('Info');
  const tail =
    `xref\n${page[1]} 1\n${String(buf.length + 1).padStart(10, '0')} 00000 n \n` +
    `trailer\n<</Size ${field('Size')}\n/Root ${field('Root')}${info ? `\n/Info ${info}` : ''}\n/Prev ${prev}>>\n` +
    `startxref\n${xrefAt}\n%%EOF\n`;
  fs.appendFileSync(file, Buffer.from(body + tail, 'latin1'));
}

/** Siden i PDF'en skal have den rigtige størrelse, og alle fonte skal være indlejret. */
function checkPdf(file, [wMm, hMm], bleedMm) {
  const raw = fs.readFileSync(file).toString('latin1');
  const box = (name) => {
    const all = [...raw.matchAll(new RegExp(`/${name}\\s*\\[\\s*([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s*\\]`, 'g'))];
    return all.length ? all[all.length - 1].slice(1).map(Number) : null; // seneste udgave
  };
  const problems = [];
  const pages = new Set([...raw.matchAll(/(\d+) 0 obj\s*<<\s*\/Type\s*\/Page\b/g)].map((m) => m[1]));
  if (pages.size !== 1) problems.push(`${pages.size} sider (ventede 1)`);
  const media = box('MediaBox');
  const trimBox = box('TrimBox');
  const w = (media[2] - media[0]) / MM_TO_PT;
  const h = (media[3] - media[1]) / MM_TO_PT;
  if (Math.abs(w - wMm) > 0.05 || Math.abs(h - hMm) > 0.05) {
    problems.push(`siden er ${w.toFixed(2)} × ${h.toFixed(2)} mm (ventede ${wMm} × ${hMm})`);
  }
  if (!trimBox || Math.abs(trimBox[0] / MM_TO_PT - bleedMm) > 0.05) problems.push('TrimBox mangler eller er forkert');
  const descriptors = (raw.match(/\/Type\s*\/FontDescriptor/g) || []).length;
  const embedded = (raw.match(/\/FontFile[23]?\s/g) || []).length;
  if (descriptors !== embedded) problems.push(`${descriptors - embedded} fonte er ikke indlejret`);
  return { problems, fonts: embedded };
}

async function buildPoster(browser, team) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const html = pathToFileURL(path.join(HERE, 'plakat.html')).href;
  let failed = false;

  for (const job of POSTER) {
    const bleed = job.bleed ? 3 : 0;
    const [wMm, hMm] = [job.trim[0] + 2 * bleed, job.trim[1] + 2 * bleed];
    const name = `FixMatch-plakat-${job.format}-${job.bleed ? 'med' : 'uden'}-beskaering`;
    const url = `${html}?format=${job.format}&bleed=${job.bleed ? 1 : 0}`;

    // PDF
    const page = await browser.newPage();
    await page.addInitScript((data) => {
      window.POSTER_TEAM = data;
    }, team);
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => window.posterReady);
    const pdfFile = path.join(PDF_DIR, `${name}.pdf`);
    await page.pdf({
      path: pdfFile,
      width: `${wMm}mm`,
      height: `${hMm}mm`,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    await page.close();
    setPageBoxes(pdfFile, [wMm, hMm], bleed);
    const check = checkPdf(pdfFile, [wMm, hMm], bleed);
    const size = (fs.statSync(pdfFile).size / 1e6).toFixed(1);
    if (check.problems.length) {
      failed = true;
      console.error(`✗ pdf/${name}.pdf: ${check.problems.join('; ')}`);
    } else {
      console.log(`✓ pdf/${name}.pdf  ${wMm} × ${hMm} mm, ${check.fonts} fonte indlejret, ${size} MB`);
    }

    // PNG (1600 px høj), tegnet i trykformat (uden skærmens grå baggrund)
    const wPx = wMm * MM_TO_PX;
    const hPx = hMm * MM_TO_PX;
    const context = await browser.newContext({
      viewport: { width: Math.ceil(wPx), height: Math.ceil(hPx) },
      deviceScaleFactor: PREVIEW_HEIGHT / hPx,
    });
    const shot = await context.newPage();
    await shot.addInitScript((data) => {
      window.POSTER_TEAM = data;
    }, team);
    await shot.emulateMedia({ media: 'print' });
    await shot.goto(url, { waitUntil: 'load' });
    await shot.evaluate(() => window.posterReady);
    const pngName = `plakat-${job.format}-${job.bleed ? 'med' : 'uden'}-beskaering.png`;
    await shot.screenshot({ path: path.join(PREVIEW_DIR, pngName), clip: { x: 0, y: 0, width: wPx, height: hPx } });
    await context.close();
    console.log(`✓ preview/${pngName}`);
  }
  return !failed;
}

(async () => {
  const only = process.argv[2];
  const team = readTeam();
  const browser = await chromium.launch();
  let ok = true;
  try {
    ok = await buildPoster(browser, team);
  } finally {
    await browser.close();
  }

  // Pladsholdere, plakaten bruger (flyeren skriver sine egne).
  const missing = ['deltagere', 'skole', 'aarstal'].flatMap((key) =>
    [...String(team[key] || '').matchAll(/class="ph">([^<]*)</g)].map((m) => m[1]),
  );
  if (missing.length) {
    console.log(`\nUdfyld i team.json, før plakaten trykkes (${missing.length} pladsholdere): ${[...new Set(missing)].join(', ')}`);
  }

  const flyer = path.join(HERE, 'build-flyer.js');
  if (only !== 'plakat' && fs.existsSync(flyer)) {
    console.log('\nFlyer (build-flyer.js):');
    const run = spawnSync(process.execPath, [flyer], { cwd: HERE, stdio: 'inherit' });
    if (run.status !== 0) ok = false;
  }
  if (!ok) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
