#!/usr/bin/env node
/**
 * Bygger alle tryksager til Business Minds-standen: plakaten (A1 og A2) og flyeren (A5),
 * PDF'erne i pdf/ og billederne i preview/. Se README.md for, hvilken fil der skal bruges hvor.
 *
 *   node fixmatch/docs/business-minds/tryk/build.js          alt (plakat og flyer)
 *   node fixmatch/docs/business-minds/tryk/build.js plakat   kun plakaten
 *   node fixmatch/docs/business-minds/tryk/build.js flyer    kun flyeren
 *
 * Virker fra enhver mappe. Navnene kommer fra ../team.json (deltagere, underviser, skole,
 * aarstal, kontakt). Tekst i <span class="ph">[…]</span> vises som gule pladsholdere, og
 * scriptet skriver til sidst, hvad der mangler. Kør scriptet igen, når I har udfyldt dem.
 *
 * Kræver Node med Playwright og Chromium (require('playwright')) og python3 med pypdf.
 * Valgfrit: pdftoppm (poppler) laver forhåndsvisningerne ud fra de færdige PDF'er og tjekker,
 * at ingen del af en tryksag er blevet hvid. jsqr (npm, fx via NODE_PATH) afkoder QR-koderne
 * fra PDF'erne. Mangler de, springes de trin over, og scriptet siger det.
 *
 * Tjek, der får scriptet til at fejle (exit 1): forkert sidestørrelse eller TrimBox, skrifter
 * der ikke er indlejret, tekst eller QR-kode for tæt på skærekanten (plakat 20 mm på A1 og
 * 15 mm på A2, flyer 5 mm), stilleområde om en QR-kode under 4 felter, en QR-kode der ikke
 * kan læses, og hvide huller i en tryksag.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const DIR = __dirname;
const APP = path.resolve(DIR, '../../..'); // fixmatch/
const PDF_DIR = path.join(DIR, 'pdf');
const PREVIEW_DIR = path.join(DIR, 'preview');
const PT = 72 / 25.4; // punkter pr. mm

/** QR-koderne i assets/ og den adresse, hver af dem skal føre til. */
const QR_CODES = {
  'assets/qr-forside.svg': 'https://fixmatchh.netlify.app',
  'assets/qr-tilmeld.svg': 'https://fixmatchh.netlify.app/tilmeld/',
};
const QUIET_MODULES = 4;

const POSTERS = ['A1', 'A2'].flatMap((format) =>
  [true, false].map((bleed) => {
    const trim = format === 'A1' ? [594, 841] : [420, 594];
    const b = bleed ? 3 : 0;
    const kind = bleed ? 'med' : 'uden';
    return {
      file: `FixMatch-plakat-${format}-${kind}-beskaering.pdf`,
      preview: `plakat-${format}-${kind}-beskaering.png`,
      url: `plakat.html?format=${format}&bleed=${bleed ? 1 : 0}`,
      size: [trim[0] + 2 * b, trim[1] + 2 * b],
      bleed: b,
      pages: 1,
      safe: format === 'A1' ? 20 : 15,
      title: `FixMatch – plakat ${format} ${bleed ? 'med 3 mm beskæring' : 'uden beskæring'}`,
      rasterDpi: 50,
      previewHeight: 1600,
    };
  }),
);

const FLYER_BLEED = {
  file: 'FixMatch-flyer-A5-med-beskaering.pdf',
  url: 'flyer.html?mode=bleed',
  size: [154, 216],
  bleed: 3,
  pages: 2,
  safe: 5,
  title: 'FixMatch – flyer A5 med 3 mm beskæring',
  rasterDpi: 150,
};
const FLYER_TRIM = {
  file: 'FixMatch-flyer-A5-uden-beskaering.pdf',
  url: 'flyer.html?mode=trim',
  size: [148, 210],
  bleed: 0,
  pages: 2,
  safe: 5,
  title: 'FixMatch – flyer A5 uden beskæring',
  rasterDpi: 150,
  previews: [
    { page: 1, file: 'flyer-forside.png', dpi: 192 },
    { page: 2, file: 'flyer-bagside.png', dpi: 192 },
  ],
};

/**
 * Ark, hvor den færdige A5-PDF med beskæring sættes ind på A4 med skæremærker (udskydning).
 * Flyerne kopieres som vektorer fra FixMatch-flyer-A5-med-beskaering.pdf, så de er identiske.
 * x/y er A5-sidens øverste venstre hjørne (skærekanten) på arket i mm.
 */
const SHEETS = [
  (() => {
    // To flyers pr. liggende A4 i 90 % (133,2 × 189 mm), så skæremærkerne kan trykkes.
    // Spejlsymmetrisk om midten, så bagsiderne rammer forsiderne ved dobbeltsidet tryk.
    const scale = 0.9;
    const [w, h] = [148 * scale, 210 * scale];
    const top = (210 - h) / 2;
    const slots = [top, 297 - top - w].map((x) => ({ x, y: top, scale }));
    const note = (side) =>
      `${side} · Tryk i 100 % (faktisk størrelse), dobbeltsidet: vend på den korte kant · Skær ved mærkerne · Hver flyer: 133 × 189 mm`;
    return {
      file: 'FixMatch-flyer-A4-med-2-flyers.pdf',
      title: 'FixMatch – flyer, 2 pr. A4 med skæremærker',
      sheet: [297, 210],
      slots,
      duplex: '/DuplexFlipShortEdge',
      notes: [note('Forsider'), note('Bagsider')],
      noteAt: { x: 148.5 + 0.7, y: 105, rotate: -90, size: 1.9 },
      rasterDpi: 150,
      previews: [
        { page: 1, file: 'flyer-A4-side-1-forsider.png', dpi: 144 },
        { page: 2, file: 'flyer-A4-side-2-bagsider.png', dpi: 144 },
      ],
    };
  })(),
  (() => {
    // Én flyer i fuld A5-størrelse midt på et stående A4 – til en almindelig printer.
    const note = (side) =>
      `${side} · Tryk i 100 % (faktisk størrelse), dobbeltsidet: vend på den lange kant · Skær ved mærkerne · A5: 148 × 210 mm`;
    return {
      file: 'FixMatch-flyer-A5-paa-A4-med-skaeremaerker.pdf',
      title: 'FixMatch – flyer A5 på A4 med skæremærker',
      sheet: [210, 297],
      slots: [{ x: (210 - 148) / 2, y: (297 - 210) / 2, scale: 1 }],
      duplex: '/DuplexFlipLongEdge',
      notes: [note('Forside'), note('Bagside')],
      noteAt: { x: 105, y: 280, rotate: 0, size: 2.4 },
      rasterDpi: 150,
      previews: [
        { page: 1, file: 'flyer-A5-paa-A4-side-1-forside.png', dpi: 100 },
        { page: 2, file: 'flyer-A5-paa-A4-side-2-bagside.png', dpi: 100 },
      ],
    };
  })(),
];
/** Skæremærkerne holder sig mindst så langt fra papirkanten (det, en printer ikke kan trykke). */
const MARK = { margin: 5, gap: 0.3, length: 5 };

/* ------------------------------------------------------------------------------------------ */

function optional(name) {
  try {
    return require(name);
  } catch {
    return null;
  }
}

function readData() {
  const file = path.join(DIR, '..', 'team.json');
  let team = {};
  try {
    team = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.warn(`! Kunne ikke læse ${file} (${error.message}). Pladsholderne bliver stående.`);
  }
  // Antal felter i hver QR-kode (SVG'ens viewBox), så stilleområdet altid er 4 felter,
  // også hvis en længere adresse giver en større kode.
  const qr = {};
  for (const src of Object.keys(QR_CODES)) {
    const svg = fs.readFileSync(path.join(DIR, src), 'utf8');
    const box = svg.match(/viewBox="\s*0\s+0\s+(\d+)\s+(\d+)\s*"/);
    if (!box || box[1] !== box[2]) throw new Error(`${src}: kan ikke læse antallet af felter (viewBox)`);
    qr[src] = Number(box[1]);
  }
  return { team, qr };
}

/** De otte fag-fliser som SVG, tegnet ud fra appens egne tegninger, så de altid passer til appen. */
function writeTradeTiles() {
  const lib = path.join(APP, 'scripts/lib/trade-art.js');
  if (!fs.existsSync(lib)) return;
  const { tradeArt } = require(lib);
  const { tile, colors } = tradeArt(APP);
  const out = path.join(DIR, 'assets/fag');
  fs.mkdirSync(out, { recursive: true });
  for (const id of Object.keys(colors)) fs.writeFileSync(path.join(out, `${id}.svg`), tile(id, { size: 64, radius: 0.25 }));
}

/**
 * Fælles Python-kode: en PDF-side som Form XObject. Chromium tegner nogle gradienter som mønstre
 * (patterns), og et mønster følger sidens grundkoordinater, ikke en flytning (cm) af indholdet.
 * Lægges siden i en Form XObject, følger mønstrene med, når den flyttes eller skaleres.
 */
const PY_FORM = `
from pypdf import PdfReader, PdfWriter, PageObject
from pypdf.generic import ArrayObject, DecodedStreamObject, DictionaryObject, FloatObject, NameObject, RectangleObject
pt = 72 / 25.4

def page_form(writer, page):
    contents = page['/Contents'].get_object()
    parts = contents if isinstance(contents, ArrayObject) else [contents]
    form = DecodedStreamObject()
    form.set_data(b'\\n'.join(part.get_object().get_data() for part in parts))
    form[NameObject('/Type')] = NameObject('/XObject')
    form[NameObject('/Subtype')] = NameObject('/Form')
    form[NameObject('/BBox')] = ArrayObject([FloatObject(float(v)) for v in page.cropbox])  # klipper til siden
    form[NameObject('/Resources')] = page['/Resources']
    return writer._add_object(form.clone(writer))

def draw_forms(writer, page, placed):
    # placed: [(form, [a, b, c, d, e, f])]; tegnes oven på det, siden allerede har.
    res = page.get('/Resources')
    res = res.get_object() if res is not None else DictionaryObject()
    xobjects = res.get('/XObject')
    xobjects = xobjects.get_object() if xobjects is not None else DictionaryObject()
    ops = []
    for form, matrix in placed:
        name = '/Fm%d' % len(xobjects)
        xobjects[NameObject(name)] = form
        ops.append('q %s cm %s Do Q' % (' '.join('%.6f' % v for v in matrix), name))
    res[NameObject('/XObject')] = xobjects
    page[NameObject('/Resources')] = res
    stream = DecodedStreamObject()
    stream.set_data(('\\n'.join(ops)).encode())
    old = page.get('/Contents')
    if old is None:
        page[NameObject('/Contents')] = writer._add_object(stream)
    else:
        old = old.get_object()
        parts = list(old) if isinstance(old, ArrayObject) else [page['/Contents']]
        page[NameObject('/Contents')] = ArrayObject(parts + [writer._add_object(stream)])
`;

let pythonCmd;
function python(script, args) {
  if (!pythonCmd) {
    pythonCmd = ['python3', 'python'].find((cmd) => spawnSync(cmd, ['-c', 'import pypdf'], { stdio: 'ignore' }).status === 0);
    if (!pythonCmd) throw new Error('python3 med pypdf mangler (pip install pypdf). Det skal til for at give PDF’erne den præcise størrelse.');
  }
  return execFileSync(pythonCmd, ['-I', '-c', script, ...args], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 }).toString();
}

async function openPage(browser, data, url) {
  const page = await browser.newPage();
  await page.addInitScript((value) => {
    window.PRINT_DATA = value;
  }, data);
  await page.emulateMedia({ media: 'print' });
  await page.goto(pathToFileURL(path.join(DIR, url.split('?')[0])).href + '?' + url.split('?')[1], { waitUntil: 'load' });
  await page.evaluate(() => window.printReady);
  const problems = await page.evaluate(() => {
    const fonts = ['900 20px "Schibsted Grotesk"', '800 20px "Schibsted Grotesk"', '700 20px "Schibsted Grotesk"', '500 20px Inter', '600 20px Inter', '700 20px Inter'];
    const missing = fonts.filter((font) => !document.fonts.check(font)).map((font) => `skriften ${font}`);
    const broken = [...document.images].filter((img) => !img.complete || !img.naturalWidth).map((img) => `billedet ${img.getAttribute('src')}`);
    return [...missing, ...broken];
  });
  if (problems.length) throw new Error(`${url}: ${problems.join(', ')} kunne ikke indlæses`);
  return page;
}

/**
 * Måler hver side i siden (i mm fra sidens øverste venstre hjørne): QR-kodernes hvide felt,
 * stilleområdet i antal felter, tekst for tæt på skærekanten og pladsholderne.
 */
function measure(page, { safe, qrModules }) {
  return page.evaluate(
    ({ safe, qrModules }) => {
      const px = 96 / 25.4;
      const placeholders = [...document.querySelectorAll('.ph')].map((el) => el.textContent.trim());
      const pages = [...document.querySelectorAll('.page')].map((pageEl, index) => {
        const origin = pageEl.getBoundingClientRect();
        const mm = (r) => ({ x: (r.left - origin.left) / px, y: (r.top - origin.top) / px, w: r.width / px, h: r.height / px });
        const trim = (pageEl.querySelector('[data-trim]') || pageEl).getBoundingClientRect();
        const tooClose = [];
        const check = (rect, what) => {
          if (!rect.width || !rect.height) return;
          const gap = Math.min(rect.left - trim.left, rect.top - trim.top, trim.right - rect.right, trim.bottom - rect.bottom) / px;
          if (gap < safe - 0.05) tooClose.push(`side ${index + 1}: "${what}" ${gap.toFixed(1)} mm fra skærekanten`);
        };
        const walker = document.createTreeWalker(pageEl, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          // Skærmbillederne og statuslinjen inde i telefonerne er et billede, ikke tekst på papiret.
          if (!node.textContent.trim() || node.parentElement.closest('.screen')) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) check(rect, node.textContent.trim().slice(0, 32));
        }
        const qr = [...pageEl.querySelectorAll('img.qr')].map((img) => {
          const src = img.getAttribute('src');
          const box = img.getBoundingClientRect();
          const card = img.parentElement.getBoundingClientRect();
          check(box, 'QR-kode');
          // Stilleområdet: hvid afstand fra koden til kortets kant (eller til teksten under koden).
          const next = img.nextElementSibling;
          let below = card.bottom - box.bottom;
          if (next && next.textContent.trim()) {
            const range = document.createRange();
            range.selectNodeContents(next);
            below = Math.min(below, range.getBoundingClientRect().top - box.bottom);
          }
          const module = box.width / qrModules[src];
          const quiet = Math.min(box.left - card.left, box.top - card.top, card.right - box.right, below) / module;
          return { src, rect: mm(card), size: box.width / px, quiet };
        });
        // Tekstblokke (data-block) må ikke overlappe, fx hvis navnene i bunden fylder flere linjer.
        const blocks = [...pageEl.querySelectorAll('[data-block]')].map((el) => ({ el, r: el.getBoundingClientRect() }));
        blocks.forEach((a, i) =>
          blocks.slice(i + 1).forEach((b) => {
            if (a.r.left < b.r.right && b.r.left < a.r.right && a.r.top < b.r.bottom && b.r.top < a.r.bottom) {
              const name = (x) => x.el.className || x.el.tagName.toLowerCase();
              tooClose.push(`side ${index + 1}: "${name(a)}" og "${name(b)}" overlapper`);
            }
          }),
        );
        return { tooClose, qr };
      });
      return { pages, placeholders };
    },
    { safe, qrModules },
  );
}

/**
 * Chromium runder PDF-sidens størrelse af (op til 0,5 pt), så HTML-filerne tegner siden 2 mm
 * for stor, og her beskæres PDF'en til den præcise størrelse fra øverste venstre hjørne, hvor
 * Chromium lægger indholdet. MediaBox = CropBox = BleedBox, og TrimBox ligger `bleed` mm inde.
 */
function cropPdf(file, [width, height], bleed, title) {
  python(
    `${PY_FORM}
import sys
src, w, h, b, title = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
w, h, b = w * pt, h * pt, b * pt
reader, writer = PdfReader(src), PdfWriter()
for source in reader.pages:
    form = page_form(writer, source)
    page = writer.add_blank_page(w, h)
    # Sidens øverste venstre hjørne bliver liggende; resten (de 2 mm ekstra) skæres væk.
    draw_forms(writer, page, [(form, [1, 0, 0, 1, -float(source.mediabox.left), h - float(source.mediabox.top)])])
    box = RectangleObject([0, 0, w, h])
    page.mediabox = box
    page.cropbox = box
    page.bleedbox = box
    page.trimbox = RectangleObject([b, b, w - b, h - b])
writer.add_metadata({'/Title': title, '/Author': 'Team FixMatch', '/Subject': 'Business Minds'})
writer.write(src)
`,
    [file, String(width), String(height), String(bleed), title],
  );
}

/** Sætter A5-siderne ind på arket med skæremærker (marks-PDF'en er bunden) og beder om 100 % tryk. */
function imposePdf(sheetJob, marksFile, sourceFile, outFile) {
  const spec = {
    marks: marksFile,
    source: sourceFile,
    out: outFile,
    title: sheetJob.title,
    duplex: sheetJob.duplex,
    // Hver A5-side med beskæring (154 × 216 mm) skaleres og flyttes, så skærekanten lander på slot.x/y.
    slots: sheetJob.slots.map(({ x, y, scale }) => ({ x: x - 3 * scale, y: y - 3 * scale, h: 216 * scale, scale })),
  };
  python(
    `${PY_FORM}
import json, sys
spec = json.loads(sys.argv[1])
marks, source = PdfReader(spec['marks']), PdfReader(spec['source'])
writer = PdfWriter()
for index, base in enumerate(marks.pages):
    page = writer.add_page(base)
    height = float(page.mediabox.height)
    form = page_form(writer, source.pages[index])  # klippes til A5-sidens beskæring (BBox)
    draw_forms(writer, page, [
        (form, [slot['scale'], 0, 0, slot['scale'], slot['x'] * pt, height - (slot['y'] + slot['h']) * pt])
        for slot in spec['slots']
    ])
    page.trimbox = page.mediabox
    page.bleedbox = page.mediabox
prefs = writer.create_viewer_preferences()
prefs.print_scaling = NameObject('/None')
prefs.duplex = NameObject(spec['duplex'])
writer.add_metadata({'/Title': spec['title'], '/Author': 'Team FixMatch', '/Subject': 'Business Minds'})
writer.write(spec['out'])
`,
    [JSON.stringify(spec)],
  );
}

/** Sider, størrelser, TrimBox og skrifter i hver PDF, læst med pypdf. */
function inspectPdfs(files) {
  return JSON.parse(
    python(
      `
import json, sys
from pypdf import PdfReader
out = {}
for file in sys.argv[1:]:
    r = PdfReader(file)
    pages, fonts = [], {}
    def walk(res):
        if not res: return
        res = res.get_object()
        for f in (res.get('/Font') or {}).values():
            f = f.get_object()
            d = f.get('/FontDescriptor')
            if d is None and '/DescendantFonts' in f:
                d = f['/DescendantFonts'][0].get_object().get('/FontDescriptor')
            d = d.get_object() if d is not None else {}
            name = str(f.get('/BaseFont')).split('+')[-1]
            fonts[name] = fonts.get(name, True) and (any(k in d for k in ('/FontFile', '/FontFile2', '/FontFile3')) or f.get('/Subtype') == '/Type3')
        for x in (res.get('/XObject') or {}).values():
            x = x.get_object()
            if x.get('/Subtype') == '/Form': walk(x.get('/Resources'))
    mm = lambda v: round(float(v) * 25.4 / 72, 2)
    for p in r.pages:
        m, t = p.mediabox, p.trimbox
        pages.append({'size': [mm(m.width), mm(m.height)], 'trim': [mm(t.left - m.left), mm(t.bottom - m.bottom), mm(t.width), mm(t.height)]})
        walk(p.get('/Resources'))
    prefs = r.trailer['/Root'].get('/ViewerPreferences')
    prefs = {str(k): str(v) for k, v in prefs.get_object().items()} if prefs else {}
    out[file] = {'pages': pages, 'fonts': fonts, 'prefs': prefs}
print(json.dumps(out))
`,
      files,
    ),
  );
}

/* ---------- Tjek af de færdige PDF'er (kræver pdftoppm) ---------- */

const hasPdftoppm = spawnSync('pdftoppm', ['-v'], { stdio: 'ignore' }).status === 0;

/** Én side af en PDF som RGB-pixels (pdftoppm, PPM-format). */
function rasterize(file, pageNo, dpi) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fixmatch-tryk-'));
  try {
    const base = path.join(tmp, 'page');
    execFileSync('pdftoppm', ['-r', String(dpi), '-f', String(pageNo), '-l', String(pageNo), '-singlefile', file, base]);
    const buf = fs.readFileSync(`${base}.ppm`);
    const header = buf.toString('latin1', 0, 64).match(/^P6\s+(\d+)\s+(\d+)\s+(\d+)\s/);
    if (!header) throw new Error(`${file}: uventet billedformat fra pdftoppm`);
    return { width: Number(header[1]), height: Number(header[2]), data: buf.subarray(header[0].length), dpi };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * En tryksag må ikke have en hel hvid række eller søjle inden for sin beskæring. Det fanger fx en
 * side, der er skåret af i PDF'en, så papiret bliver hvidt. Returnerer hvor (i mm) eller null.
 */
function findWhiteGap(img, rect) {
  const k = img.dpi / 25.4;
  const x0 = Math.ceil(rect.x * k) + 1;
  const y0 = Math.ceil(rect.y * k) + 1;
  const x1 = Math.min(img.width, Math.floor((rect.x + rect.w) * k)) - 1;
  const y1 = Math.min(img.height, Math.floor((rect.y + rect.h) * k)) - 1;
  const white = (x, y) => {
    const i = (y * img.width + x) * 3;
    return img.data[i] >= 250 && img.data[i + 1] >= 250 && img.data[i + 2] >= 250;
  };
  for (let y = y0; y < y1; y++) {
    let all = true;
    for (let x = x0; x < x1 && all; x++) all = white(x, y);
    if (all) return `hvid vandret stribe ${(y / k).toFixed(1)} mm fra toppen`;
  }
  for (let x = x0; x < x1; x++) {
    let all = true;
    for (let y = y0; y < y1 && all; y++) all = white(x, y);
    if (all) return `hvid lodret stribe ${(x / k).toFixed(1)} mm fra venstre`;
  }
  return null;
}

/** Afkoder QR-koden i et udsnit (mm) af siden. */
function decodeQr(jsQR, img, rect) {
  const k = img.dpi / 25.4;
  const pad = 2; // mm uden om det hvide felt
  const x0 = Math.max(0, Math.floor((rect.x - pad) * k));
  const y0 = Math.max(0, Math.floor((rect.y - pad) * k));
  const x1 = Math.min(img.width, Math.ceil((rect.x + rect.w + pad) * k));
  const y1 = Math.min(img.height, Math.ceil((rect.y + rect.h + pad) * k));
  const w = x1 - x0;
  const h = y1 - y0;
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = ((y0 + y) * img.width + x0 + x) * 3;
      const d = (y * w + x) * 4;
      rgba[d] = img.data[s];
      rgba[d + 1] = img.data[s + 1];
      rgba[d + 2] = img.data[s + 2];
      rgba[d + 3] = 255;
    }
  }
  const found = jsQR(rgba, w, h);
  return found ? found.data : null;
}

/** Forhåndsvisning af én PDF-side som PNG, lavet af den færdige PDF (det, der bliver trykt). */
function previewPng(file, pageNo, outFile, { dpi, height }) {
  const base = outFile.replace(/\.png$/, '');
  const size = height ? ['-scale-to-y', String(height), '-scale-to-x', '-1'] : ['-r', String(dpi)];
  execFileSync('pdftoppm', ['-png', ...size, '-f', String(pageNo), '-l', String(pageNo), '-singlefile', file, base]);
}

/* ------------------------------------------------------------------------------------------ */

async function renderJob(browser, data, job) {
  const page = await openPage(browser, data, job.url);
  const layout = await measure(page, { safe: job.safe, qrModules: data.qr });
  const file = path.join(PDF_DIR, job.file);
  await page.pdf({ path: file, printBackground: true, preferCSSPageSize: true });
  await page.close();
  cropPdf(file, job.size, job.bleed, job.title);
  return { ...job, path: file, layout };
}

async function renderSheet(browser, data, sheet, source) {
  const marks = { sheet: sheet.sheet, slots: sheet.slots, notes: sheet.notes, noteAt: sheet.noteAt, mark: MARK, size: [148, 210], bleed: 3 };
  const page = await openPage(browser, { ...data, marks }, 'flyer.html?mode=marks');
  const tmp = path.join(os.tmpdir(), `fixmatch-marks-${process.pid}-${path.basename(sheet.file)}`);
  await page.pdf({ path: tmp, printBackground: true, preferCSSPageSize: true });
  await page.close();
  cropPdf(tmp, sheet.sheet, 0, sheet.title);
  const file = path.join(PDF_DIR, sheet.file);
  try {
    imposePdf(sheet, tmp, source.path, file);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
  // Hvor flyerne og QR-koderne ligger på arket (mm), ud fra målene på A5-siden med beskæring.
  const pages = source.layout.pages.map((sourcePage) => ({
    art: sheet.slots.map(({ x, y, scale }) => ({ x: x - 3 * scale, y: y - 3 * scale, w: 154 * scale, h: 216 * scale })),
    qr: sheet.slots.flatMap(({ x, y, scale }) =>
      sourcePage.qr.map((code) => ({
        ...code,
        size: code.size * scale,
        rect: { x: x - 3 * scale + code.rect.x * scale, y: y - 3 * scale + code.rect.y * scale, w: code.rect.w * scale, h: code.rect.h * scale },
      })),
    ),
  }));
  return { ...sheet, path: file, pages: sheet.notes.length, sheetLayout: pages };
}

(async () => {
  const only = process.argv[2];
  if (only && !['plakat', 'flyer'].includes(only)) throw new Error(`Ukendt valg "${only}" (brug plakat eller flyer)`);
  const data = readData();
  writeTradeTiles();
  fs.mkdirSync(PDF_DIR, { recursive: true });
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });

  const built = [];
  const placeholders = new Set();
  const browser = await chromium.launch();
  try {
    if (only !== 'flyer') {
      for (const job of POSTERS) built.push(await renderJob(browser, data, job));
    }
    if (only !== 'plakat') {
      const bleed = await renderJob(browser, data, FLYER_BLEED);
      built.push(bleed, await renderJob(browser, data, FLYER_TRIM));
      for (const sheet of SHEETS) built.push(await renderSheet(browser, data, sheet, bleed));
    }
  } finally {
    await browser.close();
  }

  let failed = false;
  const fail = (message) => {
    failed = true;
    console.log(`  ✗ ${message}`);
  };
  const info = inspectPdfs(built.map((job) => job.path));
  const jsQR = optional('jsqr');
  const raster = hasPdftoppm;

  for (const job of built) {
    const pdf = info[job.path];
    const [w, h] = job.size || job.sheet;
    const sizeOk = pdf.pages.length === job.pages && pdf.pages.every((p) => Math.abs(p.size[0] - w) < 0.02 && Math.abs(p.size[1] - h) < 0.02);
    const b = job.bleed || 0;
    const trimOk = pdf.pages.every((p) => Math.abs(p.trim[0] - b) < 0.02 && Math.abs(p.trim[2] - (w - 2 * b)) < 0.02);
    const fonts = Object.keys(pdf.fonts);
    const notEmbedded = fonts.filter((name) => !pdf.fonts[name]);
    console.log(`${job.file}`);
    if (!sizeOk) fail(`sidestørrelse: ${pdf.pages.map((p) => p.size.join(' × ')).join(', ')} mm (skulle være ${job.pages} × ${w} × ${h} mm)`);
    else console.log(`  ✓ ${pdf.pages.length} ${pdf.pages.length === 1 ? 'side' : 'sider'} à ${w} × ${h} mm${b ? `, TrimBox ${w - 2 * b} × ${h - 2 * b} mm` : ''}`);
    if (!trimOk) fail('TrimBox er forkert');
    if (notEmbedded.length) fail(`skrifter ikke indlejret: ${notEmbedded.join(', ')}`);
    else console.log(`  ✓ ${fonts.length} skrifter indlejret: ${fonts.join(', ')}`);
    if (job.duplex) {
      const ok = pdf.prefs['/PrintScaling'] === '/None' && pdf.prefs['/Duplex'] === job.duplex;
      if (!ok) fail(`udskriftsindstillinger mangler (${JSON.stringify(pdf.prefs)})`);
      else console.log(`  ✓ udskriv i 100 % og ${job.duplex === '/DuplexFlipShortEdge' ? 'vend på den korte kant' : 'vend på den lange kant'} er sat i PDF'en`);
    }

    // Sidernes indhold: QR-koder, afstand til kanten og hvide huller.
    const pages = job.layout ? job.layout.pages.map((p) => ({ ...p, art: [{ x: 0, y: 0, w, h }] })) : job.sheetLayout;
    if (job.layout) {
      job.layout.placeholders.forEach((ph) => placeholders.add(ph));
      const close = job.layout.pages.flatMap((p) => p.tooClose);
      if (close.length) close.forEach((line) => fail(line.includes('overlapper') ? line : `for tæt på skærekanten (mindst ${job.safe} mm): ${line}`));
      else console.log(`  ✓ al tekst og QR-koderne ligger mindst ${job.safe} mm inden for skærekanten, og intet overlapper`);
    }
    const codes = pages.flatMap((p) => p.qr);
    const thin = codes.filter((code) => code.quiet < QUIET_MODULES - 0.02);
    if (thin.length) thin.forEach((code) => fail(`${code.src}: stilleområde ${code.quiet.toFixed(2)} felter (mindst ${QUIET_MODULES})`));
    else
      console.log(
        `  ✓ QR-koder: ${[...new Set(codes.map((c) => `${c.size.toFixed(1)} mm`))].join(' og ')}, stilleområde mindst ${Math.min(...codes.map((c) => c.quiet)).toFixed(2)} felter`,
      );

    if (raster) {
      const decoded = [];
      for (let i = 0; i < pages.length; i++) {
        const img = rasterize(job.path, i + 1, job.rasterDpi);
        for (const rect of pages[i].art) {
          const gap = findWhiteGap(img, rect);
          if (gap) fail(`side ${i + 1}: ${gap} – en del af tryksagen mangler i PDF'en`);
        }
        if (jsQR)
          for (const code of pages[i].qr) {
            const read = decodeQr(jsQR, img, code.rect);
            if (read !== QR_CODES[code.src]) fail(`side ${i + 1}: QR-koden ${code.src} læste ${read ?? 'ingenting'} (ventede ${QR_CODES[code.src]})`);
            else decoded.push(read);
          }
      }
      console.log(`  ✓ ingen hvide huller i tryksagen (tjekket i PDF'en ved ${job.rasterDpi} dpi)`);
      if (jsQR && decoded.length === codes.length) console.log(`  ✓ alle ${decoded.length} QR-koder kan læses fra PDF'en ved ${job.rasterDpi} dpi`);

      // Forhåndsvisninger, lavet af den færdige PDF.
      if (job.preview) previewPng(job.path, 1, path.join(PREVIEW_DIR, job.preview), { height: job.previewHeight });
      for (const p of job.previews || []) previewPng(job.path, p.page, path.join(PREVIEW_DIR, p.file), { dpi: p.dpi });
    }
  }

  if (!raster) console.log('\n! pdftoppm mangler (poppler): forhåndsvisningerne i preview/ er IKKE opdateret, og PDF’erne er ikke tjekket for hvide huller eller QR-koder.');
  else if (!jsQR) console.log('\n! QR-koderne er ikke afkodet (npm-pakken jsqr mangler; kør med NODE_PATH til en mappe med den). Scan dem med en telefon.');
  else console.log(`\n✓ Forhåndsvisninger i preview/ er lavet ud fra PDF’erne.`);

  if (placeholders.size) {
    console.log(`\nUdfyld i ../team.json, før I trykker (${placeholders.size} forskellige pladsholdere): ${[...placeholders].join(', ')}`);
  }
  if (only !== 'plakat' && !('kontakt' in data.team)) {
    console.log('team.json mangler "kontakt" (flyerens kontaktlinje). Tilføj fx: "kontakt": "Navn · 12 34 56 78 · navn@skole.dk"');
  }
  if (failed) {
    console.log('\n✗ Der er fejl (se ✗ ovenfor). Ret dem, før I trykker.');
    process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
