# CALCINATION-PLAN — <project>

**Run**: `<YYYY-MM-DD-HHMM>`
**Target**: `<absolute path>`
**Findings total**: `<N>` across `<M>` files

## Summary

| Tier | Count | LOC affected | Default action on `approve all` |
|---|---|---|---|
| 1 — Burn (auto-OK) | <N> | <LOC> | autonomous execute |
| 2 — Burn (review) | <N> | <LOC> | execute, log each |
| 3 — Realign | <N> | <LOC> | individual approval |
| 4 — Discuss | <N> | <LOC> | flagged, not burned |

## Verify command

```
<from .calcinate/verify>
```

Each burn runs this after applying. Green → commit. Red → revert that item.

---

## Tier 1 — Burn (auto-OK)

> Dead code with zero references, unused deps with zero imports. Calcinate executes these on `approve all` without per-item gating.

<for each finding sorted by priority desc:>
### `<id>` — `<path>:<lines>`

- **Category**: `<category>` / `<subcategory>`
- **Action**: `<proposed_action>`
- **Severity**: `<N>` · **Intent mismatch**: `<0.0-1.0>` · **Priority**: `<computed>`
- **Evidence**: `<one line>`
- **Risk**: `<one line>`

---

## Tier 2 — Burn (review each)

> Premature abstractions, defensive scaffolds, duplicates. `approve all` executes these but logs each item explicitly.

<same format>

---

## Tier 3 — Realign

> Items that should `move` or `extract`, not `delete`. Requires per-item approval — these change file layout, not just remove code.

<same format, plus a `target:` field for the proposed destination>

---

## Tier 4 — Discuss

> High-impact items where either intent should change to justify the code, OR the code is risky enough that you want a conversation before burning. Calcinate does NOT execute these.

<same format, plus a `discussion:` field surfacing the open question>

---

## How to act on this plan

- `approve all` — execute Tier 1 + Tier 2 sequentially
- `approve tier 1` — restrict to a tier
- `approve <id> <id2> ...` — execute specific items
- `skip <id>` — mark skipped (with optional reason)
- `pin <id>` — add path to `.calcinate/ignore`, never offer again
- `intent <id>` — halt and refresh INTENT.md with this item as the seed
