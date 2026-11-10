#!/usr/bin/env node
/**
 * Builds the Business Minds report as ONE PDF: the cover without a page number, then the
 * report with pages numbered from 1 (page 1 = the table of contents), as the formalia require.
 *
 *   node docs/business-minds/build-pdf.js   → docs/business-minds/FixMatch-Business-Minds-rapport.pdf
 *
 * Needs Playwright (Chromium) and Python with pypdf.
 */
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DIR = __dirname;
const OUT = path.join(DIR, 'FixMatch-Business-Minds-rapport.pdf');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-'));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pdf = async (file, out, numbered) => {
    await page.goto('file://' + path.join(DIR, file), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({
      path: out,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: numbered,
      headerTemplate: '<span></span>',
      footerTemplate: numbered
        ? '<div style="width:100%;font-size:10pt;font-family:Inter,sans-serif;color:#5E574C;text-align:center;"><span class="pageNumber"></span></div>'
        : '<span></span>',
    });
  };
  // The cover's names come from team.json, so they are easy to change.
  const team = JSON.parse(fs.readFileSync(path.join(DIR, 'team.json'), 'utf8'));
  const cover = fs.readFileSync(path.join(DIR, 'forside.html'), 'utf8').replace(/\{\{(\w+)\}\}/g, (_, key) => team[key] ?? '');
  const filled = path.join(DIR, '.forside.filled.html');
  fs.writeFileSync(filled, cover);
  await pdf('.forside.filled.html', path.join(tmp, 'cover.pdf'), false);
  fs.rmSync(filled);
  // Two passes: render, find the page of each heading, write the numbers in the table of contents, render again.
  const source = fs.readFileSync(path.join(DIR, 'rapport.html'), 'utf8');
  const body = path.join(DIR, '.rapport.filled.html');
  const finds = [...source.matchAll(/data-find="([^"]+)"/g)].map((m) => m[1]);
  let numbers = finds.map(() => '');
  for (let pass = 0; pass < 2; pass++) {
    let i = 0;
    fs.writeFileSync(body, source.replace(/\{\{p\}\}/g, () => numbers[i++]));
    await pdf('.rapport.filled.html', path.join(tmp, 'body.pdf'), true);
    const pages = JSON.parse(
      execFileSync('python3', [
        '-I',
        '-c',
        'import sys,json,re;from pypdf import PdfReader;print(json.dumps([re.sub(r"\\s+","",p.extract_text() or "") for p in PdfReader(sys.argv[1]).pages]))',
        path.join(tmp, 'body.pdf'),
      ]).toString(),
    );
    numbers = finds.map((find, index) => {
      const key = find.replace(/\s+/g, '');
      // The table of contents is page 1; headings are looked for after it (the summary is on page 1).
      const at = index === 0 ? 0 : pages.findIndex((text, page) => page > 0 && text.includes(key));
      if (at < 0) throw new Error(`Fandt ikke overskriften "${find}" i PDF'en`);
      return String(at + 1);
    });
  }
  fs.rmSync(body);
  await browser.close();
  execFileSync('python3', [
    '-I',
    '-c',
    `import sys
from pypdf import PdfWriter, PdfReader
w = PdfWriter()
for f in sys.argv[1:3]:
    for p in PdfReader(f).pages: w.add_page(p)
w.add_metadata({"/Title": "FixMatch – rapport til Business Minds", "/Author": "Team FixMatch"})
w.write(sys.argv[3])
print(len(PdfReader(sys.argv[2]).pages))`,
    path.join(tmp, 'cover.pdf'),
    path.join(tmp, 'body.pdf'),
    OUT,
  ]);
  const pages = Number(
    execFileSync('python3', ['-I', '-c', 'import sys;from pypdf import PdfReader;print(len(PdfReader(sys.argv[1]).pages))', path.join(tmp, 'body.pdf')]).toString(),
  );
  console.log(`${path.relative(process.cwd(), OUT)}: forside + ${pages} nummererede sider`);
  if (pages > 10) {
    console.error(`For mange sider: ${pages}. Højst 10 efter forsiden (formalia pkt. 5).`);
    process.exitCode = 1;
  }
})();
