import { isDeepStrictEqual } from 'node:util';

// Inverse of the client deepMerge: keep only what differs from `base` (the code defaults),
// so the stored blob holds real edits instead of a full snapshot that pins every array to
// the defaults of the day it was saved. deepMerge(base, diffFromDefaults(base, cur)) === cur.
// Arrays are compared whole: an edited array is stored wholesale (so admin deletions stick),
// an untouched one is dropped (so items added to the defaults later still show).
// Returns undefined when nothing differs.
export function diffFromDefaults(base, cur) {
  if (Array.isArray(cur)) return isDeepStrictEqual(base, cur) ? undefined : cur;
  if (cur && typeof cur === 'object' && base && typeof base === 'object' && !Array.isArray(base)) {
    const out = {};
    for (const k of Object.keys(cur)) {
      const d = diffFromDefaults(base[k], cur[k]);
      if (d !== undefined) out[k] = d;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return isDeepStrictEqual(base, cur) ? undefined : cur;
}
