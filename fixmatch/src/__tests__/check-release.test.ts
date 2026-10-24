/// <reference types="node" />
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The release check is plain Node.js (CommonJS) because it runs on EAS before `npm install`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { releaseProblems } = require('../../scripts/check-release');

function project(businesses: unknown, appInfo = "export const APP_INFO = { company: 'Mette Hansen' };") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fixmatch-release-'));
  fs.mkdirSync(path.join(root, 'src/data'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src/constants'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/data/live-businesses.json'), JSON.stringify(businesses));
  fs.writeFileSync(path.join(root, 'src/constants/app-info.ts'), appInfo);
  return root;
}

const real = { name: 'Rørfalken', consent: { date: '2026-10-20' } };

describe('release check', () => {
  it('passes with consented businesses and filled-in publisher details', () => {
    expect(releaseProblems(project([real]))).toEqual([]);
  });

  it('stops an empty app, demo data and missing consent', () => {
    expect(releaseProblems(project([]))).toHaveLength(1);
    const problems = releaseProblems(project([real, { ...real, demo: true }, { name: 'Uden samtykke' }]));
    expect(problems.join('\n')).toMatch(/demo/);
    expect(problems.join('\n')).toMatch(/Uden samtykke/);
  });

  it('stops placeholder publisher details', () => {
    expect(releaseProblems(project([real], '/** TODO: name */ export const APP_INFO = {};'))[0]).toMatch(/TODO/);
  });
});
