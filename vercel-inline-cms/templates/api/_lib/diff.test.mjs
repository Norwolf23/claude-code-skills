// Self-check for diff.js. Run with:  node --test templates/api/_lib/diff.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffFromDefaults } from './diff.js';

// Copied verbatim from templates/src/cms/ContentContext.jsx so the round-trip test
// exercises the exact merge the client runs.
function deepMerge(base, over) {
  if (over == null) return base;
  if (Array.isArray(base) || Array.isArray(over)) return over;
  if (typeof base !== 'object' || typeof over !== 'object') return over;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = deepMerge(base?.[k], over[k]);
  return out;
}

const DEFAULTS = {
  hero: { headline: 'Hello', subhead: 'World' },
  about: { title: 'About', body: 'Lorem' },
  features: [
    { title: 'One', text: 'a' },
    { title: 'Two', text: 'b' },
  ],
  team: [{ name: 'Ann' }, { name: 'Bob' }],
};

const clone = (v) => JSON.parse(JSON.stringify(v));

test('untouched clone diffs to undefined', () => {
  assert.equal(diffFromDefaults(DEFAULTS, clone(DEFAULTS)), undefined);
});

test('nested edit + edited array keep only what changed', () => {
  const cur = clone(DEFAULTS);
  cur.hero.headline = 'Edited';
  cur.team = [{ name: 'Ann' }]; // admin deleted Bob
  assert.deepEqual(diffFromDefaults(DEFAULTS, cur), {
    hero: { headline: 'Edited' },
    team: [{ name: 'Ann' }],
  });
});

test('round-trips through the client deepMerge, and untouched arrays follow new defaults', () => {
  const cur = clone(DEFAULTS);
  cur.about.body = 'Changed';
  cur.team = [{ name: 'Ann' }];
  const stored = diffFromDefaults(DEFAULTS, cur) ?? {};
  assert.deepEqual(deepMerge(DEFAULTS, stored), cur);

  // Later, a third feature is added to the code defaults: the untouched `features`
  // array was not stored, so the new item shows; the edited `team` deletion sticks.
  const NEXT = clone(DEFAULTS);
  NEXT.features.push({ title: 'Three', text: 'c' });
  const merged = deepMerge(NEXT, stored);
  assert.equal(merged.features.length, 3);
  assert.deepEqual(merged.team, [{ name: 'Ann' }]);
  assert.equal(merged.about.body, 'Changed');
});
