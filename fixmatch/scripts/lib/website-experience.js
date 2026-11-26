/**
 * The project planner on the website's front page ("Opgaveguide"): choose a trade and a job,
 * add a postcode, timing and a few words, and get a short project brief to copy or download
 * and send to a business yourself. Nothing is sent anywhere; a draft is only kept in the
 * browser (localStorage) when the visitor taps "Gem kladde".
 *
 * The trades and jobs are read from the app's src/data/categories.ts, like the price guide.
 * Links to `#opgave` with `data-trade="<id>"` (the price guide's) open the planner with that
 * trade chosen. The map's filter chips also carry data-trade, so the selector needs the href.
 */
const { readJobs } = require('./app-data');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The id of the planner section, used by the hero button and the price guide's links. */
const PLANNER_ID = 'opgave';

function planner(lang, root) {
  const da = lang === 'da';
  const pick = (a, b) => (da ? a : b);
  const jobs = readJobs(root);
  const t = {
    trade: pick('Fag', 'Trade'),
    job: pick('Opgave', 'Job'),
    place: pick('Postnummer', 'Postcode'),
    timing: pick('Tidspunkt', 'Timing'),
    details: pick('Beskrivelse', 'Description'),
    title: pick('Min opgave · FixMatch', 'My project · FixMatch'),
    checklist: pick(
      'Bed om en samlet pris med materialer, kørsel og moms. Aftal omfang, tidspunkt og eventuelle ekstraarbejder skriftligt.',
      'Ask for a total price including materials, travel and VAT. Agree the scope, timing and any extra work in writing.',
    ),
    copied: pick('Opgaven er kopieret.', 'Project copied.'),
    copyError: pick('Kunne ikke kopiere. Brug Hent opgave i stedet.', 'Could not copy. Use Download project instead.'),
    saved: pick('Kladde gemt på denne enhed.', 'Draft saved on this device.'),
    unsaved: pick(
      'Browseren kunne ikke gemme kladden. Du kan stadig hente opgaven.',
      'Your browser could not save the draft. You can still download the project.',
    ),
    cleared: pick('Kladden er slettet.', 'Draft cleared.'),
    ready: pick(
      'Din opgave er klar. Kopiér eller hent den, og send den selv til en virksomhed.',
      'Your project is ready. Copy or download it and send it to a business yourself.',
    ),
    file: pick('fixmatch-opgave.txt', 'fixmatch-project.txt'),
  };
  const timings = da
    ? ['Jeg er fleksibel', 'Så snart som muligt', 'Inden for en måned', 'Jeg planlægger frem i tiden']
    : ['I’m flexible', 'As soon as possible', 'Within a month', 'I’m planning ahead'];

  const html = `<section class="planner" id="${PLANNER_ID}" aria-labelledby="planner-title">
<div class="planner-intro">
<p class="eyebrow">${pick('Opgaveguide', 'Project planner')}</p>
<h2 id="planner-title">${pick('Hvad skal du<br>have fikset?', 'What needs<br>fixing?')}</h2>
<p class="lead">${pick('Saml det vigtigste om din opgave på et øjeblik. Så er du klar til at spørge om en pris.', 'Put the essentials of your project together. Then you’re ready to ask for a quote.')}</p>
<p class="planner-note">${pick('Du sender ikke noget her. Din kladde gemmes kun i denne browser, hvis du trykker Gem kladde.', 'Nothing is sent from here. Your draft is only kept in this browser if you tap Save draft.')}</p>
<a class="planner-link" href="${da ? 'naborabat/' : 'neighbours/'}">${pick('Samme opgave som naboen? Se Naborabat', 'Same job as your neighbour? See group discounts')} ↗</a>
</div>
<div class="planner-work">
<form id="project-form">
<div class="planner-fields">
<label>${t.trade}<select name="trade">${Object.entries(jobs)
    .map(([id, trade]) => `<option value="${id}">${esc(trade.name[lang])}</option>`)
    .join('')}</select></label>
<label>${t.job}<select name="job"></select></label>
<label>${t.place}<input name="postcode" autocomplete="postal-code" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required placeholder="${pick('Fx 8000', 'E.g. 8000')}"><small>${pick('Danmark · 4 cifre', 'Denmark · 4 digits')}</small></label>
<label>${t.timing}<select name="timing">${timings.map((label) => `<option>${esc(label)}</option>`).join('')}</select></label>
<label class="full">${pick('Fortæl lidt mere', 'Tell us a little more')}<textarea name="details" rows="3" maxlength="2000" placeholder="${pick('Fx hvad der skal laves, mål og adgangsforhold …', 'E.g. what needs doing, measurements and access …')}"></textarea></label>
</div>
<div class="planner-actions">
<button class="button sun" type="submit">${pick('Lav min opgavebeskrivelse', 'Create my project brief')}</button>
<button type="button" class="text-button" id="save-project">${pick('Gem kladde', 'Save draft')}</button>
<button type="button" class="text-button" id="clear-project">${pick('Ryd', 'Clear')}</button>
</div>
</form>
<p role="status" id="project-status"></p>
<div id="project-result" hidden>
<h3 tabindex="-1" id="result-heading">${pick('Klar til den første samtale.', 'Ready for the first conversation.')}</h3>
<pre id="project-brief"></pre>
<div class="planner-actions">
<button type="button" class="button outline" id="copy-project">${pick('Kopiér opgave', 'Copy project')}</button>
<button type="button" class="text-button" id="download-project">${pick('Hent opgave (.txt)', 'Download project (.txt)')}</button>
</div>
</div>
<noscript><p>${pick('Slå JavaScript til for at bruge opgaveguiden.', 'Turn on JavaScript to use the project planner.')}</p></noscript>
</div>
</section>`;

  const script = `<script>(() => {
const jobs = ${JSON.stringify(jobs).replace(/</g, '\\u003c')};
const t = ${JSON.stringify(t).replace(/</g, '\\u003c')};
const lang = ${JSON.stringify(lang)};
const form = document.getElementById('project-form');
if (!form) return;
const trade = form.elements.trade, job = form.elements.job;
const status = document.getElementById('project-status');
const result = document.getElementById('project-result');
const brief = document.getElementById('project-brief');
const key = 'fixmatch-project-' + lang;
function updateJobs() {
  job.replaceChildren(...Object.entries(jobs[trade.value].jobs).map(([id, label]) => new Option(label[lang], id)));
  result.hidden = true;
}
updateJobs();
try {
  const draft = JSON.parse(localStorage.getItem(key) || 'null');
  if (draft && jobs[draft.trade]) {
    trade.value = draft.trade;
    updateJobs();
    for (const name of ['job', 'postcode', 'timing', 'details']) if (typeof draft[name] === 'string') form.elements[name].value = draft[name];
  }
} catch { /* Storage is optional. */ }
trade.addEventListener('change', updateJobs);
form.addEventListener('input', () => { result.hidden = true; status.textContent = ''; });
document.querySelectorAll('a[href="#${PLANNER_ID}"][data-trade]').forEach((link) => link.addEventListener('click', () => {
  if (!jobs[link.dataset.trade]) return;
  trade.value = link.dataset.trade;
  updateJobs();
  trade.focus({ preventScroll: true });
}));
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = new FormData(form);
  brief.textContent = [
    t.title, '',
    t.trade + ': ' + jobs[trade.value].name[lang],
    t.job + ': ' + jobs[trade.value].jobs[job.value][lang],
    t.place + ': ' + values.get('postcode'),
    t.timing + ': ' + values.get('timing'), '',
    t.details + ':', String(values.get('details') || '').trim() || '—', '',
    t.checklist,
  ].join('\\n');
  result.hidden = false;
  status.textContent = t.ready;
  document.getElementById('result-heading').focus();
});
document.getElementById('save-project').addEventListener('click', () => {
  try { localStorage.setItem(key, JSON.stringify(Object.fromEntries(new FormData(form)))); status.textContent = t.saved; }
  catch { status.textContent = t.unsaved; }
});
document.getElementById('clear-project').addEventListener('click', () => {
  form.reset();
  updateJobs();
  try { localStorage.removeItem(key); status.textContent = t.cleared; } catch { status.textContent = t.unsaved; }
});
document.getElementById('copy-project').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(brief.textContent); status.textContent = t.copied; }
  catch { status.textContent = t.copyError; }
});
document.getElementById('download-project').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([brief.textContent], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = t.file;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
})();</script>`;

  return { html, script };
}

const PLANNER_STYLE = `
html { scroll-behavior: smooth; scroll-padding-top: 24px; }
[hidden] { display: none !important; }
.hero-secondary { display: inline-block; color: var(--on-panel); font-weight: 600; padding: 12px 0; text-underline-offset: 4px; }
.guide-plan { display: inline-flex; gap: 6px; margin: 6px 0 14px; font-weight: 700; color: var(--brand-text); text-underline-offset: 4px; }
.planner { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: 56px; align-items: start; }
.planner-intro h2 { font-size: clamp(34px, 4.6vw, 56px); }
.planner-note { padding-left: 16px; border-left: 3px solid var(--brand); margin: 24px 0 !important; color: var(--muted); font-size: 15px; }
.planner-link { font-size: 15px; font-weight: 600; color: var(--brand-text); }
.planner-work { padding: 32px; border: 1px solid var(--border); border-radius: 24px; background: var(--surface); box-shadow: var(--shadow-card); }
.planner-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.planner-fields label { display: flex; flex-direction: column; gap: 8px; font-size: 15px; font-weight: 600; min-width: 0; }
.planner-fields .full { grid-column: 1 / -1; }
.planner-fields input, .planner-fields select, .planner-fields textarea { width: 100%; min-width: 0; min-height: 48px; padding: 12px; border: 1px solid var(--border); background: var(--surface-alt); color: var(--text); border-radius: 12px; font: inherit; font-size: 16px; }
.planner-fields textarea { resize: vertical; }
.planner-fields small { font-weight: 400; color: var(--muted); }
.planner-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin-top: 24px; }
.planner-actions .button { border: 0; cursor: pointer; }
.planner-actions .outline { color: var(--brand-text); background: var(--brand-soft); }
.text-button { border: 0; background: none; color: var(--brand-text); padding: 12px 0; font: inherit; font-size: 15px; font-weight: 600; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
#project-status { font-size: 15px; color: var(--brand-text); margin-top: 16px !important; min-height: 1.5em; }
#project-result { border-top: 1px solid var(--border); margin-top: 24px; padding-top: 24px; }
#project-brief { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; font-size: 15px; line-height: 1.7; color: var(--muted); margin: 12px 0 0; }
@media (max-width: 900px) { .planner { grid-template-columns: 1fr; gap: 28px; } }
@media (max-width: 640px) { .planner-work { padding: 22px 18px; } .planner-fields { grid-template-columns: 1fr; gap: 16px; } }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
`;

module.exports = { planner, PLANNER_ID, PLANNER_STYLE };
