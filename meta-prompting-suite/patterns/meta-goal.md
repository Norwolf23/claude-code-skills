---
name: meta-goal
description: Neutral 4-quadrant goal framer — decomposes an objective into scope/criteria/timing/non-goals and commits via the built-in /goal command. Auto-suggests redirect to a domain-specific goal framer if the objective is clearly tied to one
allowed-tools: Read, Write, Edit, Bash, Skill, Task
argument-hint: [--neutral] <objective>
---

# /meta-goal — Neutral Goal Framer

The bridge-side goal command. For domain-flavored objectives, defers to the matching specialist (`alchemical-goal` for personal/creative work, your own domainB-goal for professional). For everything else — cross-cutting, learning goals, exploratory objectives — frames it neutrally and commits via the built-in `/goal`.

## Task
$ARGUMENTS

---

## Step 1 — Detect domain

Apply the same signal map as `meta-prime`:

- Personal/creative signals → suggest `alchemical-goal` and ask "redirect?"
- Professional/infra signals → suggest your domainB-goal and ask "redirect?"
- `--neutral` flag → skip detection, frame neutrally
- No domain signal → frame neutrally

If user accepts redirect, hand off and exit. Otherwise continue.

## Step 2 — Decompose into four quadrants

For a neutral objective, more flavorful framings overspecify. Use a simpler 4-quadrant decomposition:

### Scope
- What is the objective in one sentence?
- What surface does it touch? (project / repo / file / external)

### Criteria
- How will we know it's done? (specific, observable, verifiable)
- What is the minimum acceptable result?

### Timing
- Is there a deadline? (absolute date or relative window)
- Is there a dependency that must finish first?
- (If neither, write "no fixed timing — pull-based.")

### Non-goals
- What is explicitly OUT of scope?
- What might tempt scope creep that we're refusing?

## Step 3 — Synthesize one-line goal statement

Shape:

> **Goal:** <one-sentence scope> · **Done when:** <criterion> · **By:** <timing or "pull-based"> · **Not:** <key non-goal>

## Step 4 — Commit via `/goal`

Hand the one-liner to the built-in `/goal`:

```
/goal <synthesized statement>
```

If `/goal` isn't available, append to a local goals file (`~/.claude/projects/<project-key>/goals/neutral-active.md`).

## Step 5 — Suggest first action

One concrete, doable, immediate next step that produces visible progress toward the criterion. Tiny is fine.

## Step 6 — Tail summary

> `meta-goal · scope=<one-phrase> · done-when=<one-phrase> · timing=<x> · next=<action>`

---

## Notes

- `meta-goal` is for goals that don't fit a specialist cleanly. Most goals DO fit one — don't fight the detector.
- For learning goals ("learn X", "understand Y"), `meta-goal` is the right choice — they're neutral and other framings would be ornament.
- For multi-month strategic objectives, prefer a full plan (`/meta-plan` or similar) — goals are commitments, plans are routes; sometimes you need the route before the commitment is meaningful.
- The 4 quadrants are mandatory. If a quadrant can't be filled, the goal isn't ready — refine the objective first.
