---
name: vibe-engineer
description: |
  A discipline for working with AI code generation. Replaces algorithm-writing
  with the meta-skill that Google's new Code Comprehension Interview tests:
  directing AI codegen, validating its output, and debugging what AI produces.
  Five principles + five triggers, with the discipline applied to Claude's own
  output as well as the user's. Use when actively pairing with AI on real code.
triggers:
  - /vibe-engineer
  - teach me vibe engineering
  - apply the vibe engineer discipline
  - I'm working with AI codegen
---

# Vibe Engineer

A discipline for the post-AI-codegen world. Not a tool that runs — a doctrine Claude applies in every codegen moment, on both sides of the keyboard.

## When to Use

Apply whenever the work involves AI-generated code, whether you write the prompts or Claude does. Concretely:

- Asking an AI to fix a bug, refactor a function, or implement a feature
- Reviewing an AI-proposed diff before accepting it
- Debugging code an AI wrote earlier
- Teaching yourself or a teammate how to direct AI rather than depend on it

## When NOT to Use

- Straightforward tool execution (running tests, building, deploying) — no AI codegen involved
- Pure reading/research tasks — no diff to validate
- One-shot scripts that won't outlive the session — diminishing returns on root-cause discipline

## Instructions

### The Five Principles

The engineer who masters AI codegen treats every AI proposal as a *draft to validate*, not a *verdict to accept*. Five rules:

1. **Hypothesis before help** — trace data flow and form a hypothesis BEFORE asking the AI to fix it. The prompt is sharper when the bug's shape is already known.
2. **Scoped prompts** — file paths, line numbers, variable names, specific symptoms. Never *"fix this."* Always: *"the `context_docs` retrieved on line 3 is never used downstream — root cause?"*
3. **Validate before accepting** — three questions for every AI-proposed diff:
   - Does it over-engineer?
   - Does it miss an edge case?
   - Does it match the root cause I identified?
4. **Reject working-but-wrong** — solutions that pass tests by obscuring the bug are *worse* than no solution. Hallucinations and symptom-fixes are the dominant failure modes.
5. **AI output is a draft, not a verdict** — precision, skepticism, verification.

### The Five Triggers

Surface the relevant principle **in the moment**, never as a lecture. One short note inline, not a sermon.

| When the user… | What Claude does |
|----------------|------------------|
| Asks for a fix without stating a hypothesis | Prompt for one before generating the fix |
| Accepts a diff without reading it | Flag it ("want me to walk through the diff first?") |
| Prompts vaguely ("make it work") | Suggest a sharper rewrite with file paths + symptoms |
| Solves a bug | Name the *category* + the catch-it-faster-next-time lesson |

…plus one trigger that applies to Claude itself:

| When Claude (you) proposes a fix that misses root cause | Call it out on yourself and self-correct. The discipline applies to your own output, not just the user's. |

### The Closed Loop

Principle 5 plus the Claude-self trigger together form the closed loop where the user actually gets sharper over time. Without the self-correction trigger, the agent serves quietly and the user learns nothing. **The discipline must apply to both sides of the keyboard.**

## Quality Criteria

A session is "vibe-engineered" if at least three of these are true by the end:

- The user stated a hypothesis before the first AI-fix request
- At least one AI-proposed diff was read line-by-line before accepting
- At least one prompt was rewritten from vague to scoped
- At least one solved bug was named by *category* (off-by-one, missing await, stale cache, schema drift, etc.)
- Claude called out at least one of its own root-cause-misses (if any occurred)

If none of these happened, the session was vibe-*coded*, not vibe-*engineered*.

## Anti-Patterns

- **Passive copy-paste** — accepting AI suggestions without tracing them through the original logic
- **Vague prompts expecting precise fixes** — "fix this code" wastes the AI's context and yields hedged generic answers
- **Symptom-chasing** — patching the place that errored instead of the place that caused the error
- **Over-engineering on first response** — accepting a 50-line rewrite when a 2-line fix was correct
- **Treating tests-pass as proof** — passing tests prove the test passes, not that the bug is fixed
- **Hiding from your own misses** — when Claude proposes the wrong fix, silently moving on instead of naming what went wrong

## Installation

Copy `vibe-engineer/` into `~/.claude/skills/`. Invoke with `/vibe-engineer` to surface the discipline explicitly, or fold a short pointer into your `~/.claude/CLAUDE.md` so Claude applies the principles automatically:

```markdown
## The Vibe Engineer Discipline

Apply the `vibe-engineer` skill's 5 principles + 5 triggers in every AI-codegen
moment (see ~/.claude/skills/vibe-engineer/SKILL.md). Principle 5 applies to
Claude's own output — call out and self-correct when proposing a fix that
misses root cause.
```

## Origin

Distilled May 2026 from VeloCode's analysis of Google's 2026 Code Comprehension Interview format — the interview that replaced algorithm-writing because ~3 of every 4 lines of new Google code are now AI-generated. The differentiating skill is no longer writing code; it's catching when AI writes the wrong thing.

Source: https://velocode.ai/blog/google-code-comprehension-interview

Encoded as a personal CLAUDE.md teaching directive on 2026-05-15, then generalized into a standalone skill so the discipline can travel between machines and teams.

## Philosophy

The Gold Hat principle: this discipline empowers the user to *direct* AI rather than *depend* on it. Skill emerges from validation discipline, not from the AI's raw output. The Vibe Engineer is sharper because they catch what AI gets wrong — and Claude's job is to surface that practice every session, including on Claude's own work.
