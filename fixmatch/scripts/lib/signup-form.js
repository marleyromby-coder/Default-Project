/**
 * The "Tilmeld din virksomhed" form for the website (website/tilmeld.md and signup.en.md,
 * where {{form}} stands). It sends the same row as the app (src/lib/business-signup.ts) to
 * the business_signups table in Supabase, with the same consent statements and version,
 * read from the app's source so the two never drift apart. Without a Supabase project in
 * .env, the form prepares an e-mail instead.
 */
const fs = require('node:fs');
const path = require('node:path');

const COUNTRIES = {
  da: { DK: 'Danmark', SE: 'Sverige', NO: 'Norge', DE: 'Tyskland', GB: 'Storbritannien' },
  en: { DK: 'Denmark', SE: 'Sweden', NO: 'Norway', DE: 'Germany', GB: 'United Kingdom' },
};

const TEXT = {
  da: {
    country: 'Land',
    business: 'Virksomheden',
    name: 'Navn',
    registry: 'CVR- eller registreringsnummer',
    trades: 'Fag',
    street: 'Adresse',
    postal: 'Postnummer',
    city: 'By',
    contact: 'Sådan kontakter kunderne jer',
    phone: 'Telefon',
    email: 'E-mail',
    emailHint: 'Vises ikke. Vi bruger den kun til at bekræfte tilmeldingen.',
    website: 'Hjemmeside (valgfri)',
    prices: 'Priser inkl. moms i landets valuta',
    hourlyMin: 'Timepris fra',
    hourlyMax: 'Timepris til',
    callout: 'Kørselsgebyr (valgfrit)',
    hours: 'Åbningstider (valgfrit)',
    hoursPlaceholder: 'Fx man-fre 07-16, lør-søn lukket',
    emergency: 'Døgnvagt / akut hjælp',
    about: 'Kort om jer (valgfrit)',
    you: 'Dig, der tilmelder',
    yourName: 'Dit navn',
    role: 'Din stilling (valgfri)',
    consent: 'Samtykke',
    send: 'Send tilmelding',
    sending: 'Sender …',
    thanks: 'Tak for tilmeldingen',
    thanksText:
      'Vi tjekker oplysningerne og viser jer i FixMatch inden for få dage. I kan altid få dem rettet eller fjernet.',
    mailText: 'Dit mailprogram er åbnet med tilmeldingen. Når du har sendt den, tjekker vi oplysningerne.',
    error: 'Tilmeldingen blev ikke sendt. Tjek internettet, og prøv igen – eller skriv til',
    pricesInvalid: 'Den højeste timepris skal være mindst lige så høj som den laveste.',
    tradesMissing: 'Vælg mindst ét fag.',
  },
  en: {
    country: 'Country',
    business: 'The business',
    name: 'Name',
    registry: 'Company registration number',
    trades: 'Trade',
    street: 'Address',
    postal: 'Postcode',
    city: 'Town or city',
    contact: 'How customers contact you',
    phone: 'Phone',
    email: 'E-mail',
    emailHint: 'Not shown. We only use it to confirm the sign-up.',
    website: 'Website (optional)',
    prices: 'Prices including VAT, in your local currency',
    hourlyMin: 'Hourly rate from',
    hourlyMax: 'Hourly rate to',
    callout: 'Call-out fee (optional)',
    hours: 'Opening hours (optional)',
    hoursPlaceholder: 'E.g. Mon-Fri 07-16, Sat-Sun closed',
    emergency: '24-hour / emergency service',
    about: 'About you (optional)',
    you: 'You, signing up',
    yourName: 'Your name',
    role: 'Your role (optional)',
    consent: 'Consent',
    send: 'Send sign-up',
    sending: 'Sending …',
    thanks: 'Thank you for signing up',
    thanksText:
      'We check the details and show you in FixMatch within a few days. You can always have them corrected or removed.',
    mailText: 'Your mail program has opened with the sign-up. Once you have sent it, we check the details.',
    error: 'The sign-up was not sent. Check your internet connection and try again – or write to',
    pricesInvalid: 'The highest hourly rate must be at least as high as the lowest.',
    tradesMissing: 'Choose at least one trade.',
  },
};

const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A JavaScript string literal of a TypeScript one ('…' or "…"). */
const STRING = String.raw`'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"`;
const unquote = (m, first) => (m[first] ?? m[first + 1]).replace(/\\(.)/g, '$1');

/** The trades in the order of the app, with their Danish and English names. */
function readTrades(root) {
  const source = fs.readFileSync(path.join(root, 'src/data/categories.ts'), 'utf8');
  const pattern = new RegExp(
    String.raw`^ {4}id: '([a-z]+)',\n {4}name: \{ da: (?:${STRING}), en: (?:${STRING}) \}`,
    'gm',
  );
  return [...source.matchAll(pattern)].map((m) => ({ id: m[1], da: unquote(m, 2), en: unquote(m, 4) }));
}

/** CONSENT_STATEMENTS and CONSENT_VERSION from the app, with the English from en.ts. */
function readConsent(root) {
  const source = fs.readFileSync(path.join(root, 'src/lib/business-signup.ts'), 'utf8');
  const english = fs.readFileSync(path.join(root, 'src/i18n/en.ts'), 'utf8');
  const version = source.match(/CONSENT_VERSION = '([^']+)'/)?.[1];
  const block = source.match(/CONSENT_STATEMENTS = \{([\s\S]*?)\} as const/)?.[1] ?? '';
  const statements = [...block.matchAll(new RegExp(String.raw`(\w+): msg\(\s*(?:${STRING}),?\s*\)`, 'g'))].map((m) => {
    const da = unquote(m, 2);
    const quoted = new RegExp(String.raw`(?:'${escapeRegExp(da)}'|"${escapeRegExp(da)}"):\s*(?:${STRING})`);
    const en = english.match(quoted);
    return { key: m[1], da, en: en ? unquote(en, 1) : da };
  });
  if (!version || statements.length !== 3)
    throw new Error('Could not read the consent statements from business-signup.ts');
  return { version, statements };
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** EXPO_PUBLIC_SUPABASE_URL and _KEY from the environment or fixmatch/.env. */
function readSupabase(root) {
  const env = { ...process.env };
  const file = path.join(root, '.env');
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && env[match[1]] === undefined) env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const key = env.EXPO_PUBLIC_SUPABASE_KEY;
  return url?.startsWith('https://') && key ? { url, key } : null;
}

const field = (label, input, hint = '') =>
  `<label class="field"><span>${escape(label)}</span>${input}${hint ? `<small>${escape(hint)}</small>` : ''}</label>`;

/** The form and its script, for one language. */
function signupForm(lang, { root, email }) {
  const text = TEXT[lang];
  const trades = readTrades(root);
  const consent = readConsent(root);
  const supabase = readSupabase(root);
  const countries = Object.entries(COUNTRIES[lang])
    .map(
      ([code, name]) =>
        `<option value="${code}"${code === (lang === 'da' ? 'DK' : 'GB') ? ' selected' : ''}>${escape(name)}</option>`,
    )
    .join('');
  const tradeBoxes = trades
    .map(
      (t) => `<label class="choice"><input type="checkbox" name="trades" value="${t.id}"> ${escape(t[lang])}</label>`,
    )
    .join('');
  const consentBoxes = consent.statements
    .map(
      (s) =>
        `<label class="choice consent"><input type="checkbox" name="consent" value="${s.key}" required> ${escape(s[lang])}</label>`,
    )
    .join('');
  const config = {
    lang,
    email,
    supabase,
    version: consent.version,
    statements: Object.fromEntries(consent.statements.map((s) => [s.key, s[lang]])),
    text: {
      sending: text.sending,
      send: text.send,
      error: text.error,
      pricesInvalid: text.pricesInvalid,
      tradesMissing: text.tradesMissing,
    },
  };

  return `<form id="signup" class="signup" novalidate>
<fieldset><legend>${escape(text.business)}</legend>
${field(text.country, `<select name="country" required>${countries}</select>`)}
${field(text.name, '<input name="company_name" required minlength="2" maxlength="120" autocomplete="organization">')}
${field(text.registry, '<input name="registry_number" required minlength="4" maxlength="30">')}
<div class="field"><span>${escape(text.trades)}</span><div class="choices">${tradeBoxes}</div></div>
${field(text.street, '<input name="street" required maxlength="120" autocomplete="street-address">')}
<div class="row">${field(text.postal, '<input name="postal_code" required minlength="3" maxlength="10" autocomplete="postal-code">')}${field(text.city, '<input name="city" required maxlength="80" autocomplete="address-level2">')}</div>
</fieldset>
<fieldset><legend>${escape(text.contact)}</legend>
${field(text.phone, '<input name="phone" type="tel" required pattern="\\+?[0-9 ()\\-]{6,20}" autocomplete="tel">')}
${field(text.email, '<input name="email" type="email" required autocomplete="email">', text.emailHint)}
${field(text.website, '<input name="website" type="url" inputmode="url" maxlength="200" placeholder="https://">')}
</fieldset>
<fieldset><legend>${escape(text.prices)}</legend>
<div class="row">${field(text.hourlyMin, '<input name="hourly_min" type="number" min="1" step="1" required inputmode="numeric">')}${field(text.hourlyMax, '<input name="hourly_max" type="number" min="1" step="1" inputmode="numeric">')}</div>
${field(text.callout, '<input name="callout_fee" type="number" min="0" step="1" inputmode="numeric">')}
${field(text.hours, `<input name="opening_hours" maxlength="200" placeholder="${escape(text.hoursPlaceholder)}">`)}
<label class="choice"><input type="checkbox" name="emergency"> ${escape(text.emergency)}</label>
${field(text.about, '<textarea name="description" maxlength="500" rows="3"></textarea>')}
</fieldset>
<fieldset><legend>${escape(text.you)}</legend>
${field(text.yourName, '<input name="contact_name" required minlength="2" maxlength="100" autocomplete="name">')}
${field(text.role, '<input name="contact_role" maxlength="80" autocomplete="organization-title">')}
</fieldset>
<fieldset><legend>${escape(text.consent)}</legend>
${consentBoxes}
</fieldset>
<p class="error" role="alert" hidden></p>
<button type="submit">${escape(text.send)}</button>
</form>
<div id="signup-done" hidden><h2>${escape(text.thanks)}</h2><p data-saved>${escape(text.thanksText)}</p><p data-mail hidden>${escape(text.mailText)}</p></div>
<script>window.FIXMATCH_SIGNUP = ${JSON.stringify(config).replace(/</g, '\\u003c')};</script>
<script>${CLIENT}</script>`;
}

/** Runs in the browser. Builds the same row as signupRow() in src/lib/business-signup.ts. */
const CLIENT = `(() => {
  const config = window.FIXMATCH_SIGNUP;
  const form = document.getElementById('signup');
  const error = form.querySelector('.error');
  const button = form.querySelector('button');
  const value = (name) => (form.elements[name].value || '').trim();
  const number = (name) => (value(name) === '' ? null : Math.round(Number(value(name))));
  const show = (message) => { error.textContent = message; error.hidden = false; error.scrollIntoView({ block: 'center' }); };
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    const trades = [...form.querySelectorAll('input[name=trades]:checked')].map((box) => box.value);
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (trades.length === 0) { show(config.text.tradesMissing); return; }
    const min = number('hourly_min');
    const max = number('hourly_max') ?? min;
    if (max < min) { show(config.text.pricesInvalid); return; }
    const website = value('website');
    const row = {
      source: 'web',
      language: config.lang,
      country: value('country'),
      company_name: value('company_name'),
      registry_number: value('registry_number'),
      trades,
      street: value('street'),
      postal_code: value('postal_code'),
      city: value('city'),
      phone: value('phone'),
      email: value('email'),
      website: website ? (/^https?:\\/\\//.test(website) ? website : 'https://' + website) : null,
      hourly_min: min,
      hourly_max: max,
      callout_fee: number('callout_fee'),
      opening_hours: value('opening_hours') || null,
      emergency: form.elements.emergency.checked,
      description: value('description') || null,
      contact_name: value('contact_name'),
      contact_role: value('contact_role') || null,
      consent: { listing: true, accurate: true, authority: true, statements: config.statements },
      consent_version: config.version,
    };
    const done = (saved) => {
      form.hidden = true;
      const box = document.getElementById('signup-done');
      box.hidden = false;
      box.querySelector('[data-saved]').hidden = !saved;
      box.querySelector('[data-mail]').hidden = saved;
      box.scrollIntoView({ block: 'start' });
    };
    if (!config.supabase) {
      const body = Object.entries(row).map(([k, v]) => k + ': ' + (typeof v === 'object' && v !== null ? JSON.stringify(v) : v)).join('\\n');
      location.href = 'mailto:' + config.email + '?subject=' + encodeURIComponent('Tilmelding: ' + row.company_name) + '&body=' + encodeURIComponent(body);
      done(false);
      return;
    }
    button.disabled = true;
    button.textContent = config.text.sending;
    try {
      const response = await fetch(config.supabase.url + '/rest/v1/business_signups', {
        method: 'POST',
        headers: { apikey: config.supabase.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(row),
      });
      if (!response.ok) throw new Error(String(response.status));
      done(true);
    } catch {
      show(config.text.error + ' ' + config.email + '.');
    } finally {
      button.disabled = false;
      button.textContent = config.text.send;
    }
  });
})();`;

const FORM_STYLE = `
:root { --danger: #B3261E; }
@media (prefers-color-scheme: dark) { :root { --danger: #F2B8B5; } }
.signup fieldset { border: 0; padding: 0; margin: 24px 0 0; display: grid; gap: 14px; }
.signup legend { font-family: Fraunces, Georgia, serif; font-weight: 600; font-size: 22px; margin-bottom: 4px; }
.signup .field { display: grid; gap: 6px; font-weight: 600; font-size: 15px; color: var(--muted); }
.signup .field small { font-weight: 400; }
.signup input:not([type=checkbox]), .signup select, .signup textarea { font: inherit; font-size: 17px; color: var(--text); background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; width: 100%; box-sizing: border-box; }
.signup input:focus, .signup select:focus, .signup textarea:focus { outline: 2px solid var(--brand); outline-offset: 1px; }
.signup .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.signup .choices { display: flex; flex-wrap: wrap; gap: 8px 16px; }
.signup .choice { display: flex; gap: 10px; align-items: flex-start; color: var(--text); font-weight: 400; }
.signup .choice input { width: 20px; height: 20px; margin: 2px 0 0; accent-color: var(--brand); flex: none; }
.signup .error { color: var(--danger); font-weight: 600; }
.signup button { margin-top: 24px; width: 100%; font: inherit; font-weight: 600; font-size: 18px; color: var(--surface); background: var(--brand); border: 0; border-radius: 14px; padding: 16px; cursor: pointer; }
.signup button:disabled { opacity: 0.6; }
@media (max-width: 520px) { .signup .row { grid-template-columns: 1fr; } }
`;

module.exports = { signupForm, readConsent, readTrades, readSupabase, FORM_STYLE };
