# /calcinate Refactor — Design Spec

**Date**: 2026-05-15
**Status**: Design approved, ready for implementation plan
**Author**: Ormus + Claude (brainstorming session)
**Supersedes**: `~/.claude/commands/calcinate.md` (metrics-reporter version)

---

## 1. Purpose

Refactor `/calcinate` from a metrics-reporter into a **surgical bloat-removal tool** that aligns a project's code against its declared essence and intent. The new command burns away fat (dead code, premature abstractions, dep bloat, doc/test rot) while preserving the structural and stylistic core the user has explicitly named.

The alchemical metaphor sharpens to its literal operation: calcination is **destruction in service of essence**. Nothing constructive happens here. The constructive counter-operation is a separate future `/coagulate`.

## 2. Goals and Non-Goals

### Goals

- **Actionable**, not advisory. Plan → approve → execute. Per-item git commits make every burn individually reversible.
- **Intent-anchored**. Refuse to run without a three-layer intent statement (business / architectural / stylistic). Without that, calcination is vandalism.
- **Multi-agent**. Four bloat categories detected in parallel by dedicated subagents, each receiving the intent statement as its preservation contract.
- **Idiomatic to superpowers**. Leverage `dispatching-parallel-agents`, `writing-plans`, `executing-plans`, `verification-before-completion`.
- **Re-runnable**. Designed to run often. Caches intent, remembers ignored items, generates dated run artifacts.

### Non-Goals

- Not a linter, formatter, or auto-fixer.
- Does not add code, suggest features, or refactor for readability without removal.
- Does not enforce style — that's the linter's job. Calcinate burns code that doesn't match declared style; it does not rewrite to match.
- Does not run as a hook or in CI silently. Always interactive (or `--dry-run`).
- Does not delete things matching `.calcinate/ignore` globs.

## 3. The Four Phases

### Phase 0 — KINDLING (Intent Articulation)

**Goal**: produce or load `INTENT.md` — the source of truth for "what to preserve."

Steps:
1. Check for `.calcinate/INTENT.md` in target project. If present, offer to reuse, refresh, or discard.
2. If absent, read in this order: `README.md`, `package.json` / `pyproject.toml` / `Cargo.toml` description, top-level docs (`docs/`, `ARCHITECTURE.md`, `CLAUDE.md`), entry points (main exports, server bootstrap, CLI), last 20 commit subjects.
3. Propose a three-layer intent draft:

```markdown
# INTENT — <project>

## Business intent (1-2 sentences)
What does this software DO for users? What problem does it solve?

## Architectural intent (3-5 bullets)
- Stack: ...
- Storage: ...
- Runtime: ...
- Boundary: where it integrates with external systems
- Non-goals at the architectural level

## Stylistic intent (3-5 bullets)
- Language conventions (TS strict, Python type hints, etc.)
- Naming (kebab-case files, PascalCase classes, etc.)
- Composition rules (no comments unless WHY, no defensive try/catch, etc.)
- Test style (integration > unit, no mocks for internal code, etc.)
- Anti-patterns explicitly forbidden
```

4. Show the draft, ask user to edit/confirm each layer.
5. Write `.calcinate/INTENT.md`. Commit by default (with `--private` flag for `.calcinate/` in `.gitignore`).

### Phase 1 — REVEAL (Parallel Detection)

**Goal**: produce a structured findings dataset, no edits made.

Dispatch four Explore-class subagents **in a single tool message** (parallel). Each receives:
- `INTENT.md` content verbatim
- Its category brief (in `references/`)
- Target scope (file / dir / project — default project)
- Hard contract: **detect only, never edit**, return JSON shape

Subagent categories:

| # | Subagent | Hunts |
|---|---|---|
| 1 | **code-rot** | dead exports/files, unreachable branches, commented-out blocks, swallow-catches, defensive scaffolding at internal boundaries, duplicate-and-drift |
| 2 | **structural-bloat** | one-caller wrappers, single-impl interfaces, factories that build one thing, config layers no one configures, files/dirs whose purpose doesn't match the architectural intent |
| 3 | **dep-bloat** | one-use deps, shadowing deps (lodash+ramda, axios+fetch+got), unused devDependencies, polyfills for supported targets, dev-tooling sprawl |
| 4 | **doc+test-rot** | stale comments, outdated README sections, dead links, docs describing code that's gone, tautological tests, snapshot-of-impl tests, tests of removed features |

Each finding returns:
```json
{
  "id": "<short-slug>",
  "path": "<file>",
  "lines": "<L1-L2 or null>",
  "category": "code-rot|structural-bloat|dep-bloat|doc-test-rot",
  "subcategory": "<from category brief>",
  "severity": 1-5,
  "intent_mismatch": 0.0-1.0,
  "proposed_action": "delete|inline|extract|rewrite|move",
  "risk_note": "<one-line — what could break>",
  "evidence": "<one-line — why it's bloat>"
}
```

### Phase 2 — JUDGMENT (Synthesize CALCINATION-PLAN.md)

Main thread:
1. Merge all four findings sets.
2. Dedupe — same file/lines flagged by multiple subagents → merge into one finding with combined categories.
3. Score: `priority = severity × intent_mismatch ÷ risk_score`. Risk scoring: `delete = 1`, `inline = 2`, `extract = 3`, `rewrite = 4`, `move = 2`.
4. Group into four tiers:

| Tier | Name | Criteria | Default Behavior |
|---|---|---|---|
| **1** | Burn (auto-OK) | category ∈ {dead exports, unused deps with zero refs}, severity ≥ 3, risk ≤ 1, intent_mismatch ≥ 0.7 | autonomous execute on `approve all` |
| **2** | Burn (review each) | premature abstractions, defensive scaffolds, duplicates | individual approval required |
| **3** | Realign | files/modules that should move or merge, not delete | individual approval, suggests target path |
| **4** | Discuss | items where intent itself might need editing, OR risk is high but intent_mismatch is also high | flagged for conversation, not action |

5. Write `.calcinate/runs/<YYYY-MM-DD-HHMM>/CALCINATION-PLAN.md` and a top-level copy `CALCINATION-PLAN.md` for visibility.
6. Present tier summary table + top 5 findings per tier in chat.

### Phase 3 — BURN (Gated Execution)

User commands:
- `approve all` → execute Tier 1 + Tier 2 sequentially
- `approve tier 1` / `approve tier 2` → restrict to a tier
- `approve <id1> <id2> ...` → execute specific items
- `skip <id>` → mark in plan as skipped (with optional reason)
- `pin <id>` → add file/pattern to `.calcinate/ignore`, never offer again
- `intent <id>` → flag that THIS item suggests `INTENT.md` should change; halts the current run, routes to Phase 0 with that finding as the seed for refining intent. Other queued items are preserved in the plan and re-evaluated on next run against the updated intent.

Per item execution:
1. Apply edit/deletion (Edit, Write, or Bash `rm`)
2. If `INTENT.md` declares a verify command (`verify: npm test && npm run typecheck`), run it
3. Green or no verify → `git commit -m "chore(calcinate): burn <category> — <one-line>"`
4. Red → `git restore <files>`, mark finding as FAILED in plan with the verify error, **continue to next item by default**. If three consecutive items fail verify, halt the run and ask the user — this signals the intent or the verify command is wrong, not the findings.

Branching: by default, work on a single new branch `calcinate/<YYYY-MM-DD-HHMM>`. `--no-branch` works on current branch. `--branch-per-item` creates one branch per finding (heavy-duty mode).

### Phase 4 — RESIDUE (Final Report)

Write `.calcinate/runs/<ts>/RESIDUE.md`:
- Tier-by-tier outcome (burned / failed / skipped / discussed)
- LOC removed, files deleted, deps pruned
- Full commit list with hashes
- Items deferred to next run (lower confidence)
- Suggested follow-up: if many Tier 4 items appeared, suggest `/calcinate --intent` to refresh INTENT.md

Update top-level `CALCINATION-PLAN.md` to point to the residue.

## 4. CLI Surface

```
/calcinate                          # Full flow on current dir
/calcinate <path>                   # Target a different path
/calcinate --reveal-only            # Stop after Phase 2 (plan generated, no burn)
/calcinate --burn                   # Skip Phase 1, re-execute existing plan
/calcinate --intent                 # Just (re)build INTENT.md
/calcinate --tier=1                 # Restrict to a tier (1|2|3|4)
/calcinate --dry-run                # Walk burn without applying
/calcinate --aggressive             # Lower auto-burn confidence threshold
/calcinate --private                # Add .calcinate/ to .gitignore (intent stays local)
/calcinate --no-branch              # Work on current branch instead of new
/calcinate --branch-per-item        # One branch per finding
```

## 5. On-Disk Artifacts

```
<project>/
├── .calcinate/
│   ├── INTENT.md                          # source of truth (three layers)
│   ├── ignore                             # user-pinned globs ("never burn this")
│   └── runs/<YYYY-MM-DD-HHMM>/
│       ├── findings.json                  # raw subagent output (all 4)
│       ├── CALCINATION-PLAN.md            # tiered, ranked, actionable
│       └── RESIDUE.md                     # post-burn report
└── CALCINATION-PLAN.md                    # copy of latest plan (top-level for visibility)
```

`.calcinate/INTENT.md` and `.calcinate/ignore` are **committed by default**. Run artifacts under `.calcinate/runs/` are gitignored automatically (the skill writes `.calcinate/runs/.gitignore` containing `*`).

`--private` mode: writes `.calcinate/` to project root `.gitignore`, intent stays local.

## 6. Skill Layout

```
~/.claude/skills/calcinate/
├── SKILL.md                                # entry — frontmatter + phase flow + CLI parser
├── references/
│   ├── intent-template.md                  # the three-layer template
│   ├── subagent-code-rot.md                # full prompt for subagent 1
│   ├── subagent-structural-bloat.md        # full prompt for subagent 2
│   ├── subagent-dep-bloat.md               # full prompt for subagent 3
│   ├── subagent-doc-test-rot.md            # full prompt for subagent 4
│   ├── plan-template.md                    # CALCINATION-PLAN.md structure
│   └── residue-template.md                 # RESIDUE.md structure
└── README.md                               # for humans browsing the skills dir
```

Old `~/.claude/commands/calcinate.md` is **archived** to `~/.claude/commands/_archive/calcinate.md.pre-refactor-2026-05-15` and replaced with a thin shim that invokes the skill (for users who type `/calcinate` directly into the command palette).

## 7. Superpowers Integration

| Phase | Superpower invoked |
|---|---|
| Phase 1 (REVEAL) | `superpowers:dispatching-parallel-agents` |
| Phase 2 (JUDGMENT) | `superpowers:writing-plans` — CALCINATION-PLAN.md format follows the plans skill's structure |
| Phase 3 (BURN) | `superpowers:executing-plans` + `superpowers:verification-before-completion` |
| Throughout | `superpowers:using-superpowers` (the skill itself is a meta-superpower) |

## 8. Guardrails

1. **Refuse to start without INTENT.md.** First run forces Phase 0; subsequent runs require user to confirm or refresh.
2. **Never burn the only test of a feature** — even if tautological. Flag for Tier 4 (discuss) instead.
3. **Never burn files matching `.calcinate/ignore`** — user-pinned globs are sacred.
4. **Always per-item commits** — `--branch-per-item` is opt-in but **one mega-commit is forbidden**.
5. **Verify on green, revert on red.** No "best effort" — if the project's verify command fails, that finding is rolled back.
6. **No constructive suggestions.** If a subagent finds something missing, it does NOT propose adding it. That's `/coagulate`'s job (separate future skill).
7. **Refuse to operate on dirty working trees** unless `--no-branch --force`. Default: stash and complain.
8. **Intent edits pause the run.** If user invokes `intent <id>` during BURN, halt and route to Phase 0.

## 9. Subagent Contract (Detection)

Each subagent receives the following prompt skeleton (filled in by SKILL.md):

```
You are the <CATEGORY> detection agent for /calcinate.

TARGET: <absolute path>
SCOPE: <file | dir | project>

INTENT (preserve these — never flag code that serves them):
<verbatim INTENT.md>

YOUR HUNT (this category only):
<verbatim subagent-<category>.md from references/>

OUTPUT CONTRACT:
Return ONE JSON array. Each finding:
{
  "id": "<kebab-slug>",
  "path": "<rel-path>",
  "lines": "<L1-L2 | null>",
  "category": "<category>",
  "subcategory": "<from your hunt list>",
  "severity": 1-5,
  "intent_mismatch": 0.0-1.0,
  "proposed_action": "delete|inline|extract|rewrite|move",
  "risk_note": "<one line — what could break>",
  "evidence": "<one line — why it's bloat>"
}

HARD RULES:
- Detect only, never edit, never run code that mutates state
- If a finding would VIOLATE the INTENT, do NOT include it
- Be specific — path + line range, not "somewhere in src/"
- Severity 5 = obvious dead weight; 1 = mild whiff
- intent_mismatch: 0 = aligned with declared intent; 1 = directly contradicts it
- If you find nothing in your category, return []
```

## 10. Data Flow

```
USER: /calcinate <path>
       │
       ▼
┌──────────────────────────┐
│ Phase 0: KINDLING        │
│ - Read or propose intent │
│ - User confirms layers   │
│ - Write .calcinate/      │
│   INTENT.md              │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ Phase 1: REVEAL          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐
│  │A1  │ │A2  │ │A3  │ │A4  │  ← 4 subagents in parallel
│  │rot │ │arch│ │dep │ │docs│
│  └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘
└────┼──────┼──────┼──────┼─────┘
     ▼      ▼      ▼      ▼
   findings.json (merged)
          │
          ▼
┌──────────────────────────┐
│ Phase 2: JUDGMENT        │
│ - Dedupe                 │
│ - Score & tier           │
│ - Write CALCINATION-PLAN │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ Phase 3: BURN            │
│ For each approved item:  │
│  1. Apply edit/delete    │
│  2. Run verify command   │
│  3. green→commit│red→revert
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ Phase 4: RESIDUE         │
│ - Write RESIDUE.md       │
│ - Update top-level plan  │
└──────────────────────────┘
```

## 11. Migration of the Old Command

1. Archive: `~/.claude/commands/calcinate.md` → `~/.claude/commands/_archive/calcinate.md.pre-refactor-2026-05-15`
2. Replace with a thin shim that delegates: `Invoke Skill: calcinate`
3. Write new skill at `~/.claude/skills/calcinate/`
4. Update `~/.claude/MEMORY.md` index with a one-line entry pointing to a memory file capturing the refactor reasoning
5. First test run: `/calcinate ~/.claude/` itself

## 12. Open Questions Resolved

| Question | Decision |
|---|---|
| Intent source | Multi-layered (business / architectural / stylistic), auto-propose, user confirms each layer |
| Action level | Plan-then-execute, gated, per-item commits |
| Bloat categories | All four (code rot, structural, dep, doc+test) |
| Orchestration | Parallel subagents per category |
| Skill location | Full skill at `~/.claude/skills/calcinate/SKILL.md` |
| Intent file commit policy | Committed by default; `--private` flag opts out |

## 13. Acceptance Criteria

- [ ] Skill file at `~/.claude/skills/calcinate/SKILL.md` with frontmatter declaring it
- [ ] Four `subagent-*.md` brief files in `references/`
- [ ] `intent-template.md`, `plan-template.md`, `residue-template.md` in `references/`
- [ ] Old command archived
- [ ] Thin command shim in place so `/calcinate` still works
- [ ] Skill passes a dry-run on `~/.claude/` itself: produces an INTENT draft, dispatches subagents, writes CALCINATION-PLAN.md without making any edits
- [ ] First real burn produces a valid git commit, a RESIDUE.md, and no broken state

## 14. Future / Out of Scope

- `/coagulate` — the constructive counter-operation (add what's missing). Separate spec, later.
- `/sublimate` — moving code to its proper home across repos. Separate.
- Multi-repo calcination (workspace level). Out of scope.
- Auto-scheduling (`/loop /calcinate weekly`). Possible follow-up.
- IDE plugin or pre-commit hook integration. Out of scope.
