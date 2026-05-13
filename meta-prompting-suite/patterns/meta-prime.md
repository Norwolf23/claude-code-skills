---
name: meta-prime
description: Universal meta-prompt entry — detects domain context from cwd, hostname, and vocabulary; routes to the right specialist; falls back to neutral /meta if no domain claims the task
allowed-tools: Read, Grep, Glob, Bash, Skill, Agent
argument-hint: [--<domainA>|--<domainB>|--neutral|--explain] <task>
---

# /meta-prime — Prime Mover

The universal entry point to a meta-prompting suite. Sniffs context, picks the right voice, delegates to the right specialist. Falls back to plain `/meta` when no domain claims the task.

## Task
$ARGUMENTS

---

## Customize this router

Edit the **domain signals** table below for your setup. The shipped version assumes you have two specialist suites: one for `domainA` (e.g., personal/creative work) and one for `domainB` (e.g., professional/client work). Add more domains as needed.

| Domain | cwd anchor | vocab signals | terminal target |
|--------|------------|---------------|-----------------|
| `domainA` | `~/projects/personal/`, `~/.config/<brand>/` | brand names, personal-project tokens | `/<a>-prompt` |
| `domainB` | `~/projects/client/`, `~/work/` | client-product names, infra tokens | `/<b>-prompt` |
| neutral | anything else | absent both | `/meta` |

## Step 1 — Parse flags

Look at $ARGUMENTS for explicit overrides:

- `--<domainA>` → force route to domainA specialist, strip flag from task
- `--<domainB>` → force route to domainB specialist, strip flag from task
- `--neutral` → bypass routing, hand straight to `/meta`
- `--explain` → describe the routing decision instead of executing

If none present, run Step 2.

## Step 2 — Detect context

Check **in this order**, stop at first match:

1. **Explicit project signals** in cwd OR task text
2. **cwd anchors** (project-root patterns you define)
3. **Hostname** (if SSH'd to a known specialist machine)
4. **Vocabulary signals** in the task text (project-specific tokens)
5. **No match** → fall back to `--neutral`

## Step 3 — Route

Before invoking the next command, **announce the decision in one sentence**:

> `meta-prime → /<target> · reason: <one phrase>`

Then call the chosen target, passing the cleaned task string (flags stripped).

## Step 4 — Execute

Run the chosen target. Surface any errors with file:line.

## Step 5 — Tail summary

After completion, one line:

> `meta-prime ← <target> · tier=<L?> · mode=<active|iterative> · quality=<score-if-known>`

---

## Design notes

- `meta-prime` is **deterministic** by design. The user should always know what to expect — no learning, no adaptation. If you want adaptive routing, layer it on top, don't bake it in.
- Idempotent: same task + same cwd → same routing decision.
- The fallback to `--neutral` should be honest about ambiguity rather than guess. Better to ask the user once than to silently route wrong.
- Soft tiebreakers (time-of-day, day-of-week) are optional. Only add one if your domains are truly time-bound (e.g., work hours vs personal hours).

## Composes with

- `meta-distill` — when the prime delivers a result, distill the pattern if it's worth keeping
- `alchemical-prompt` / `<b>-prompt` — the typical downstream targets
- Built-in `/goal` — `meta-prime` can route directly to `meta-goal` for objective-framing tasks
