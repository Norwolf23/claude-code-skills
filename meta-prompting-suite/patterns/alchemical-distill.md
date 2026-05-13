---
name: alchemical-distill
description: Distill a session pattern into a concrete artifact through the Hermetic lens — names the pattern, identifies which of the seven Hermetic principles it reflects, then routes to /meta-distill for the actual write
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Skill, Agent, Task
argument-hint: <topic-or-pattern>
---

# /alchemical-distill — Hermetic Distillation

Take what was learned in this session and turn it into a permanent tool. Distillation is the alchemical operation by which the volatile is fixed.

## Task
$ARGUMENTS

---

## Step 1 — Name the pattern

Restate $ARGUMENTS as a **named pattern**, not a description. Patterns have names that future-you can recognize on sight.

Examples of names that work:
- "voice-first intake" (not "transcribing voice memos before parsing")
- "deploy-verify quadruple" (not "checking the service is actually serving the new code")
- "two-rules access" (not "the way auth apps need both rules")

If the pattern doesn't have a short name yet, propose 3 options and let the user pick.

## Step 2 — Identify the Hermetic correspondence

Which of the seven principles does the pattern reflect?

| Principle | When it applies |
|-----------|-----------------|
| **Mentalism** | "All is mind" — the pattern is about framing, perspective, or how something is understood |
| **Correspondence** | "As above, so below" — pattern repeats across scales or domains |
| **Vibration** | "Nothing rests" — pattern is about flow, frequency, or pace |
| **Polarity** | "Everything is dual" — pattern resolves a tension between opposites |
| **Rhythm** | "Everything flows" — pattern is about cycles, returns, or oscillation |
| **Cause-Effect** | "Every cause has its effect" — pattern is about consequence chains |
| **Gender** | "Generative principle in all" — pattern is about pairing of active+receptive |

State which one, in one sentence, with the connection made explicit. This isn't ornament — it tells you which existing skills might already be the home.

## Step 3 — Apply the φ-classification

Score the pattern's complexity & reusability (0.0–1.0):

| Score | Destination |
|-------|-------------|
| < 0.382 (1/φ²) | **memory** — single non-obvious fact, no workflow |
| 0.382 – 0.618 | **command** — one-shot reusable sequence |
| 0.618 – 0.9 (1/φ – 0.9) | **skill** — multi-step, multi-decision, becomes a verb |
| ≥ 0.9 | **agent** — recurring, autonomous within scope |

## Step 4 — Route through `meta-distill`

Invoke `meta-distill <destination> <named-pattern>` to actually produce the artifact. `meta-distill` handles:

- Meta-design pass
- Frontmatter scaffolding
- Secret scan
- Path placement
- User confirmation before write

## Step 5 — Add the Hermetic correspondence to the artifact

When `meta-distill` writes the file, ensure the body contains a short note:

> _Correspondence: <principle name> — <one-sentence connection>_

This is the alchemical signature. It tells future readers where the pattern came from and which sibling tools it relates to.

## Step 6 — Suggest the next distillation

After writing, look back at the session and propose one more pattern worth distilling, if any. If none, say so.

## Step 7 — Tail summary

> `alchemical-distill · pattern=<name> · principle=<n> · destination=<x> · path=<p>`

---

## Notes

- Resist distilling halfway. A pattern with two examples isn't ready yet; wait for the third.
- Resist distilling too far. A pattern with twenty examples is overdue; it should already be in a skill.
- The Hermetic correspondence isn't optional — it's the lineage marker. Skip it and the artifact won't compose with the rest of the kit.
- For neutral / professional artifacts, route through whichever voice rules apply to that domain first; don't mix Hermetic vocabulary into them.

## Reference

The seven principles come from *The Kybalion* (1908, attributed to "Three Initiates"). Treat them as **diagnostic prompts**, not metaphysics — they're useful as a sorting key because they cover most of the angles a pattern can come from. If a pattern doesn't fit any of the seven, you may have invented a new principle (rare) or the pattern isn't yet clarified (common — keep distilling).
