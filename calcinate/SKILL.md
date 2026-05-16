---
name: calcinate
description: Burn project bloat to reveal essence. Surgical, intent-anchored, multi-agent. Articulate a three-layer intent (business / architectural / stylistic), dispatch 4 parallel subagents to find code-rot / structural / dep / doc-test bloat, produce a tiered CALCINATION-PLAN.md, then execute per-item with auto-revert on failed verify. Reversible via git. Use when a project has gotten fat and needs aligning back to its core purpose.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, TaskCreate, TaskUpdate
argument-hint: [path] [--reveal-only|--burn|--intent|--tier=N|--dry-run|--aggressive|--private|--no-branch|--branch-per-item]
---

# /calcinate — The Fire of Essence

> "That which does not serve the Work must burn."
>
> Element: Fire 🜂 · Stage: NIGREDO · Operation: destruction in service of essence

Calcinate is the **destructive** operation. It does not add. It does not refactor for elegance. It identifies what doesn't belong and burns it — anchored to a declared intent. The constructive counter-operation is `/coagulate` (separate skill, not yet built).

## Hard rules — never violate

1. **Refuse to start without `.calcinate/INTENT.md`.** Without a declared essence, calcination is vandalism. First run forces Phase 0.
2. **Never delete the only test of a feature.** Even if tautological. Flag for Tier 4 (discuss).
3. **Files matching `.calcinate/ignore` are sacred** — never touched.
4. **Always per-item git commits** during BURN. No mega-commits.
5. **Refuse to operate on dirty working trees** unless `--no-branch --force`. Default: stash and complain.
6. **No constructive suggestions.** If a subagent finds something missing, do NOT propose adding. That's `/coagulate`.
7. **Verify on green, revert on red.** Three consecutive verify-fails halts the run.

## Argument parsing

Read `$ARGUMENTS`:
- First non-flag token = target path (default: current working dir; if running on `~/.claude/`, target is the user's claude config home).
- Flags:
  - `--reveal-only` → stop after Phase 2 (plan only, no burn)
  - `--burn` → skip Phase 1, re-execute existing CALCINATION-PLAN.md
  - `--intent` → only (re)build INTENT.md, then exit
  - `--tier=N` → restrict burn to a single tier (1|2|3|4)
  - `--dry-run` → walk through burn without applying edits
  - `--aggressive` → lower auto-burn confidence (intent_mismatch ≥ 0.5 instead of 0.7)
  - `--private` → add `.calcinate/` to project `.gitignore` (intent stays local)
  - `--no-branch` → work on current branch, do not create one
  - `--branch-per-item` → one branch per finding (heavy mode)
  - `--force` → allow dirty-tree operation (still requires `--no-branch`)

If `--intent`: jump to Phase 0, write, exit.
If `--burn`: skip to Phase 3 using the most recent plan under `.calcinate/runs/`.
Otherwise: full flow Phase 0 → 1 → 2 → 3 → 4.

---

## Phase 0 — KINDLING (intent articulation)

Goal: produce or confirm `.calcinate/INTENT.md`. This is the preservation contract — what subagents MUST NOT flag.

### Steps

1. **Check for existing intent.**
   ```bash
   test -f <target>/.calcinate/INTENT.md && cat <target>/.calcinate/INTENT.md
   ```
   If present, show its current content. Use `AskUserQuestion` to offer: **Reuse** / **Refresh** (auto-propose updates, user confirms) / **Discard** (rebuild from scratch).

2. **If building or refreshing, gather signals** (parallel reads):
   - `README.md` (or `readme.md`, `README.rst`)
   - `package.json` `.description`, `.scripts`, `.dependencies` (or `pyproject.toml`, `Cargo.toml`, `go.mod`)
   - Top-level docs: `CLAUDE.md`, `ARCHITECTURE.md`, `docs/`
   - Entry points: `src/index.*`, `main.*`, `cli.*`, `server.*`, `app.*`
   - Last 20 commit subjects: `git -C <target> log --oneline -20`

3. **Propose the three-layer draft** using `references/intent-template.md` as the shape. Fill in:
   - **Business intent** — 1-2 sentences. What does this software DO for users? What problem does it solve?
   - **Architectural intent** — 3-5 bullets. Stack, storage, runtime, boundaries, architectural non-goals.
   - **Stylistic intent** — 3-5 bullets. Language conventions, naming, composition rules, test style, forbidden anti-patterns.

4. **Show the draft. Use `AskUserQuestion` per layer** to confirm/edit each. The user can accept all, or rewrite any layer.

5. **Write `.calcinate/INTENT.md`.** Create the dir if needed. Also write `.calcinate/runs/.gitignore` containing `*` (run artifacts not tracked).

6. **Verify command discovery.** Look in `INTENT.md` for a `verify:` line. If absent, infer from `package.json` scripts (`test` + `typecheck` + `lint` combined) or ask the user. Store at `.calcinate/verify` (single executable command).

7. **Commit intent unless `--private`.** Default: `.calcinate/INTENT.md` and `.calcinate/ignore` are committed. `--private` writes `.calcinate/` into the project's `.gitignore` instead.

If `--intent` flag was passed, stop here.

---

## Phase 1 — REVEAL (parallel detection)

Goal: produce `findings.json` — structured bloat candidates, no edits made.

### Dispatch four subagents IN ONE MESSAGE (parallel)

Use the `Task` tool with `subagent_type=Explore` four times in a single response. Each subagent gets:
- Verbatim INTENT.md content
- Its category brief from `references/subagent-<category>.md`
- The target scope (absolute path)
- The hard contract: detect only, JSON shape only, never edit

The four subagents:

| # | Subagent | Brief file |
|---|---|---|
| 1 | `code-rot` | `references/subagent-code-rot.md` |
| 2 | `structural-bloat` | `references/subagent-structural-bloat.md` |
| 3 | `dep-bloat` | `references/subagent-dep-bloat.md` |
| 4 | `doc-test-rot` | `references/subagent-doc-test-rot.md` |

### Subagent prompt template

Use this skeleton for each subagent's `prompt` arg:

```
You are the <CATEGORY> detection agent for /calcinate.

TARGET: <absolute path>

INTENT (preserve these — never flag code that serves them):
---
<verbatim INTENT.md>
---

YOUR HUNT:
<verbatim subagent-<category>.md>

OUTPUT CONTRACT:
Return ONE JSON array (and nothing else). Each finding object:
{
  "id": "<kebab-slug, unique>",
  "path": "<relative path>",
  "lines": "<L1-L2 or null>",
  "category": "<your category>",
  "subcategory": "<from your hunt list>",
  "severity": 1-5,
  "intent_mismatch": 0.0-1.0,
  "proposed_action": "delete|inline|extract|rewrite|move",
  "risk_note": "<one line — what could break>",
  "evidence": "<one line — why this is bloat>"
}

HARD RULES:
- Detect only. Never edit. Never run commands that mutate state.
- If a finding would VIOLATE the INTENT, do NOT include it.
- Be specific — exact path + line range, not "somewhere in src/".
- severity: 5 = obvious dead weight; 1 = mild whiff.
- intent_mismatch: 0 = serves declared intent; 1 = directly contradicts it.
- If you find nothing in your category, return [].
- Return JSON only. No prose, no markdown, no headers.
```

### After all four return

1. Parse each subagent's JSON. If a subagent returned non-JSON or errored, note it but continue with the others.
2. Concatenate into one array.
3. Write `.calcinate/runs/<YYYY-MM-DD-HHMM>/findings.json`.

---

## Phase 2 — JUDGMENT (synthesize CALCINATION-PLAN.md)

### Dedupe

Group findings by `(path, lines)` overlap. If multiple subagents flagged the same span:
- Merge into one finding
- Combine categories (e.g., `code-rot+structural-bloat`)
- Take `max(severity)` and `max(intent_mismatch)` across the merged set
- Keep the strictest `proposed_action` (delete > rewrite > extract > inline > move)

### Score

```
risk_score = { delete: 1, move: 2, inline: 2, extract: 3, rewrite: 4 }[proposed_action]
priority   = severity * intent_mismatch / risk_score
```

### Tier

| Tier | Criteria | Behavior on `approve all` |
|---|---|---|
| **1** | subcategory ∈ {dead-export, unused-dep-zero-refs, dead-file-zero-imports}, severity ≥ 3, risk_score ≤ 1, intent_mismatch ≥ 0.7 (or 0.5 if `--aggressive`) | execute autonomously |
| **2** | severity ≥ 3, intent_mismatch ≥ 0.5, not in Tier 1 | execute, but log each |
| **3** | `proposed_action ∈ {move, extract}` — suggests realignment | individual approval required |
| **4** | risk_score ≥ 3 AND intent_mismatch ≥ 0.7 — high impact + high contradiction; OR finding suggests intent itself should change | flag for discussion, do not burn |

### Write the plan

Render `references/plan-template.md` with the tiered findings, sorted by priority within each tier. Write to:
- `.calcinate/runs/<ts>/CALCINATION-PLAN.md`
- `<target>/CALCINATION-PLAN.md` (top-level visibility copy — symlink or copy)

### Present to user

Output in the chat:
- Tier count summary table
- Top 5 findings per tier (id, path, action, evidence)
- Command hint: `approve all` | `approve tier <N>` | `approve <id> <id>...` | `skip <id>` | `pin <id>` | `intent <id>`

If `--reveal-only`, stop here.

---

## Phase 3 — BURN (gated execution)

Wait for the user's approval command. Parse it.

### Setup (once)

1. Verify clean working tree: `git -C <target> status --porcelain`. If dirty and not `--no-branch --force`, halt and instruct user to commit/stash.
2. If no `--no-branch`: `git -C <target> checkout -b calcinate/<YYYY-MM-DD-HHMM>`.
3. Read `.calcinate/verify` for the verify command.

### Per item

For each approved finding id:

1. **Skip pinned**: if `path` matches any glob in `.calcinate/ignore`, mark SKIPPED-PINNED and continue.
2. **Apply** based on `proposed_action`:
   - `delete` → `Bash: rm <path>` (if whole file) OR `Edit` to remove the line range
   - `inline` → `Edit` — paste the wrapped body into the single caller, then delete the wrapper
   - `extract` → `Edit` — move shared code to the suggested target
   - `rewrite` → `Edit` — apply the rewrite (only if subagent provided a concrete patch in `evidence`; otherwise demote to Tier 4)
   - `move` → `Bash: git mv <from> <to>` plus import path updates via `Edit`
3. **Verify**: run `bash .calcinate/verify` (or whatever command is stored). Capture exit code.
4. **Green** → `git -C <target> add -A && git commit -m "chore(calcinate): burn <category> — <one-line>"`
5. **Red** → `git -C <target> restore .` (and `git clean -f` for new untracked files). Mark FAILED with the verify error. Increment consecutive-fail counter.
6. **3 consecutive fails** → halt the run, ask user. Likely the intent or verify command is wrong, not the findings.

### Special commands during burn

If the user invokes a command mid-burn:
- `intent <id>` → halt, route to Phase 0 with this finding as the seed for refining intent. Other queued items remain in the plan for the next run.
- `pin <id>` → add the finding's path (or its glob) to `.calcinate/ignore`. Skip this item. Continue.
- `skip <id>` → mark skipped, continue.

If `--dry-run`: simulate every step but never invoke Edit/Write/Bash mutating ops.

---

## Phase 4 — RESIDUE (final report)

Render `references/residue-template.md` with:
- Tier-by-tier outcome counts: burned / failed / skipped / pinned / discussed
- LOC removed (sum of `lines` ranges for delete actions, or `git diff --shortstat`)
- Files deleted (full-file removals)
- Deps pruned (if `dep-bloat` items burned)
- Full commit list with hashes: `git log --oneline calcinate/<ts>`
- Items deferred to next run (lower confidence)
- Follow-up suggestion: if Tier 4 had ≥ 3 items, recommend `/calcinate --intent` to refresh

Write to `.calcinate/runs/<ts>/RESIDUE.md`. Update top-level `CALCINATION-PLAN.md` to point to it.

---

## Output style

- Brief over verbose. Show numbers, not narratives.
- For Phase 2 plan presentation, use the tier table + top-5-per-tier format.
- For Phase 4 residue, show the bottom-line outcome counts then the commit list.
- No alchemy poetry in operational output. The metaphor is in the name; the work is mechanical.

---

## Files this skill writes

```
<target>/
├── .calcinate/
│   ├── INTENT.md                          # source of truth
│   ├── ignore                             # user-pinned globs
│   ├── verify                             # verify command (executable line)
│   └── runs/<YYYY-MM-DD-HHMM>/
│       ├── findings.json
│       ├── CALCINATION-PLAN.md
│       └── RESIDUE.md
└── CALCINATION-PLAN.md                    # top-level copy of latest plan
```

## See also

- `references/intent-template.md`
- `references/subagent-code-rot.md`
- `references/subagent-structural-bloat.md`
- `references/subagent-dep-bloat.md`
- `references/subagent-doc-test-rot.md`
- `references/plan-template.md`
- `references/residue-template.md`
- [DESIGN.md](./DESIGN.md) — full design spec (architecture, rationale, open decisions resolved)

---

*Calcine to clarify. Then coagulate to build.*
