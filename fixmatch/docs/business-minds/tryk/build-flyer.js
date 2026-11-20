#!/usr/bin/env node
/**
 * Bygger A5-flyeren til Business Minds fra flyer.html (to sider: forside og bagside).
 *
 *   node fixmatch/docs/business-minds/tryk/build-flyer.js      (virker fra enhver mappe)
 *
 * `node build.js` i samme mappe kører også dette script (efter plakaten). Resultat:
 *   pdf/FixMatch-flyer-A5-med-beskaering.pdf   154 × 216 mm: A5 + 3 mm beskæring hele vejen rundt (trykkeri)
 *   pdf/FixMatch-flyer-A5-uden-beskaering.pdf  148 × 210 mm: præcis A5 (skole- eller kopiprinter)
 *   pdf/FixMatch-flyer-A4-med-2-flyers.pdf     liggende A4: side 1 to forsider, side 2 to bagsider, med
 *                                              skæremærker. Flyerne er 90 % (133 × 189 mm), så mærkerne
 *                                              kan trykkes. Tryk i 100 %, dobbeltsidet, vend på den korte kant.
 *   preview/flyer-*.png                        billeder til at se resultatet
 *
 * Navnene kommer fra ../team.json (deltagere, underviser, skole, aarstal og evt. kontakt).
 * <span class="ph">[…]</span> vises som gule pladsholdere, og scriptet skriver, hvad der mangler.
 * Fag-fliserne tegnes fra appens egne tegninger (assets/brand/trade-art.json).
 * Til sidst tjekkes sidestørrelser og indlejrede skrifter med pypdf (hvis python3 har pypdf),
 * og QR-koderne afkodes (hvis npm-pakkerne jsqr og pngjs kan findes, fx via NODE_PATH).
 *
 * Kræver Playwright med Chromium (require('playwright')).
 */
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const DIR = __dirname;
const APP = path.resolve(DIR, '../../../..'); // fixmatch/
const PDF = path.join(DIR, 'pdf');
const PREVIEW = path.join(DIR, 'preview');
const SOURCE = pathToFileURL(path.join(DIR, 'flyer.html')).href;

const OUTPUTS = [
  { mode: 'bleed', file: 'FixMatch-flyer-A5-med-beskaering.pdf', size: [154, 216], bleed: 3, pages: 2, title: 'FixMatch – flyer A5 med 3 mm beskæring' },
  { mode: 'trim', file: 'FixMatch-flyer-A5-uden-beskaering.pdf', size: [148, 210], bleed: 0, pages: 2, title: 'FixMatch – flyer A5 uden beskæring' },
  { mode: 'a4', file: 'FixMatch-flyer-A4-med-2-flyers.pdf', size: [297, 210], bleed: 0, pages: 2, title: 'FixMatch – flyer, 2 pr. A4 med skæremærker' },
];
/** Text and QR codes stay this far inside the trim edge (mm). */
const SAFE = 5;

const QR_CODES = [
  { selector: '.front .qr-card img', url: 'https://fixmatchh.netlify.app' },
  { selector: '.back .qr-card img', url: 'https://fixmatchh.netlify.app/tilmeld/' },
];

function optional(name) {
  try {
    return require(name);
  } catch {
    return null;
  }
}

/** The eight trade tiles as SVG files, drawn from the app's artwork so they always match the app. */
function writeTradeTiles() {
  const lib = path.join(APP, 'scripts/lib/trade-art.js');
  if (!fs.existsSync(lib)) return;
  const { tradeArt } = require(lib);
  const { tile, colors } = tradeArt(APP);
  const out = path.join(DIR, 'assets/fag');
  fs.mkdirSync(out, { recursive: true });
  for (const id of Object.keys(colors)) fs.writeFileSync(path.join(out, `${id}.svg`), tile(id, { size: 64, radius: 0.25 }));
}

async function open(browser, team, mode, scale = 1) {
  const page = await browser.newPage({ deviceScaleFactor: scale });
  await page.addInitScript((value) => {
    window.FLYER_TEAM = value;
  }, team);
  await page.goto(`${SOURCE}?mode=${mode}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(() =>
    ['900 20px "Schibsted Grotesk"', '800 20px "Schibsted Grotesk"', '400 20px Inter', '700 20px Inter'].filter(
      (font) => !document.fonts.check(font),
    ),
  );
  if (missing.length) throw new Error(`Skrifterne blev ikke indlæst: ${missing.join(', ')}`);
  const broken = await page.evaluate(() =>
    [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.getAttribute('src')),
  );
  if (broken.length) throw new Error(`Billeder mangler: ${broken.join(', ')}`);
  return page;
}

/**
 * Chromium rounds the PDF page size (up to 0.5 pt), so flyer.html draws each page 2 mm too large
 * and this crops it to the exact size from the top-left corner, where Chromium anchors the content.
 * Sets MediaBox = CropBox = BleedBox, and TrimBox `bleed` mm inside, as print shops expect.
 */
function cropPdf(file, [width, height], bleed, title) {
  const script = `
import sys
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject
src, w, h, b, title = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
pt = 72 / 25.4
w, h, b = w * pt, h * pt, b * pt
reader, writer = PdfReader(src), PdfWriter()
for page in reader.pages:
    top = float(page.mediabox.top)
    page.add_transformation(Transformation().translate(0, h - top))
    box = RectangleObject([0, 0, w, h])
    page.mediabox = box
    page.cropbox = box
    page.bleedbox = box
    page.trimbox = RectangleObject([b, b, w - b, h - b])
    writer.add_page(page)
writer.add_metadata({'/Title': title, '/Author': 'Team FixMatch', '/Subject': 'Business Minds'})
writer.write(src)
`;
  try {
    execFileSync('python3', ['-I', '-c', script, file, String(width), String(height), String(bleed), title], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    if (String(error.stderr || '').includes('No module named'))
      throw new Error('python3 mangler pypdf (pip install pypdf), som skal til for at give PDF’erne den præcise størrelse');
    throw error;
  }
}

/**
 * Text and QR codes must sit at least `min` mm inside the trim edge. Returns what is too close.
 * The app screenshot is a picture inside the phone and is not checked word by word.
 */
async function checkSafeArea(page, min) {
  return page.evaluate((min) => {
    const mm = 96 / 25.4;
    const problems = [];
    document.querySelectorAll('.page').forEach((pageEl, index) => {
      const trim = pageEl.querySelector('.trim').getBoundingClientRect();
      const check = (rect, what) => {
        if (!rect.width || !rect.height) return;
        const gap = Math.min(rect.left - trim.left, rect.top - trim.top, trim.right - rect.right, trim.bottom - rect.bottom) / mm;
        if (gap < min - 0.05) problems.push(`side ${index + 1}: "${what}" ${gap.toFixed(1)} mm fra kanten`);
      };
      const walker = document.createTreeWalker(pageEl.querySelector('.trim'), NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent.trim() || node.parentElement.closest('.phone')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) check(rect, node.textContent.trim().slice(0, 30));
      }
      pageEl.querySelectorAll('.qr-card img').forEach((img) => check(img.getBoundingClientRect(), 'QR-kode'));
    });
    return problems;
  }, min);
}

/** Page sizes (mm) and fonts of a PDF, read with pypdf. Returns null when pypdf is missing. */
function inspectPdf(file) {
  const script = `
import json, sys
from pypdf import PdfReader
r = PdfReader(sys.argv[1])
pages, fonts = [], {}
def walk(res):
    if not res: return
    res = res.get_object()
    for f in (res.get('/Font') or {}).values():
        f = f.get_object()
        name = str(f.get('/BaseFont'))
        d = f.get('/FontDescriptor')
        if d is None and '/DescendantFonts' in f:
            d = f['/DescendantFonts'][0].get_object().get('/FontDescriptor')
        d = d.get_object() if d is not None else {}
        fonts[name] = any(k in d for k in ('/FontFile', '/FontFile2', '/FontFile3')) or f.get('/Subtype') == '/Type3'
    for x in (res.get('/XObject') or {}).values():
        x = x.get_object()
        if x.get('/Subtype') == '/Form': walk(x.get('/Resources'))
for p in r.pages:
    b = p.mediabox
    pages.append([round(float(b.width) * 25.4 / 72, 2), round(float(b.height) * 25.4 / 72, 2)])
    walk(p.get('/Resources'))
print(json.dumps({'pages': pages, 'fonts': fonts}))
`;
  try {
    return JSON.parse(execFileSync('python3', ['-I', '-c', script, file], { stdio: ['ignore', 'pipe', 'pipe'] }).toString());
  } catch (error) {
    if (String(error.stderr || '').includes('No module named')) return null;
    throw error;
  }
}

/** Decodes each QR code from a 1:1 render of the trim-size flyer. Returns null when jsqr/pngjs are missing. */
async function checkQrCodes(browser, team) {
  const jsQR = optional('jsqr');
  const { PNG } = optional('pngjs') || {};
  if (!jsQR || !PNG) return null;
  // 150 dpi: about what a school printer gives, and well below the vector original.
  const page = await open(browser, team, 'trim', 150 / 96);
  const results = [];
  for (const { selector, url } of QR_CODES) {
    // The white card holds the code and its quiet zone; decode that, as a phone would see it.
    const card = page.locator(selector).locator('xpath=..');
    const png = PNG.sync.read(await card.screenshot());
    const found = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    results.push({ url, read: found ? found.data : null, ok: Boolean(found && found.data === url) });
  }
  await page.close();
  return results;
}

(async () => {
  const team = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'team.json'), 'utf8'));
  writeTradeTiles();
  fs.mkdirSync(PDF, { recursive: true });
  fs.mkdirSync(PREVIEW, { recursive: true });

  const browser = await chromium.launch();
  try {
    for (const output of OUTPUTS) {
      const file = path.join(PDF, output.file);
      const page = await open(browser, team, output.mode);
      await page.pdf({ path: file, printBackground: true, preferCSSPageSize: true });
      await page.close();
      cropPdf(file, output.size, output.bleed, output.title);
    }

    // Previews: the two sides at trim size, and the two A4 sheets.
    const trim = await open(browser, team, 'trim', 2);
    const placeholders = await trim.evaluate(() => [...document.querySelectorAll('.ph')].map((el) => el.textContent.trim()));
    const tooClose = await checkSafeArea(trim, SAFE);
    const sides = trim.locator('.page');
    await sides.nth(0).screenshot({ path: path.join(PREVIEW, 'flyer-forside.png') });
    await sides.nth(1).screenshot({ path: path.join(PREVIEW, 'flyer-bagside.png') });
    await trim.close();
    const sheet = await open(browser, team, 'a4', 1.5);
    const sheets = sheet.locator('.page');
    await sheets.nth(0).screenshot({ path: path.join(PREVIEW, 'flyer-A4-side-1-forsider.png') });
    await sheets.nth(1).screenshot({ path: path.join(PREVIEW, 'flyer-A4-side-2-bagsider.png') });
    await sheet.close();

    let failed = tooClose.length > 0;
    console.log(
      tooClose.length
        ? `✗ For tæt på skærekanten (mindst ${SAFE} mm):\n  ${tooClose.join('\n  ')}`
        : `✓ Al tekst og begge QR-koder ligger mindst ${SAFE} mm inden for skærekanten`,
    );
    for (const output of OUTPUTS) {
      const info = inspectPdf(path.join(PDF, output.file));
      if (!info) {
        console.log(`pdf/${output.file}: ikke tjekket (python3 mangler pypdf)`);
        continue;
      }
      const sizeOk =
        info.pages.length === output.pages &&
        info.pages.every(([w, h]) => Math.abs(w - output.size[0]) < 0.02 && Math.abs(h - output.size[1]) < 0.02);
      const notEmbedded = Object.entries(info.fonts).filter(([, embedded]) => !embedded).map(([name]) => name);
      failed ||= !sizeOk || notEmbedded.length > 0;
      console.log(
        `${sizeOk ? '✓' : '✗'} pdf/${output.file}: ${info.pages.length} sider à ${info.pages[0].join(' × ')} mm` +
          (sizeOk ? '' : ` (skulle være ${output.pages} à ${output.size.join(' × ')} mm)`) +
          ` · skrifter: ${Object.keys(info.fonts).map((name) => name.replace(/^\/[A-Z]{6}\+/, '')).join(', ')}` +
          (notEmbedded.length ? ` · IKKE indlejret: ${notEmbedded.join(', ')}` : ' (alle indlejret)'),
      );
    }

    const qr = await checkQrCodes(browser, team);
    if (!qr) console.log('QR-koder: ikke afkodet (jsqr og pngjs mangler; kør med NODE_PATH til en mappe med dem)');
    else
      for (const { url, read, ok } of qr) {
        failed ||= !ok;
        console.log(`${ok ? '✓' : '✗'} QR-kode ${url}${ok ? '' : ` – læste ${read ?? 'ingenting'}`}`);
      }

    if (placeholders.length)
      console.log(`\nUdfyld i team.json, før I trykker (${placeholders.length} pladsholdere): ${[...new Set(placeholders)].join(', ')}`);
    if (failed) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
