---
name: meta-prompting-suite
description: Opinionated meta-prompting command suite — 9 composable patterns built on categorical foundations. Use when the user wants to set up a meta-prompting workflow, route prompts by context, frame goals, build subagents, distill session learnings into durable artifacts, or invoke the alchemical 4-stage / Hermetic-correspondence patterns for personal/creative work.
---

# Meta-Prompting Suite

> Nine composable patterns. One bridge layer. Built on categorical foundations.

This skill provides nine opinionated meta-prompting patterns that compose together. They sit ABOVE the categorical engine ([ormus-meta-prompting](https://github.com/HermeticOrmus/ormus-meta-prompting)) and BELOW your daily slash commands — turning raw prompts into context-aware, voice-consistent, artifact-producing workflows.

## When to invoke

- User asks to set up a meta-prompting workflow
- User wants a router that picks voice/priors based on context
- User wants to frame a goal, build an agent, or distill a session pattern
- User mentions "alchemical", "hermetic", "categorical meta-prompting", or names one of the 9 patterns

## The nine patterns

The suite splits into two halves:

### Neutral layer (4) — domain-agnostic

| Pattern | Job |
|---------|-----|
| [`meta-prime`](./patterns/meta-prime.md) | Universal entry — sniffs context, routes to the right specialist |
| [`meta-distill`](./patterns/meta-distill.md) | Bridges meta2-style design to a concrete artifact (memory/skill/agent/command); applies φ-classification |
| [`meta-goal`](./patterns/meta-goal.md) | Neutral 4-quadrant goal framer (scope/criteria/timing/non-goals) → built-in `/goal` |
| [`meta-agents`](./patterns/meta-agents.md) | Agent portfolio surface — survey/audit/gap-find/dedupe/retire across `~/.claude/agents/` |

### Alchemical layer (5) — Hermetic-flavored, opinionated

| Pattern | Job |
|---------|-----|
| [`alchemical-prompt`](./patterns/alchemical-prompt.md) | Categorical meta-prompt with Gold Hat constraints, teaching tone, alchemical lens |
| [`alchemical-agent`](./patterns/alchemical-agent.md) | Generate a subagent definition under `~/.claude/agents/`, then opens `/agents` |
| [`alchemical-goal`](./patterns/alchemical-goal.md) | Frame objective through Nigredo → Albedo → Citrinitas → Rubedo, commits via `/goal` |
| [`alchemical-distill`](./patterns/alchemical-distill.md) | Session pattern → named artifact, marked with one of the seven Hermetic principles |
| [`alchemical-flow`](./patterns/alchemical-flow.md) | φ-routed multi-stage orchestration; invokes planetary specialists for top-tier complexity |

## How they compose

```
User asks anything
   ↓
/meta-prime (universal entry)
   ↓ routes by cwd + signals
   ↓
neutral patterns OR alchemical patterns
   ↓ each loads its priors + relevant skills
   ↓
existing engine (categorical /meta, meta2 agent, planetary specialists)
   ↓
terminal sinks: /goal · /agents · /meta-distill
```

## Why this shape

- **Voice diverges, math doesn't.** The neutral 4 are tone-free. The alchemical 5 add Hermetic vocabulary where it helps — the categorical core is the same.
- **Priors load by signal, not by default.** No pattern auto-loads everything; each pulls only what the task requires.
- **Built-in `/goal` and `/agents` are terminal sinks**, not replacements. The suite produces inputs for them.
- **Total weight ~1300 lines across 9 thin patterns** — proves the wrapper thesis (no engine duplication).

## Installation

This suite assumes you already use Claude Code. To install:

```bash
# Clone the skills repo
git clone https://github.com/HermeticOrmus/claude-code-skills.git ~/projects/claude-code-skills

# Copy the suite to your skills directory
cp -r ~/projects/claude-code-skills/meta-prompting-suite ~/.claude/skills/

# Optional: convert any pattern to a slash command
# Copy patterns/<pattern>.md to ~/.claude/commands/<pattern>.md
# The frontmatter at top of each pattern is slash-command-ready
```

You may also want:

- [`ormus-meta-prompting`](https://github.com/HermeticOrmus/ormus-meta-prompting) — the categorical foundations underneath
- [`ormus-handoff`](https://github.com/HermeticOrmus/ormus-handoff) / [`ormus-pickup`](https://github.com/HermeticOrmus/ormus-pickup) — session lifecycle for `/meta-distill` to feed
- [`unwoke`](../unwoke/) — voice rules that pair well with `alchemical-prompt`

## Customization

Each pattern includes a **Customize** section near the top. Edit:

- Domain signals in `meta-prime` (the cwd / vocabulary triggers that route to your specialists)
- Voice priors in `alchemical-prompt` (the philosophy / brand you load)
- Hermetic correspondences in `alchemical-distill` (which of the seven principles you reach for)

The suite is opinionated by default. Replace the opinions with yours.

## Customize for your domain

The neutral 4 work out of the box. The alchemical 5 ship with HermeticOrmus voice (Gold Hat, teaching-over-doing, alchemical vocabulary). If that doesn't match yours, either:

1. **Fork the alchemical patterns** and replace the voice priors with yours
2. **Use only the neutral 4** and write your own domain layer on top of `meta-prime`'s router
3. **Compose both layers** — neutral for work, alchemical for personal/creative

## License

MIT (see repo root).

## Provenance

Distilled from the working meta-prompting kit on a polymath operator's machine — used daily across TMS work, design work, personal Hermetic projects. Not theoretical. The pattern names match the actual slash commands the author types every day.
