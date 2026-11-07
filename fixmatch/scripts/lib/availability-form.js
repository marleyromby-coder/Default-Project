/**
 * "Hvem har tid i dag?" for businesses: a small page where a business taps "Ledig i dag".
 * Businesses have no login yet. Each gets a personal link with its id and key
 * (…/ledig/?id=fjordvand-vvs#kode=…), and the page remembers them on that phone.
 * The key goes to Supabase's set_availability function (supabase/migrations/…_availability.sql).
 */
const { readSupabase } = require('./signup-form');

const TEXT = {
  da: {
    id: 'Virksomhedens id',
    idHint: 'Står i linket, I har fået fra FixMatch.',
    key: 'Jeres kode',
    keyHint: 'Står også i linket. Del den ikke med andre.',
    question: 'Har I tid?',
    today: 'Ledig i dag',
    both: 'Ledig i dag og i morgen',
    tomorrow: 'Ledig i morgen',
    none: 'Ikke ledig',
    now: 'Lige nu i appen:',
    shownToday: 'Ledig i dag',
    shownTomorrow: 'Ledig i morgen',
    shownBoth: 'Ledig i dag og i morgen',
    shownNone: 'Ikke ledig',
    saving: 'Gemmer…',
    saved: 'Gemt. Kunderne kan se det i appen om få minutter.',
    wrong: 'Forkert id eller kode. Brug linket fra FixMatch, eller skriv til os.',
    error: 'Det blev ikke gemt. Tjek internettet, og prøv igen.',
    offline: 'Siden virker, når FixMatch er klar til rigtige virksomheder. Indtil da kan I skrive til os.',
    missing: 'Udfyld id og kode fra linket.',
  },
  en: {
    id: 'Business ID',
    idHint: 'It is in the link you got from FixMatch.',
    key: 'Your code',
    keyHint: 'It is also in the link. Do not share it.',
    question: 'Do you have time?',
    today: 'Free today',
    both: 'Free today and tomorrow',
    tomorrow: 'Free tomorrow',
    none: 'Not free',
    now: 'In the app right now:',
    shownToday: 'Free today',
    shownTomorrow: 'Free tomorrow',
    shownBoth: 'Free today and tomorrow',
    shownNone: 'Not free',
    saving: 'Saving…',
    saved: 'Saved. Customers see it in the app within a few minutes.',
    wrong: 'Wrong ID or code. Use the link from FixMatch, or write to us.',
    error: 'It was not saved. Check your internet connection and try again.',
    offline: 'This page works once FixMatch is ready for real businesses. Until then, write to us.',
    missing: 'Fill in the ID and code from the link.',
  },
};

const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const AVAILABILITY_STYLE = `
.free { display: grid; gap: 12px; margin-top: 24px; }
.free .choices { display: grid; gap: 10px; margin-top: 8px; }
.free .choices button { margin: 0; }
.free .choices button.secondary { color: var(--brand); background: transparent; border: 1px solid var(--border); }
.free .state { margin: 8px 0 0; font-weight: 600; }
.free .status { margin: 0; min-height: 1.4em; }
`;

/** The form and its script, for one language. */
function availabilityForm(lang, { root }) {
  const text = TEXT[lang];
  const supabase = readSupabase(root);
  const config = { supabase, text };
  const field = (label, input, hint) =>
    `<label class="field"><span>${escape(label)}</span>${input}<small>${escape(hint)}</small></label>`;
  const button = (days, label, secondary = false) =>
    `<button type="button" data-days="${days}"${secondary ? ' class="secondary"' : ''}>${escape(label)}</button>`;

  return `<form id="availability" class="signup free" novalidate>
${field(text.id, '<input name="business_id" required autocomplete="off" autocapitalize="none" spellcheck="false">', text.idHint)}
${field(text.key, '<input name="key" type="password" required autocomplete="off">', text.keyHint)}
<p class="state" data-state hidden></p>
<div class="field"><span>${escape(text.question)}</span><div class="choices">
${button('0', text.today)}
${button('0,1', text.both)}
${button('1', text.tomorrow)}
${button('', text.none, true)}
</div></div>
<p class="status" role="status" aria-live="polite"></p>
</form>
<script>
(() => {
  const config = ${JSON.stringify(config).replace(/</g, '\\u003c')};
  const form = document.getElementById('availability');
  const status = form.querySelector('.status');
  const state = form.querySelector('[data-state]');
  const buttons = [...form.querySelectorAll('button[data-days]')];
  const STORE = 'fixmatch-availability';
  const show = (message, error) => {
    status.textContent = message;
    status.classList.toggle('error', Boolean(error));
  };
  // Today and tomorrow in Denmark, as YYYY-MM-DD.
  const day = (offset) => {
    const date = new Date(Date.now() + offset * 86400000);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  };
  const describe = (days) => {
    const today = days.includes(day(0));
    const tomorrow = days.includes(day(1));
    const label = today && tomorrow ? config.text.shownBoth : today ? config.text.shownToday : tomorrow ? config.text.shownTomorrow : config.text.shownNone;
    state.textContent = config.text.now + ' ' + label;
    state.hidden = false;
  };

  // The link: ?id=… and #kode=…; remembered on this phone so a bookmark is enough.
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch {}
  const params = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.slice(1));
  form.elements.business_id.value = params.get('id') || saved.id || '';
  form.elements.key.value = hash.get('kode') || hash.get('code') || saved.key || '';
  if (hash.has('kode') || hash.has('code')) history.replaceState(null, '', location.pathname + location.search);

  if (!config.supabase) {
    buttons.forEach((b) => (b.disabled = true));
    show(config.text.offline);
    return;
  }
  const headers = { apikey: config.supabase.key, 'Content-Type': 'application/json' };

  const load = async (id) => {
    if (!id) return;
    try {
      const url = config.supabase.url + '/rest/v1/availability?select=available_on&business_id=eq.' + encodeURIComponent(id);
      const response = await fetch(url, { headers });
      const rows = response.ok ? await response.json() : [];
      describe(rows[0] ? rows[0].available_on : []);
    } catch {}
  };
  load(form.elements.business_id.value.trim());

  buttons.forEach((button) =>
    button.addEventListener('click', async () => {
      const id = form.elements.business_id.value.trim();
      const key = form.elements.key.value.trim();
      if (!id || !key) {
        show(config.text.missing, true);
        return;
      }
      const days = button.dataset.days ? button.dataset.days.split(',').map((n) => day(Number(n))) : [];
      buttons.forEach((b) => (b.disabled = true));
      show(config.text.saving);
      try {
        const response = await fetch(config.supabase.url + '/rest/v1/rpc/set_availability', {
          method: 'POST',
          headers,
          body: JSON.stringify({ p_business_id: id, p_key: key, p_days: days }),
        });
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          show(config.text.wrong, true);
          return;
        }
        if (!response.ok) throw new Error(String(response.status));
        describe(await response.json());
        try { localStorage.setItem(STORE, JSON.stringify({ id, key })); } catch {}
        show(config.text.saved);
      } catch {
        show(config.text.error, true);
      } finally {
        buttons.forEach((b) => (b.disabled = false));
      }
    }),
  );
})();
</script>`;
}

module.exports = { availabilityForm, AVAILABILITY_STYLE };
