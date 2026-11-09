/**
 * The Naborabat page (website/naborabat.md and neighbours.en.md, where {{group}} stands).
 * The invite a neighbour sends from the app links here with the group's code
 * (/naborabat/?kode=ABC123). The page shows the group from the app's public view
 * open_group_jobs (the job, the street and how many are in, never who) and opens the app
 * on the group with fixmatch://faelles?kode=…, where the neighbour joins.
 */
const { readGroupDiscount, readJobs, readNumber } = require('./app-data');
const { readSupabase } = require('./signup-form');

const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TEXT = {
  da: {
    locale: 'da-DK',
    label: 'Har du fået en kode af en nabo?',
    show: 'Se gruppen',
    loading: 'Henter gruppen …',
    notFound: 'Der er ingen åben gruppe med den kode. Tjek koden hos den nabo, der sendte den. Den er på 6 tegn.',
    offline: 'Gruppen kan ikke hentes lige nu. Åbn FixMatch, og skriv koden under Naborabat.',
    error: 'Gruppen blev ikke hentet. Tjek internettet, og prøv igen.',
    members: ['husstand er med', 'husstande er med'],
    missing: ['Mangler {n} for at få rabat', 'Mangler {n} for at få rabat'],
    enough: 'I er nok til at få rabat',
    sent: 'Gruppen har allerede sendt forespørgslen til en virksomhed, så der kan ikke komme flere med.',
    period: 'Gerne mellem {from} og {to}',
    open: 'Åbn i FixMatch og deltag',
    code: 'Koden er {code}',
    noApp: 'Har du ikke FixMatch? Appen kommer snart til iPhone. Gem koden, så kan du deltage, når du har den.',
    invalid: 'Koden er 6 bogstaver og tal, fx ABC123.',
  },
  en: {
    locale: 'en-GB',
    label: 'Did a neighbour give you a code?',
    show: 'See the group',
    loading: 'Fetching the group …',
    notFound:
      'There is no open group with that code. Check the code with the neighbour who sent it. It has 6 characters.',
    offline: 'The group cannot be fetched right now. Open FixMatch, and enter the code under Neighbour discount.',
    error: 'The group could not be fetched. Check your internet connection, and try again.',
    members: ['household has joined', 'households have joined'],
    missing: ['{n} more needed for the discount', '{n} more needed for the discount'],
    enough: 'Enough of you for a discount',
    sent: 'The group has already sent its request to a business, so nobody else can join.',
    period: 'Ideally between {from} and {to}',
    open: 'Open in FixMatch and join',
    code: 'The code is {code}',
    noApp: 'No FixMatch yet? The app is coming soon to iPhone. Keep the code, and join when you have it.',
    invalid: 'The code has 6 letters and numbers, e.g. ABC123.',
  },
};

function groupPage(lang, { root }) {
  const text = TEXT[lang];
  const trades = readJobs(root);
  // Only the names the page needs: trade id → job id → name in this language.
  const jobs = Object.fromEntries(
    Object.entries(trades).map(([id, trade]) => [
      id,
      {
        name: trade.name[lang],
        jobs: Object.fromEntries(Object.entries(trade.jobs).map(([job, n]) => [job, n[lang]])),
      },
    ]),
  );
  const config = {
    supabase: readSupabase(root),
    text,
    jobs,
    minGroup: readNumber(root, 'src/state/groups.ts', 'MIN_GROUP'),
    discount: readGroupDiscount(root),
  };
  return `<div id="group" class="group">
<form class="code-form" data-form novalidate>
<label for="group-code">${escape(text.label)}</label>
<div class="code-row">
<input id="group-code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="6" placeholder="ABC123" inputmode="text">
<button type="submit">${escape(text.show)}</button>
</div>
</form>
<p class="status" role="status" aria-live="polite"></p>
<article class="group-card" data-card hidden>
<p class="group-area" data-area></p>
<h2 data-job></h2>
<ul class="group-facts">
<li data-members></li>
<li data-progress></li>
<li data-period></li>
</ul>
<p class="group-note" data-note hidden></p>
<p class="group-sent" data-sent hidden></p>
<a class="group-open" data-open href="#">${escape(text.open)}</a>
<p class="group-code" data-code></p>
<p class="group-hint">${escape(text.noApp)}</p>
</article>
</div>
<script>
(() => {
  const config = ${JSON.stringify(config).replace(/</g, '\\u003c')};
  const t = config.text;
  const root = document.getElementById('group');
  const form = root.querySelector('[data-form]');
  const input = form.elements.code;
  const status = root.querySelector('.status');
  const card = root.querySelector('[data-card]');
  const field = (name) => root.querySelector('[data-' + name + ']');
  const fill = (template, values) => template.replace(/\\{(\\w+)\\}/g, (_, key) => values[key]);
  const say = (message, error) => {
    status.textContent = message || '';
    status.classList.toggle('error', Boolean(error));
  };
  const date = (iso) =>
    new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));

  const show = (group) => {
    const trade = config.jobs[group.category];
    field('area').textContent = group.area + ', ' + group.postal_code;
    field('job').textContent = (trade && trade.jobs[group.job]) || (trade && trade.name) || group.job;
    field('members').textContent = group.members + ' ' + t.members[group.members === 1 ? 0 : 1];
    const missing = config.minGroup - group.members;
    field('progress').textContent =
      missing > 0 ? fill(t.missing[missing === 1 ? 0 : 1], { n: missing }) : t.enough + ' (' + config.discount.min + '–' + config.discount.max + ' %)';
    field('period').textContent = fill(t.period, { from: date(group.wanted_from), to: date(group.wanted_to) });
    field('note').textContent = group.note || '';
    field('note').hidden = !group.note;
    field('sent').textContent = t.sent;
    field('sent').hidden = group.status !== 'sent';
    const open = field('open');
    open.href = 'fixmatch://faelles?kode=' + encodeURIComponent(group.code);
    open.hidden = group.status !== 'open';
    field('code').textContent = fill(t.code, { code: group.code });
    card.hidden = false;
    say('');
  };

  const load = async (code) => {
    card.hidden = true;
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      say(t.invalid, true);
      return;
    }
    const url = new URL(location.href);
    url.search = '?' + (document.documentElement.lang === 'da' ? 'kode' : 'code') + '=' + code;
    history.replaceState(null, '', url);
    if (!config.supabase) {
      say(t.offline, true);
      return;
    }
    say(t.loading);
    try {
      const response = await fetch(
        config.supabase.url + '/rest/v1/open_group_jobs?select=code,area,postal_code,category,job,note,wanted_from,wanted_to,status,members&code=eq.' + code,
        { headers: { apikey: config.supabase.key } },
      );
      if (!response.ok) throw new Error(String(response.status));
      const rows = await response.json();
      if (!rows.length) say(t.notFound, true);
      else show(rows[0]);
    } catch {
      say(t.error, true);
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    load(input.value.trim().toUpperCase());
  });
  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  });
  const params = new URLSearchParams(location.search);
  const code = (params.get('kode') || params.get('code') || '').trim().toUpperCase();
  if (code) {
    input.value = code;
    load(code);
  }
})();
</script>`;
}

const GROUP_STYLE = `
.group { margin: 24px 0; }
.code-form label { display: block; font-weight: 600; margin-bottom: 8px; }
.code-row { display: flex; gap: 10px; }
.code-row input { flex: 1; min-width: 0; min-height: 48px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font: inherit; font-size: 20px; letter-spacing: 0.2em; text-transform: uppercase; }
.code-row button, .group-open { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 20px; border: 0; border-radius: 999px; background: var(--brand-strong); color: #F4F1EA; font: inherit; font-weight: 600; text-decoration: none; cursor: pointer; }
.group .status { min-height: 1.6em; color: var(--muted); }
.group .status.error { color: var(--danger); }
.group-card { margin-top: 8px; padding: 22px; border-radius: 18px; border: 1px solid var(--border); background: var(--bg); }
.group-card[hidden], .group-open[hidden], .group-note[hidden], .group-sent[hidden] { display: none; }
.group-area { margin: 0; color: var(--muted); font-size: 15px; }
.group-card h2 { margin: 4px 0 12px; }
.group-facts { list-style: none; padding: 0; margin: 0 0 16px; }
.group-facts li { margin: 4px 0; }
.group-note { font-style: italic; }
.group-code { margin: 14px 0 0; font-weight: 600; letter-spacing: 0.04em; }
.group-hint { margin: 4px 0 0; color: var(--muted); font-size: 15px; }
`;

module.exports = { groupPage, GROUP_STYLE };
