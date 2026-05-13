---
name: alchemical-goal
description: Frame an objective through the four alchemical stages (Nigredo → Albedo → Citrinitas → Rubedo) and commit it via the built-in /goal. The goal that emerges is not the goal that entered — distillation precedes commitment
allowed-tools: Read, Write, Edit, Bash, Skill, Task
argument-hint: <objective>
---

# /alchemical-goal — Alchemical Goal Framing

Take a raw objective, run it through the **four alchemical stages**, then commit the result via the built-in `/goal` command. The goal that emerges is not the goal that entered — distillation precedes commitment.

## Task
$ARGUMENTS

---

## Step 1 — Read the raw objective

Take $ARGUMENTS as the unrefined objective. If it's a single phrase, expand into a full sentence. If it's a paragraph, condense to one sentence.

## Step 2 — Pass through the four stages

For each stage, write one line. Be concrete. No platitudes.

### Nigredo — Blackening · What dies, what's released
- What assumption, attachment, or habit must be released for this goal to be possible?
- What's the cost of inaction the goal pays back?
- (One sentence.)

### Albedo — Whitening · What's purified, what's clarified
- Strip the objective to its essence — what's the irreducible core?
- What are we NOT doing? (Define by negation.)
- (One sentence.)

### Citrinitas — Yellowing · What shines, what's the first win
- What's the smallest visible proof the goal is moving?
- Pick the earliest checkpoint that an observer would recognize.
- (One sentence.)

### Rubedo — Reddening · What's incarnated, what's shipped
- What does the finished thing look like — concrete, observable, dated if possible?
- The deliverable in one sentence.
- (One sentence.)

## Step 3 — Synthesize

Compose a goal statement that fits the shape:

> **Goal:** <Rubedo core>
> **By releasing:** <Nigredo>
> **Reduced to:** <Albedo>
> **First proof:** <Citrinitas>

## Step 4 — Commit via `/goal`

Hand the synthesized goal to the built-in `/goal` command:

```
/goal <synthesized statement>
```

If `/goal` is unavailable in this session, append the goal to `~/.claude/projects/<project-key>/goals/active.md` and tell the user to run `/goal` later.

## Step 5 — Note the next move

After committing, suggest exactly one immediate next action that would produce the Citrinitas proof. Make it tiny, doable, and concrete.

## Step 6 — Tail summary

> `alchemical-goal · stages=4 · committed · next=<one-action>`

---

## Notes

- The four-stage framing isn't decoration — each stage is a question. If a stage produces a platitude, the question wasn't answered. Re-ask.
- Avoid "I will..." statements. Use direct, deed-form language ("Ships a working X by Y").
- If the four Latin names feel too poetic, drop them and keep the questions: **release / clarify / first-proof / deliverable**. The structure does the work, not the vocabulary.
- For neutral or professional goals, use `meta-goal` instead — same idea, different scaffolding.

## Reference

The four-stage progression comes from European alchemical tradition (the *opus alchymicum*) — see Carl Jung's *Mysterium Coniunctionis* for the psychological reading. The structure is durable across many domains because it matches a real cognitive sequence: shed the wrong thing first, clarify what remains, prove movement, deliver substance.
