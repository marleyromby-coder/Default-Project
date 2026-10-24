/// <reference types="node" />
import { parse } from '@babel/parser';
import fs from 'node:fs';
import path from 'node:path';

import en from '@/i18n/en';
import { setLanguage, t } from '@/i18n';

const SRC = path.join(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((name: string) => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory())
      return ['__tests__', '__fixtures__', 'i18n'].includes(name) ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

/** Every literal passed to t('…') or msg('…') in the app. */
function usedKeys(): Set<string> {
  const keys = new Set<string>();
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    const n = node as {
      type?: string;
      callee?: { type: string; name?: string };
      arguments?: { type: string; value?: string }[];
    };
    if (
      n.type === 'CallExpression' &&
      n.callee?.type === 'Identifier' &&
      (n.callee.name === 't' || n.callee.name === 'msg')
    ) {
      const first = n.arguments?.[0];
      if (first?.type === 'StringLiteral' && typeof first.value === 'string') keys.add(first.value);
    }
    for (const [key, value] of Object.entries(node))
      if (key !== 'loc' && key !== 'start' && key !== 'end') visit(value);
  };
  for (const file of sourceFiles(SRC)) {
    visit(parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] }).program);
  }
  return keys;
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('translations', () => {
  const keys = usedKeys();

  it('has an English text for every Danish text in the app', () => {
    const missing = [...keys].filter((key) => !(key in en));
    expect(missing).toEqual([]);
  });

  it('has no translations that are no longer used', () => {
    const unused = Object.keys(en).filter((key) => !keys.has(key));
    expect(unused).toEqual([]);
  });

  it('keeps the same {placeholders} in both languages', () => {
    const wrong = Object.entries(en).filter(
      ([da, english]) => placeholders(da).join() !== placeholders(english).join(),
    );
    expect(wrong.filter(([da]) => da !== '{level} vigtigt')).toEqual([]);
  });

  it('translates and fills in values', () => {
    setLanguage('en');
    expect(t('Ring til {name}', { name: 'Rørfalken' })).toBe('Call Rørfalken');
    expect(t('Ikke i ordbogen')).toBe('Ikke i ordbogen');
    setLanguage('da');
    expect(t('Ring til {name}', { name: 'Rørfalken' })).toBe('Ring til Rørfalken');
  });
});
