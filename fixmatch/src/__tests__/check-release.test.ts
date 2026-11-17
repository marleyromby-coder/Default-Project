/// <reference types="node" />
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The release check is plain Node.js (CommonJS) because it runs on EAS before `npm install`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { releaseProblems } = require('../../scripts/check-release');

const SUPABASE_ENV =
  'EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co\nEXPO_PUBLIC_SUPABASE_KEY=sb_publishable_test\n';

function project(
  businesses: unknown,
  appInfo = "export const APP_INFO = { company: 'Mette Hansen' };",
  files: Record<string, string> = { '.env': SUPABASE_ENV },
) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fixmatch-release-'));
  fs.mkdirSync(path.join(root, 'src/data'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src/constants'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/data/live-businesses.json'), JSON.stringify(businesses));
  fs.writeFileSync(path.join(root, 'src/constants/app-info.ts'), appInfo);
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  }
  return root;
}

const real = { name: 'Rørfalken', consent: { date: '2026-10-20' } };
const appInfo = "export const APP_INFO = { company: 'Mette Hansen' };";
/** No Supabase variables from the test runner's own environment. */
const noEnv = {};

describe('release check', () => {
  it('passes with consented businesses and filled-in publisher details', () => {
    expect(releaseProblems(project([real]), noEnv)).toEqual([]);
  });

  it('stops an empty app, demo data and missing consent', () => {
    expect(releaseProblems(project([]), noEnv)).toHaveLength(1);
    const problems = releaseProblems(project([real, { ...real, demo: true }, { name: 'Uden samtykke' }]), noEnv);
    expect(problems.join('\n')).toMatch(/demo/);
    expect(problems.join('\n')).toMatch(/Uden samtykke/);
  });

  it('stops placeholder publisher details', () => {
    expect(releaseProblems(project([real], '/** TODO: name */ export const APP_INFO = {};'), noEnv)[0]).toMatch(/TODO/);
  });

  it('stops a live build without the Supabase URL or key', () => {
    const problems = releaseProblems(project([real], appInfo, {}), noEnv);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/Supabase/);
    expect(
      releaseProblems(project([real], appInfo, { '.env': 'EXPO_PUBLIC_SUPABASE_URL=https://a.supabase.co\n' }), noEnv),
    ).toHaveLength(1);
    expect(
      releaseProblems(
        project([real], appInfo, { '.env': 'EXPO_PUBLIC_SUPABASE_KEY=x\nEXPO_PUBLIC_SUPABASE_URL=\n' }),
        noEnv,
      ),
    ).toHaveLength(1);
  });

  it('reads the Supabase values from the build environment too', () => {
    const env = { EXPO_PUBLIC_SUPABASE_URL: 'https://a.supabase.co', EXPO_PUBLIC_SUPABASE_KEY: 'sb_publishable_x' };
    expect(releaseProblems(project([real], appInfo, {}), env)).toEqual([]);
    expect(releaseProblems(project([real], appInfo, { '.env.local': SUPABASE_ENV }), noEnv)).toEqual([]);
  });

  it('stops businesses with a Trustpilot field, but not a plain link to their profile', () => {
    const withField = { ...real, name: 'Med Trustpilot', trustpilot: { url: 'https://dk.trustpilot.com/review/x.dk' } };
    const problems = releaseProblems(project([real, withField]), noEnv);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/trustpilot-felt: Med Trustpilot/);
    const withLink = { ...real, reviewLinks: [{ site: 'trustpilot', url: 'https://dk.trustpilot.com/review/x.dk' }] };
    expect(releaseProblems(project([withLink]), noEnv)).toEqual([]);
  });

  it('stops placeholders in the texts for App Store Connect, not in notes to the team', () => {
    const notes = [
      '# App Store-tekster',
      '- [ ] Et punkt på listen, og [et link](https://example.com).',
      '| User name | `[forretnings-id]` |',
      '```',
      'Businesses are listed in [Copenhagen, Denmark]. Search for "[København]".',
      '```',
    ].join('\n');
    const problems = releaseProblems(
      project([real], appInfo, { '.env': SUPABASE_ENV, 'docs/app-store/app-store-tekster.md': notes }),
      noEnv,
    );
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/\[Copenhagen, Denmark\]/);
    const filled = notes
      .replace('[Copenhagen, Denmark]', 'Copenhagen, Denmark')
      .replace('"[København]"', '"København"');
    expect(
      releaseProblems(
        project([real], appInfo, { '.env': SUPABASE_ENV, 'docs/app-store/app-store-texts-en.md': filled }),
        noEnv,
      ),
    ).toEqual([]);
  });

  it('passes the App Store texts in this repository', () => {
    const root = path.join(__dirname, '..', '..');
    const problems: string[] = releaseProblems(root, noEnv);
    expect(problems.filter((problem) => problem.includes('Pladsholderen'))).toEqual([]);
  });
});
