---
name: alchemical-flow
description: Multi-stage orchestration with planetary specialists. φ-routes complexity to a 1, 3, 4, or 7-stage flow. The 7-stage version invokes Sun/Moon/Mercury/Venus/Mars/Jupiter/Saturn passes (or your domain-specific equivalents) for top-tier complexity
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Skill, Agent, Task
argument-hint: <intent> [--full | --quick | --focus=identity|hardening|growth|empathy|aesthetics|comm|durability]
---

# /alchemical-flow — Orchestrated Multi-Stage

A multi-stage execution that uses planetary specialists when warranted. Not every task needs seven passes; this command picks the right cardinality.

## Task
$ARGUMENTS

---

## Step 1 — Score complexity (φ-routed)

| Score | Cardinality | Stages |
|-------|-------------|--------|
| < 0.382 | 1 | Direct execute via `alchemical-prompt` |
| 0.382 – 0.618 | 3 | Sun → Mars → Saturn (identity → hardening → durability) |
| 0.618 – 0.85 | 4 (inner) | Sun → Moon → Mercury → Venus (identity → empathy → communication → aesthetics) |
| ≥ 0.85, or `--full` | 7 | Full planetary sweep |

If the user passes `--focus=<aspect>`, run **only** that one stage and skip the others. Useful for "make this beautiful" (Venus) or "harden this" (Mars).

## Step 2 — Per-stage execution

For each chosen stage, invoke the corresponding specialist:

| Stage | Question | Default skill / command |
|-------|----------|-------------------------|
| Sun | "Who are we? What is this?" — identity, core thesis | `/meta-sun` or domain identity audit |
| Moon | "What do users feel?" — empathy, emotional path | `/meta-moon` or UX-empathy pass |
| Mercury | "Will they understand?" — communication, clarity | `/meta-mercury` or copy review |
| Venus | "Is it beautiful?" — aesthetics, design | `/meta-venus` or design polish |
| Mars | "Is it production-ready?" — hardening, vibe-code audit | `/meta-mars` or [`vibe-proof`](../../vibe-proof/) |
| Jupiter | "How do we expand?" — growth, leverage | `/meta-jupiter` or growth strategy |
| Saturn | "Will it endure?" — structure, longevity | `/meta-saturn` or refactor-for-durability |

If you don't have the planetary specialists installed, substitute equivalents:

- Sun → "what is the core thesis?"
- Moon → "what is the user feeling?"
- Mercury → "is this clear?"
- Venus → "is this beautiful?"
- Mars → "is this hardened?"
- Jupiter → "how does this expand?"
- Saturn → "will this last?"

For each stage, capture the output as a sub-section in a running `flow-report.md`.

## Step 3 — Inter-stage gates

Between stages, briefly check: does the next stage still make sense given what the previous stage discovered? If a stage would be redundant or contradictory, **skip it and log why**.

This is the difference between an orchestrator and a checklist. Skip-with-reason is acceptable; skip-without-reason is undisciplined.

## Step 4 — Synthesize

After the last stage, write a **synthesis section**:

- What changed across the passes?
- Which stage produced the most signal?
- What's the single most important insight?
- What's the next action?

## Step 5 — Persist

Write the flow report to `~/.claude/projects/<project-key>/flows/<YYYY-MM-DD-slug>.md`. If `alchemical-distill`-worthy patterns emerged, suggest distilling them.

## Step 6 — Tail summary

> `alchemical-flow · stages=<n> · skipped=<k> · synthesis=<one-phrase> · report=<path>`

---

## Notes

- This is not a replacement for a full Hermetic 7-pass tool (if you have one). It's φ-routed — most asks deserve fewer stages.
- If the user explicitly wants 7 passes, pass `--full`.
- `--focus=<aspect>` is the most underused option — most asks are actually single-aspect ("make it pretty", "harden it"). Don't over-orchestrate.
- For professional / neutral multi-stage work, use a domain-specific flow that respects your domain's gates (e.g., deploy-verify, PM-update protocol) instead of planetary stages.

## Reference

The planetary correspondences come from Renaissance Hermetic / astrological tradition. Treat them as **angle-of-attention prompts**, not metaphysics — Mars-as-hardening is a useful prompt because the planet's symbolism (action, conflict, friction) maps directly to production-readiness work. The set of seven covers most angles a project benefits from looking at.
